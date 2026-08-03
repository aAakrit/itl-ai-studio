/* eslint-disable prettier/prettier */
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

/**
 * This project is a TanStack Start SSR application (not a SPA):
 *  - `src/routes/__root.tsx` renders the full HTML shell (`shellComponent`)
 *  - `src/server.ts` is the server entry (wired via `tanstackStart.server.entry`)
 *  - the build emits BOTH `dist/client` (browser assets) and `dist/server` (SSR handler)
 *
 * The build output shape is decided by the Nitro preset:
 *  - default (Lovable hosting)      → `cloudflare-module` → dist/server/index.mjs (a Worker)
 *  - `DEPLOY_TARGET=node` (self-host) → `node-server`      → dist/server/index.mjs (a Node HTTP server)
 *
 * `vite preview` and any self-hosted deployment (Windows Server 2019 + Nginx)
 * need the Node preset, hence the env switch below. Nothing about SSR is removed —
 * only the runtime the server bundle is emitted for.
 */
const nodeTarget = process.env.DEPLOY_TARGET === "node";

export default defineConfig({
  tanstackStart: {
    server: {
      entry: "server",
    },
  },

  nitro: nodeTarget
    ? {
        preset: "node-server",
        // Keep a predictable, documented deploy layout instead of Nitro's default `.output/`.
        output: { dir: "dist", serverDir: "dist/server", publicDir: "dist/client" },
      }
    : {},

  vite: {
    server: {
      host: "0.0.0.0",
      port: 8080,
      allowedHosts: true,
    },
    build: {
      // SSR already ships HTML; keep CSS split per route and skip prod sourcemaps.
      cssCodeSplit: true,
      sourcemap: false,
      chunkSizeWarningLimit: 900,
      rolldownOptions: {
        output: {
          advancedChunks: {
            groups: [
              // React runtime — shared by every route, cached across deploys.
              { name: "vendor-react", test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/, priority: 100 },
              // Router/query runtime.
              { name: "vendor-tanstack", test: /node_modules[\\/]@tanstack[\\/]/, priority: 90 },
              // Without this, every lucide icon becomes its own chunk — the landing
              // page was issuing ~47 extra HTTP requests, which dominated LCP.
              { name: "vendor-icons", test: /node_modules[\\/]lucide-react[\\/]/, priority: 80 },
              { name: "vendor-motion", test: /node_modules[\\/]framer-motion[\\/]/, priority: 70 },
              { name: "vendor-radix", test: /node_modules[\\/](@radix-ui|cmdk|vaul|input-otp)[\\/]/, priority: 60 },
              // Markdown/highlighting only used inside the workspace chat.
              {
                name: "vendor-markdown",
                test: /node_modules[\\/](react-markdown|remark-.*|rehype-.*|micromark.*|mdast-.*|hast-.*|unist-.*|vfile.*|react-syntax-highlighter|refractor|highlight\.js|prismjs)[\\/]/,
                priority: 50,
              },
            ],
          },
        },
      },
    },

  },
});
