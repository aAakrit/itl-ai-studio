/* eslint-disable prettier/prettier */

/** Plan codes understood by the ITL Bridge AI (MCP) server. */
export type BridgePlanCode = "bridge_yearly" | "bridge_3year" | "bundle_yearly" | "bundle_3year";

export interface BridgeSubscriptionStatus {
  user_id: string;
  exists: boolean;
  active: boolean;
  days_left?: number | null;
  subscription?: {
    plan: string;
    status: string;
    starts_at?: string | null;
    expires_at?: string | null;
    daily_limit?: number | null;
    daily_doc_limit?: number | null;
  } | null;
  limits?: {
    search_limit?: number | null;
    document_limit?: number | null;
    search_limit_source?: "plan" | "user";
    document_limit_source?: "plan" | "user";
  } | null;
  usage_today?: {
    searches: number;
    search_limit?: number | null;
    documents: number;
    document_limit?: number | null;
  } | null;
}

export interface BridgeConnectLinks {
  claude?: string;
  chatgpt?: string;
  gemini?: string;
  mcp_url?: string;
}

export interface BridgeMyStatus {
  enabled: boolean;
  status: BridgeSubscriptionStatus | null;
  links: BridgeConnectLinks | null;
}

export interface BridgePlanLimits {
  plan: string;
  daily_limit: number | null;
  daily_doc_limit: number | null;
  updated_at?: string | null;
}

export interface BridgeCustomer {
  user_id: string;
  email?: string | null;
  name?: string | null;
  plan?: string | null;
  status: string;
  expires_at?: string | null;
  searches_today?: number | null;
  documents_today?: number | null;
  search_limit?: number | null;
  document_limit?: number | null;
  search_limit_source?: "plan" | "user";
  document_limit_source?: "plan" | "user";
}

export interface BridgeCustomerListParams {
  page?: number;
  limit?: number;
  q?: string;
  status?: string;
}

export interface BridgeStats {
  active?: number;
  expired?: number;
  revoked_or_suspended?: number;
  users_today?: number;
  searches_today?: number;
  documents_today?: number;
  [key: string]: number | undefined;
}
