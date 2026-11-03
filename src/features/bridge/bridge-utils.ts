/* eslint-disable prettier/prettier */

export const BRIDGE_PLAN_LABELS: Record<string, string> = {
  bridge_yearly: "ITL Bridge AI — Yearly",
  bridge_3year: "ITL Bridge AI — 3 Years",
  bundle_yearly: "ITL Bridge AI + Library — Yearly",
  bundle_3year: "ITL Bridge AI + Library — 3 Years",
};

export function bridgePlanLabel(plan?: string | null): string {
  if (!plan) return "—";
  return BRIDGE_PLAN_LABELS[plan] ?? plan;
}

/** Shows "Unlimited" for a null limit (null = no cap on the MCP side). */
export function limitLabel(limit?: number | null): string {
  return limit === null || limit === undefined ? "Unlimited" : limit.toLocaleString("en-IN");
}

/** Badge classes — same palette as the subscription status badges. */
export function bridgeStatusClass(status?: string | null): string {
  switch ((status ?? "").toLowerCase()) {
    case "active":
      return "bg-success/10 text-success hover:bg-success/10";
    case "suspended":
      return "bg-warning/10 text-warning hover:bg-warning/10";
    case "revoked":
    case "expired":
      return "bg-destructive/10 text-destructive hover:bg-destructive/10";
    default:
      return "bg-muted text-muted-foreground hover:bg-muted";
  }
}

export function bridgeStatusLabel(status?: string | null): string {
  if (!status) return "—";
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}
