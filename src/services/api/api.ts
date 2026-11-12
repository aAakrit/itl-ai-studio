/* eslint-disable prettier/prettier */
/**
 * Central networking layer.
 * Scaffold with interceptors, retry, refresh-token, and error-handling
 * placeholders. Services return mock data in dev; replace only the service
 * implementation to switch to a real backend.
 */
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  AxiosError,
} from "axios";

export interface ApiEnv {
  baseURL: string;
  timeout: number;
}

const env: ApiEnv = {
  baseURL: (import.meta.env.VITE_API_BASE_URL as string) ?? "/api",
  timeout: 120_000,
};


function getAuthToken(): string | null {
  return useAuthStore.getState().token;
}

async function refreshAuthToken(): Promise<string | null> {
  return null;
}

// Routes that don't require auth — a 401 from an API call made while on
// one of these can never mean "your session just expired" (there's no
// session to expire), so the global redirect below must never fire here.
// This is the actual fix for a real bug: an anonymous visitor with a
// stale/invalid token left over in localStorage from a previous session
// would trigger AuthProvider's `useMe(!!token)` on ANY page — including
// mid-registration — get a 401, and get hard-redirected to /login,
// wiping whatever they'd typed into the form.
const PUBLIC_PATH_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/otp",
  "/pricing",
  "/about",
  "/contact",
  "/terms",
  "/privacy",
  "/refund",
  "/cancellation",
  "/disclaimer",
  "/intellectual-property",
  "/faq",
  "/welcome",
];

function isOnPublicPage(): boolean {
  if (typeof window === "undefined") return false;
  const path = window.location.pathname;
  return path === "/" || PUBLIC_PATH_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

function createApi(config: Partial<ApiEnv> = {}): AxiosInstance {
  const instance = axios.create({
    baseURL: config.baseURL ?? env.baseURL,
    timeout: config.timeout ?? env.timeout,
    headers: { "Content-Type": "application/json" },
  });

  instance.interceptors.request.use((req) => {
    const token = getAuthToken();
    if (token && req.headers) req.headers.Authorization = `Bearer ${token}`;
    return req;
  });

  instance.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
      const original = error.config as AxiosRequestConfig & { _retry?: boolean };

      // A request that never carried a token can't have had "its session
      // expire" — that 401 means something else (a public endpoint
      // legitimately denying access, a misconfigured route, etc.) and
      // must not trigger a global logout+redirect.
      const requestHadToken = Boolean(
        (original?.headers as Record<string, unknown> | undefined)?.Authorization,
      );

      if (error.response?.status === 401 && original && !original._retry && requestHadToken) {
        original._retry = true;
        const fresh = await refreshAuthToken();
        if (fresh && original.headers) {
          original.headers.Authorization = `Bearer ${fresh}`;
          return instance.request(original);
        }

        useAuthStore.getState().clear();
        useChatStore.getState().reset();
        useWorkspaceStore.getState().reset();

        // Never redirect away from a public page — there's nothing to
        // protect there, and doing so can interrupt something the person
        // is actively filling out (registration, password reset, etc.).
        if (typeof window !== "undefined" && !isOnPublicPage()) {
          // The ITL Bridge AI Allow page must survive a re-login with its
          // txn / return_url intact.
          const { pathname, search } = window.location;
          window.location.assign(
            pathname === "/ai-connect/allow"
              ? `/login?redirect=${encodeURIComponent(pathname + search)}`
              : "/login",
          );
        }
      }

      return Promise.reject(error);
    },
  );

  return instance;
}

export const api = createApi();

export function mockResponse<T>(data: T, delay = 250): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), delay));
}

/** Endpoint namespace map — kept in sync with the future FastAPI router. */
export const endpoints = {
  auth: {
    login: "/auth/login",
    register: "/auth/register",
    logout: "/auth/logout",
    refresh: "/auth/refresh",
    me: "/auth/me",
    passwordOtpRequest: "/auth/password/otp/request",
    passwordOtpVerify: "/auth/password/otp/verify",
    passwordReset: "/auth/password/reset",
    verifyEmail: "/auth/verify-email",
    otp: "/auth/otp",
    resendOtp: "/auth/otp/resend",
  },
  adminUsers: {
      list: "/admin/users",
      detail: (id: number) =>
          `/admin/users/${id}`,
      update: (id: number) =>
          `/admin/users/${id}`,
      approve: (id: number) =>
          `/admin/users/${id}/approve`,
      suspend: (id: number) =>
          `/admin/users/${id}/suspend`,
      delete: (id: number) =>
          `/admin/users/${id}/delete`,
      history: (id: number) =>
          `/admin/users/${id}/history`,
      export: "/admin/users/export",
  },
    adminSubscriptions: {
      list: "/admin/subscriptions",
      detail: (id: number) => `/admin/subscriptions/${id}`,
      createManual: "/admin/subscriptions/manual",
      update: (id: number) => `/admin/subscriptions/${id}`,
      extend: (id: number) => `/admin/subscriptions/${id}/extend`,
      suspend: (id: number) => `/admin/subscriptions/${id}/suspend`,
      cancel: (id: number) => `/admin/subscriptions/${id}/cancel`,
      activate: (id: number) => `/admin/subscriptions/${id}/activate`,
  },
    adminPayments: {
      list: "/admin/payments",
      detail: (id: number) => `/admin/payments/${id}`,
      recordCash: "/admin/payments/cash",
      receipt: (id: number, format: "pdf" | "docx") => `/admin/payments/${id}/receipt?format=${format}`,
  },
  checkout: {
    initiate: "/payments/initiate",
    status: (orderId: string) => `/payments/${orderId}/status`,
    recheck: (orderId: string) => `/payments/${orderId}/recheck`,
  },
  adminNotifications: {
    list: "/admin/notifications",
    markRead: (id: number) => `/admin/notifications/${id}/read`,
    markAllRead: "/admin/notifications/read-all",
  },
  adminConversations: {
    list: "/admin/conversations",
    detail: (id: number) => `/admin/conversations/${id}`,
    forUser: (userId: number) => `/admin/users/${userId}/conversations`,
    forUserDetail: (userId: number, conversationId: number) =>
      `/admin/users/${userId}/conversations/${conversationId}`,
  },
  adminAuditLogs: {
    list: "/admin/audit-logs",
    actions: "/admin/audit-logs/actions",
  },
  adminWorkspaceSettings: {
    get: "/admin/workspace-settings",
  },
  workspaceSettings: {
    get: "/workspace/settings",
  },

  profile: {
    me: "/profile/me",
    update: "/profile/me",
    preferences: "/profile/preferences",
    apiKeys: "/profile/api-keys",
  },
  cms: {
    pages: "/cms/pages",
    page: (slug: string) => `/cms/pages/${slug}`,
    blocks: "/cms/blocks",
  },
  pages: {
    list: "/pages",
    detail: (slug: string) => `/pages/${slug}`,
    sections: (slug: string) => `/pages/${slug}/sections`,
  },
  navigation: {
    root: "/navigation",
    header: "/navigation/header",
    footer: "/navigation/footer",
    workspace: "/navigation/workspace",
    admin: "/navigation/admin",
  },
  notifications: {
    list: "/notifications",
    read: (id: string) => `/notifications/${id}/read`,
    readAll: "/notifications/read-all",
    preferences: "/notifications/preferences",
  },
  settings: {
    global: "/settings/global",
    branding: "/settings/branding",
    ai: "/settings/ai",
    email: "/settings/email",
    security: "/settings/security",
    integrations: "/settings/integrations",
  },
  features: {
    list: "/feature-flags",
    update: (key: string) => `/feature-flags/${key}`,
  },
  permissions: {
    roles: "/permissions/roles",
    role: (id: string) => `/permissions/roles/${id}`,
    matrix: "/permissions/matrix",
  },
  uploads: {
    presign: "/uploads/presign",
    complete: "/uploads/complete",
    list: "/uploads",
  },
  forms: {
    list: "/forms",
    detail: (id: string) => `/forms/${id}`,
    submit: (id: string) => `/forms/${id}/submit`,
  },
  components: {
    registry: "/components/registry",
  },
  dashboard: {
    widgets: "/dashboard/widgets",
    layout: "/dashboard/layout",
  },
  workspace: {
    modules: "/workspace/modules",
    tools: "/workspace/tools",
    preferences: "/workspace/preferences",
    templates: "/workspace/prompt-templates",
    artifacts: "/workspace/artifacts",
    export: (threadId: string) => `/workspace/threads/${threadId}/export`,
    share: (threadId: string) => `/workspace/threads/${threadId}/share`,
    usage: "/workspace/usage",
  },
  chat: {
    threads: "/chat/threads",
    thread: (id: string) => `/chat/threads/${id}`,
    stream: "/chat/stream",
    upload: "/chat/upload",
    folders: "/chat/folders",
    tags: "/chat/tags",
  },
  documents: {
    list: "/documents",
    detail: (id: string) => `/documents/${id}`,
    upload: "/documents/upload",
  },
  search: {
    query: "/search",
    suggest: "/search/suggest",
    recent: "/search/recent",
  },
  admin: {
    metrics: "/admin/metrics",
    users: "/admin/users",
    subs: "/admin/subscriptions",
    audit: "/admin/audit",
    emailTemplates: "/admin/email-templates",
    docTemplates: "/admin/document-templates",
    promptTemplates: "/admin/prompt-templates",
  },
  ai: {
    complete: "/ai/complete",
    query: "/ai/query",
    queryStream: "/ai/query/stream",
    embed: "/ai/embed",
    tools: "/ai/tools",
    models: "/ai/models",
    conversations: "/ai/conversations",
    conversation: (id: string) => `/ai/conversations/${id}`,
    renameConversation: (id: string) => `/ai/conversations/${id}/rename`,
    archiveConversation: (id: string) => `/ai/conversations/${id}/archive`,
    clarify: "/ai/clarify",
    messageFeedback: (id: string) => `/ai/messages/${id}/feedback`,
    messageRefine: (id: string) => `/ai/messages/${id}/refine`,
    noticeGenerate: "/ai/notice/generate",
    // Staged Notice Agent workflow (uploaded -> analysed -> drafted -> refined)
    noticeAnalyze: "/ai/notice/analyze",
    noticeAnalyzeFile: "/ai/notice/analyze-file",
    noticeSubmissions: "/ai/notice/submissions",
    noticeSubmissionsFile: "/ai/notice/submissions-file",
    noticeDraft: "/ai/notice/draft",
    noticeRefine: "/ai/notice/refine",
    noticeAsk: "/ai/notice/ask",
    summarize: "/ai/summarize",
    summarizeStatus: (jobId: string) => `/ai/summarize/status/${jobId}`,
    summarizeResult: (jobId: string) => `/ai/summarize/result/${jobId}`,
    analytics: "/ai/analytics",
    health: "/ai/health",
  },
  bridge: {
    status: "/bridge/status",
    allow: "/bridge/allow",
  },
  adminBridge: {
    stats: "/admin/bridge/stats",
    plans: "/admin/bridge/plans",
    plan: (plan: string) => `/admin/bridge/plans/${encodeURIComponent(plan)}`,
    customers: "/admin/bridge/subscriptions",
    customerLimits: (userId: string) => `/admin/bridge/subscriptions/${encodeURIComponent(userId)}/limits`,
    customerStatus: (userId: string) => `/admin/bridge/subscriptions/${encodeURIComponent(userId)}/status`,
    customerRevoke: (userId: string) => `/admin/bridge/subscriptions/${encodeURIComponent(userId)}/revoke`,
    resync: "/admin/bridge/resync",
  },
  books: {
    list: "/admin/books",
    detail: (id: string) =>
      `/admin/books/${id}`,
    create: "/admin/books",
    update: (id: string) =>
      `/admin/books/${id}`,
    delete: (id: string) =>
      `/admin/books/${id}`,
    sections: (bookId: string) =>
      `/admin/books/${bookId}/sections`,
    tree: (bookId: string) =>
      `/admin/books/${bookId}/tree`,
    section: (sectionId: string) =>
      `/admin/books/sections/${sectionId}`,
    createSection: "/admin/books/sections",
    updateSection: (sectionId: string) =>
      `/admin/books/sections/${sectionId}`,
    deleteSection: (sectionId: string) =>
      `/admin/books/sections/${sectionId}`,
    sectionDropdown: (bookId: string) =>
      `/admin/books/${bookId}/sections/dropdown`,
    contents: "/admin/books/contents",
    content: (contentId: string) =>
      `/admin/books/contents/${contentId}`,
    createContent: "/admin/books/contents",
    updateContent: (contentId: string) =>
      `/admin/books/contents/${contentId}`,
    deleteContent: (contentId: string) =>
      `/admin/books/contents/${contentId}`,
    contentsBySection: (sectionId: string) =>
      `/admin/books/sections/${sectionId}/contents`,
    incrementView: (contentId: string) =>
      `/admin/books/contents/${contentId}/view`,
    contentPdf: (contentId: string) =>
      `/admin/books/contents/${contentId}/pdf`,
    importContent: "/admin/books/contents/import",
  },
} as const;