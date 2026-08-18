/* eslint-disable prettier/prettier */
import type {
  AdminAuditEvent,
  AdminUser,
  AdminUserDetail,
  Paginated,
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