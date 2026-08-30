/* eslint-disable prettier/prettier */
import type {
  AdminAuditEvent,
  AdminAuditLogEntry,
  AdminAuditLogListParams,
  AdminConversationDetail,
  AdminConversationListParams,
  AdminConversationSummary,
  AdminNotification,
  AdminNotificationListParams,
  AdminPayment,
  AdminUser,
  AdminUserDetail,
  CashPaymentCreate,
  Paginated,
  PaymentListParams,
  SubscriptionCreateManual,
  SubscriptionExtend,
  SubscriptionListParams,
  SubscriptionSummary,
  SubscriptionUpdate,
  UserListParams,
} from "@/types/admin";
import { api, endpoints, mockResponse } from "./api/api";
import { adminMetrics, adminNav } from "@/mock/admin";

/** Strips empty strings/null/undefined so we never send blank filters. */
function clean<T extends Record<string, unknown>>(params: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== "" && v !== null && v !== undefined),
  );
}

export const adminService = {
  getMetrics: () => mockResponse(adminMetrics),
  getNav: () => mockResponse(adminNav),
  async getUsers(params: UserListParams): Promise<Paginated<AdminUser>> {

    const { data } = await api.get(
        endpoints.adminUsers.list,
        {
            params: clean(params as Record<string, unknown>),
        },
    );

    return data;
},
  async getUser(id: number): Promise<AdminUserDetail> {
    const { data } = await api.get(endpoints.adminUsers.detail(id));
    return data;
  },
  async updateUser(id: number, patch: Record<string, unknown>) {
    const { data } = await api.put(endpoints.adminUsers.update(id), patch);
    return data;
  },
  async approveUser(id: number, reason?: string) {
    const { data } = await api.patch(endpoints.adminUsers.approve(id), null, {
      params: clean({ reason }),
    });
    return data;
  },
  async suspendUser(id: number, reason?: string) {
    const { data } = await api.patch(endpoints.adminUsers.suspend(id), null, {
      params: clean({ reason }),
    });
    return data;
  },
  async deleteUser(id: number, reason?: string) {
    const { data } = await api.patch(endpoints.adminUsers.delete(id), null, {
      params: clean({ reason }),
    });
    return data;
  },
  async getUserHistory(
    id: number,
    params?: { page?: number; limit?: number },
  ): Promise<Paginated<AdminAuditEvent>> {
    const { data } = await api.get(endpoints.adminUsers.history(id), {
      params: clean(params ?? {}),
    });
    return data;
  },
  /** Downloads the export file directly from the response headers'
   * Content-Disposition filename — triggers a real browser save, no extra
   * click needed. */
  async exportUsers(payload: { user_ids: number[]; format: "xlsx" | "docx" | "pdf"; detail: "short" | "full" }) {
    const response = await api.post(endpoints.adminUsers.export, payload, { responseType: "blob" });
    const disposition = (response.headers as Record<string, string>)["content-disposition"] ?? "";
    const match = disposition.match(/filename="?([^"]+)"?/);
    const filename = match?.[1] ?? `users-${payload.detail}.${payload.format}`;

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

/**
 * Admin Subscription API — the authoritative surface for a user's plan
 * entitlement. Never change a subscription via PUT /admin/users/{id}.
 */
export const subscriptionService = {
  async list(params: SubscriptionListParams): Promise<Paginated<SubscriptionSummary>> {
    const { data } = await api.get(endpoints.adminSubscriptions.list, {
      params: clean(params as Record<string, unknown>),
    });
    return data;
  },
  async get(id: number): Promise<SubscriptionSummary> {
    const { data } = await api.get(endpoints.adminSubscriptions.detail(id));
    return data;
  },
  async createManual(payload: SubscriptionCreateManual): Promise<SubscriptionSummary> {
    const { data } = await api.post(endpoints.adminSubscriptions.createManual, payload);
    return data;
  },
  async update(id: number, payload: SubscriptionUpdate): Promise<SubscriptionSummary> {
    const { data } = await api.put(endpoints.adminSubscriptions.update(id), payload);
    return data;
  },
  async extend(id: number, payload: SubscriptionExtend): Promise<SubscriptionSummary> {
    const { data } = await api.post(endpoints.adminSubscriptions.extend(id), payload);
    return data;
  },
  async suspend(id: number, reason?: string): Promise<SubscriptionSummary> {
    const { data } = await api.post(endpoints.adminSubscriptions.suspend(id), clean({ reason }));
    return data;
  },
  async cancel(id: number, reason?: string): Promise<SubscriptionSummary> {
    const { data } = await api.post(endpoints.adminSubscriptions.cancel(id), clean({ reason }));
    return data;
  },
  async activate(id: number, reason?: string): Promise<SubscriptionSummary> {
    const { data } = await api.post(endpoints.adminSubscriptions.activate(id), clean({ reason }));
    return data;
  },
};

/**
 * Admin Payment API — payment history plus recording an offline/cash
 * payment. Online (Paytm) payments are created by the checkout flow, not
 * here; this is the admin-facing read/record surface.
 */
export const paymentService = {
  async list(params: PaymentListParams): Promise<Paginated<AdminPayment>> {
    const { data } = await api.get(endpoints.adminPayments.list, {
      params: clean(params as Record<string, unknown>),
    });
    return data;
  },
  async get(id: number): Promise<AdminPayment> {
    const { data } = await api.get(endpoints.adminPayments.detail(id));
    return data;
  },
  async recordCash(payload: CashPaymentCreate): Promise<AdminPayment> {
    const { data } = await api.post(endpoints.adminPayments.recordCash, payload);
    return data;
  },
};


export const analyticsService = {
  getOverview: () => mockResponse(adminMetrics),
  // GET /ai/analytics — mirrors the vendor's GET /api/v2/analytics/summary,
  // admin-only on the backend (require_admin dependency).
  async getAiAnalytics(params?: { start_date?: string; end_date?: string }) {
    const { data } = await api.get(endpoints.ai.analytics, { params });
    return data.data;
  },
  // GET /ai/health — per-provider status, response time, last-checked,
  // and any error, for every configured AI provider.
  async getAiHealth() {
    const { data } = await api.get(endpoints.ai.health);
    return data.data;
  },
};

export const userService = {
  async me() {
    const { data } = await api.get(endpoints.auth.me);
    return data;
  },
};

export const settingsService = {
  get: () => mockResponse({ notifications: true, weeklyDigest: false, betaFeatures: true }),
  update: (patch: Record<string, unknown>) => mockResponse({ ok: true, patch }),
};

export const adminNotificationService = {
  async list(params: AdminNotificationListParams): Promise<Paginated<AdminNotification> & { unread_count: number }> {
    const { data } = await api.get(endpoints.adminNotifications.list, { params: clean(params as Record<string, unknown>) });
    return data;
  },
  async markRead(id: number): Promise<AdminNotification> {
    const { data } = await api.post(endpoints.adminNotifications.markRead(id));
    return data;
  },
  async markAllRead(): Promise<{ success: boolean; updated: number }> {
    const { data } = await api.post(endpoints.adminNotifications.markAllRead);
    return data;
  },
};

export const conversationService = {
  async list(params: AdminConversationListParams): Promise<Paginated<AdminConversationSummary>> {
    const { data } = await api.get(endpoints.adminConversations.list, { params: clean(params as Record<string, unknown>) });
    return data;
  },
  async get(id: number): Promise<AdminConversationDetail> {
    const { data } = await api.get(endpoints.adminConversations.detail(id));
    return data;
  },
  async listForUser(userId: number, params: { page?: number; limit?: number }): Promise<Paginated<AdminConversationSummary>> {
    const { data } = await api.get(endpoints.adminConversations.forUser(userId), { params: clean(params) });
    return data;
  },
  async getForUser(userId: number, conversationId: number): Promise<AdminConversationDetail> {
    const { data } = await api.get(endpoints.adminConversations.forUserDetail(userId, conversationId));
    return data;
  },
};

export const auditLogService = {
  async list(params: AdminAuditLogListParams): Promise<Paginated<AdminAuditLogEntry>> {
    const { data } = await api.get(endpoints.adminAuditLogs.list, { params: clean(params as Record<string, unknown>) });
    return data;
  },
  async listActions(): Promise<{ actions: string[] }> {
    const { data } = await api.get(endpoints.adminAuditLogs.actions);
    return data;
  },
};