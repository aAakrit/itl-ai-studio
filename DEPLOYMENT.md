# ITL AI — Production build & Windows Server 2019 deployment

## What this project is (audit result)

**A TanStack Start SSR application.** Not a SPA, not static-only:

| Evidence | File |
| --- | --- |
| Full HTML document rendered on the server (`shellComponent`, `<HeadContent />`, `<Scripts />`) | `src/routes/__root.tsx` |
| Custom server entry (fetch handler + error normalisation) | `src/server.ts` |
| Request middleware executed server-side | `src/start.ts` |
| Server entry wired into the build | `vite.config.ts` → `tanstackStart.server.entry: "server"` |
| Build emits **two** outputs: `dist/client` (browser assets) and `dist/server` (SSR handler) | `vite build` output |

Routes are file-based under `src/routes/` and code-split automatically; there is
no `index.html` shipped, so a static/SPA-only deployment is not possible without
losing SSR. SSR was therefore **kept**.

## Root cause of `Cannot find module dist/server/server.js`

The build pipeline is:

```
vite build
 ├─ client environment  → dist/client/assets/*        (browser)
 ├─ ssr environment     → TanStack Start SSR bundle
 └─ nitro plugin        → re-bundles the SSR output for a deploy target (preset)
```

1. `@lovable.dev/vite-tanstack-config` adds the Nitro plugin with the
   **`cloudflare-module`** preset, whose server entry is `dist/server/index.mjs`
   (a Cloudflare Worker module — it does not listen on a TCP port).
2. `vite preview` is served by TanStack Start's `preview-server-plugin`, which
   imports `<serverOutDir>/<serverEntryBasename>.js`. Because the server entry is
   `src/server.ts`, it looks for **`dist/server/server.js`** — the pre-Nitro
   filename. Nitro replaced that file with `index.mjs`, so the import fails with
   `ERR_MODULE_NOT_FOUND`.

So: nothing was "missing" — `vite preview` was pointed at a filename that the
Cloudflare Nitro output never produces. Two real fixes were needed:

* build a **Node** server bundle for self-hosting (Cloudflare Workers cannot run
  on Windows Server), and
* preview through Nitro's own documented preview command instead of the
  incompatible `vite preview` path.

## Build commands

```bash
npm install

# Lovable / Cloudflare deploy (unchanged default)
npm run build

# Self-hosted Node build → dist/client + dist/server/index.mjs
npm run build:node

# Build for Node and run it exactly like production
npm run preview

# Run an already-built Node bundle
npm run start          # NODE_ENV=production node dist/server/index.mjs
```

`DEPLOY_TARGET=node` (set by the scripts via `cross-env`, so it works in
PowerShell and cmd.exe) switches Nitro to the `node-server` preset and pins the
output layout to `dist/`.

Output layout of `npm run build:node`:

```
dist/
├─ client/            static assets — served directly by Nginx
│  ├─ assets/…        content-hashed JS/CSS (immutable, 1y cache)
│  └─ favicon.ico …
├─ server/
│  ├─ index.mjs       Node HTTP server (entry point)
│  ├─ package.json    { "type": "module" }
│  └─ _libs/ _ssr/ …  server chunks
└─ nitro.json
```

## Windows Server 2019 deployment (SSR + Nginx)

Prerequisites: Node.js 22 LTS (x64 MSI), Nginx for Windows in `C:\nginx`, PM2
(`npm i -g pm2 pm2-windows-startup`).

```powershell
# 1. Build (on a build machine or on the server)
cd C:\build\itl-ai
npm ci
npm run build:node

# 2. Ship the release
$rel = "C:\apps\itl-ai\releases\$(Get-Date -Format yyyyMMdd-HHmm)"
New-Item -ItemType Directory -Force $rel | Out-Null
Copy-Item -Recurse dist            $rel\dist
Copy-Item ecosystem.config.cjs     $rel\
Copy-Item .env                     $rel\ -ErrorAction SilentlyContinue

# 3. Point "current" at the new release (junction = instant rollback)
cmd /c rmdir C:\apps\itl-ai\current 2>$null
cmd /c mklink /J C:\apps\itl-ai\current $rel

# 4. Run it under PM2 as a Windows service
cd C:\apps\itl-ai\current
pm2 start ecosystem.config.cjs
pm2 save
pm2-startup install          # resurrects PM2 (and the app) on reboot

# 5. Nginx
Copy-Item deploy\nginx\itl-ai.conf C:\nginx\conf\conf.d\itl-ai.conf
C:\nginx\nginx.exe -t                       # validate
C:\nginx\nginx.exe -s reload                # or: Start-Service nginx
```

Node listens on `127.0.0.1:3000` (`HOST`/`PORT` in `ecosystem.config.cjs`);
Nginx (`deploy/nginx/itl-ai.conf`) terminates TLS, serves `dist/client` from
disk with immutable caching + gzip, and proxies everything else to Node.

Alternative to PM2 (no Node process manager): install as a native service with
[NSSM](https://nssm.cc/):

```powershell
nssm install ITL-AI "C:\Program Files\nodejs\node.exe" "C:\apps\itl-ai\current\dist\server\index.mjs"
nssm set ITL-AI AppDirectory C:\apps\itl-ai\current
nssm set ITL-AI AppEnvironmentExtra NODE_ENV=production HOST=127.0.0.1 PORT=3000
nssm start ITL-AI
```

Firewall: open 80/443 only. Port 3000 must **not** be exposed publicly.

Because this is SSR, do **not** add an SPA `try_files $uri /index.html` fallback
— deep links and refreshes are resolved by the Node server.

## Environment variables

`.env` values prefixed with `VITE_` (e.g. `VITE_API_BASE_URL`) are inlined at
**build time**. Changing the API host requires a rebuild, not just a restart.
The current backend at `http://162.219.30.161:8000` must send
`Access-Control-Allow-Origin` for the site's origin (or be proxied through the
same Nginx under `/api/`), otherwise browser calls fail with CORS errors.

## Performance work (measured on the production Node server)

| Metric | Before | After |
| --- | --- | --- |
| Requests to render `/` | 66 | 19 |
| Client chunks emitted | 1766 | 93 |
| LCP | ~9 s | ~0.2 s |
| DOMContentLoaded | — | 0.17 s |

Changes:

* **Icon fan-out removed** — `src/components/common/Icon.tsx` no longer falls back
  to `lucide-react/dynamic`, which referenced the whole icon set (~240 kB dep map
  + ~1500 single-icon chunks). The landing page was fetching ~47 separate icon
  files. Unknown CMS icon names now render a `Circle` placeholder; add new names
  to the map in that file.
* **Deterministic vendor chunking** (`vite.config.ts` →
  `build.rolldownOptions.output.advancedChunks`): `vendor-react`,
  `vendor-tanstack`, `vendor-icons`, `vendor-motion`, `vendor-radix`,
  `vendor-markdown`. Long-term cacheable and far fewer requests.
* **Route code splitting restored** — `src/routes/admin.content.tsx` had
  `export default function AdminContentPage()`. Exporting a route component
  disables TanStack Router's automatic splitting ("These exports will not be
  code-split") and pulled the admin content page into the main bundle. The export
  was removed.
* **Heavy libraries stay lazy** — verified `jspdf`, `jspdf-autotable`, `docx`,
  `html2canvas`, `file-saver` (export pipeline), `ckeditor5` (1.7 MB, admin rich
  text) and `recharts` are only reachable through dynamic `import()`; none appear
  in the landing page's request list.
* **Duplicate React keys fixed** — CMS/API-driven lists keyed on content strings
  (`item.to`, `s.title`, `r.capability`, …) now use `` `${value}-${index}` ``
  in `src/features/landing/sections.tsx`, `src/layouts/PublicLayout.tsx` and
  `src/layouts/AdminLayout.tsx`.
* Production sourcemaps disabled; chunk-size warning limit raised to 900 kB (only
  the lazily loaded CKEditor bundle exceeds it).

## Remaining recommendations

1. **CKEditor 5 (1.7 MB JS + 213 kB CSS)** is the largest asset in the project.
   It is admin-only and lazy, but consider a lighter editor if admins are on slow
   links.
2. **Proxy the backend through Nginx** (`location /api/ { proxy_pass http://162.219.30.161:8000/; }`)
   and set `VITE_API_BASE_URL=/api` — removes CORS entirely and lets HTTPS cover
   API traffic.
3. **Server-side data loading**: the landing page still fetches CMS content from
   the browser after hydration. Moving it into a route `loader` would let SSR ship
   fully populated HTML.
4. Add `pm2 logrotate` and monitor `C:\apps\itl-ai\logs`.
5. Keep one previous release folder for one-command rollback (re-point the
   `current` junction and `pm2 restart itl-ai`).
