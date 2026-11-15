/* eslint-disable prettier/prettier */

import type { Paginated } from "@/types/admin";
import { api, endpoints } from "./api/api";
import { BridgeConnectorAccess, BridgeMyStatus, BridgeStats, BridgePlanLimits, BridgeCustomerListParams, BridgeCustomer } from "@/types/bridge";

/** Strips empty strings/null/undefined so we never send blank filters. */
function clean<T extends Record<string, unknown>>(params: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== "" && v !== null && v !== undefined),
  );
}

/**
 * ITL Bridge AI — all calls go to our own backend, which holds the Bridge
 * keys and talks to the MCP server. Nothing here touches the MCP server
 * directly.
 */
export const bridgeService = {
  async getMyStatus(): Promise<BridgeMyStatus> {
    const { data } = await api.get(endpoints.bridge.status);
    return data;
  },

  /** Resolves with the URL the browser must be sent to (back to the MCP server). */
  async decide(payload: { txn: string; return_url?: string | null; decision: "allow" | "cancel" }): Promise<string> {
    const { data } = await api.post(endpoints.bridge.allow, payload);
    return data.redirect as string;
  },
};

export const adminBridgeService = {
  async stats(): Promise<BridgeStats> {
    const { data } = await api.get(endpoints.adminBridge.stats);
    return data;
  },
  async plans(): Promise<BridgePlanLimits[]> {
    const { data } = await api.get(endpoints.adminBridge.plans);
    return data.plans ?? [];
  },
  async setPlanLimits(plan: string, limits: { daily_limit: number | null; daily_doc_limit: number | null }) {
    const { data } = await api.put(endpoints.adminBridge.plan(plan), limits);
    return data;
  },
  async customers(params: BridgeCustomerListParams): Promise<Paginated<BridgeCustomer>> {
    const { data } = await api.get(endpoints.adminBridge.customers, {
      params: clean(params as Record<string, unknown>),
    });
    return data;
  },
  async setCustomerLimits(
    userId: string,
    limits: { daily_limit: number | null; daily_doc_limit: number | null },
  ) {
    const { data } = await api.put(endpoints.adminBridge.customerLimits(userId), limits);
    return data;
  },
  async setCustomerStatus(userId: string, status: "active" | "suspended") {
    const { data } = await api.post(endpoints.adminBridge.customerStatus(userId), { status });
    return data;
  },
  async revokeCustomer(userId: string) {
    const { data } = await api.post(endpoints.adminBridge.customerRevoke(userId));
    return data;
  },
  async resync(): Promise<{ sent: number; failed: number; skipped: number }> {
    const { data } = await api.post(endpoints.adminBridge.resync);
    return data;
  },
};

/** Admin: switch a connector (GST AI / Income Tax AI) on or off for one customer. */
export const adminConnectorAccessService = {
  async get(userId: number): Promise<BridgeConnectorAccess[]> {
    const { data } = await api.get(`/admin/bridge/access/${userId}`);
    return data.connectors;
  },
  async set(userId: number, connector: string, enabled: boolean): Promise<{ connectors: BridgeConnectorAccess[]; synced: boolean }> {
    const { data } = await api.put(`/admin/bridge/access/${userId}`, { connector, enabled });
    return data;
  },
};
