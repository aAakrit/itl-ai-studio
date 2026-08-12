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

      if (error.response?.status === 401 && original && !original._retry) {
        original._retry = true;
        const fresh = await refreshAuthToken();
        if (fresh && original.headers) {
          original.headers.Authorization = `Bearer ${fresh}`;
          return instance.request(original);
        }

        useAuthStore.getState().clear();
        useChatStore.getState().reset();
        useWorkspaceStore.getState().reset();
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
          window.location.assign("/login");
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
    forgot: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",
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
    embed: "/ai/embed",
    tools: "/ai/tools",
    models: "/ai/models",
    conversations: "/ai/conversations",
    conversation: (id: string) => `/ai/conversations/${id}`,
    clarify: "/ai/clarify",
    messageFeedback: (id: string) => `/ai/messages/${id}/feedback`,
    messageRefine: (id: string) => `/ai/messages/${id}/refine`,
    noticeGenerate: "/ai/notice/generate",
    summarize: "/ai/summarize",
    summarizeStatus: (jobId: string) => `/ai/summarize/status/${jobId}`,
    summarizeResult: (jobId: string) => `/ai/summarize/result/${jobId}`,
    analytics: "/ai/analytics",
    health: "/ai/health",
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