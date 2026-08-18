/* eslint-disable prettier/prettier */
/**
 * Presentation helpers for the Admin User + Subscription surfaces.
 * Pure formatting only — no business logic, no derived subscription state.
 * The backend is authoritative for status; we never recompute it here.
 */

export const EMPTY = "—";

export function formatDate(value?: string | null): string {
  if (!value) return EMPTY;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(value?: string | null): string {
  if (!value) return EMPTY;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** For <input type="date"> values; returns "" when there is nothing to show. */
export function toDateInput(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

/** Date input value -> ISO datetime the backend accepts. */
export function fromDateInput(value?: string): string | undefined {
  if (!value) return undefined;
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

export function formatMoney(amount?: number | null, currency = "INR"): string {
  if (amount === null || amount === undefined) return EMPTY;
  const symbol = currency === "INR" ? "₹" : `${currency} `;
  return `${symbol}${amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export function formatNumber(value?: number | null): string {
  if (value === null || value === undefined) return EMPTY;
  return value.toLocaleString("en-IN");
}

export function titleCase(value?: string | null): string {
  if (!value) return EMPTY;
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export const PAYMENT_TYPE_LABELS: Record<string, string> = {
  paytm: "Paytm",
  cash: "Cash / Manual",
  complimentary: "Complimentary",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  success: "Success",
  failed: "Failed",
  refunded: "Refunded",
};

export const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  active: "Active",
  pending: "Pending",
  suspended: "Suspended",
  cancelled: "Cancelled",
  expired: "Expired",
};

export const EXPIRY_WINDOW_OPTIONS: { value: string; label: string }[] = [
  { value: "expired", label: "Expired" },
  { value: "today", label: "Expiring Today" },
  { value: "7d", label: "Within 7 Days" },
  { value: "30d", label: "Within 30 Days" },
  { value: "60d", label: "Within 60 Days" },
  { value: "90d", label: "Within 90 Days" },
];

export const BILLING_CYCLE_OPTIONS = [
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
] as const;

export const SUBSCRIPTION_SOURCE_OPTIONS = [
  { value: "manual", label: "Manual" },
  { value: "complimentary", label: "Complimentary" },
] as const;

export function paymentTypeLabel(type?: string | null): string {
  if (!type) return EMPTY;
  return PAYMENT_TYPE_LABELS[type.toLowerCase()] ?? titleCase(type);
}

export function paymentStatusLabel(status?: string | null): string {
  if (!status) return EMPTY;
  return PAYMENT_STATUS_LABELS[status.toLowerCase()] ?? titleCase(status);
}

export function subscriptionStatusLabel(status?: string | null): string {
  if (!status) return EMPTY;
  return SUBSCRIPTION_STATUS_LABELS[status.toLowerCase()] ?? titleCase(status);
}

/** Tailwind classes for a subscription status badge. */
export function subscriptionStatusClass(status?: string | null): string {
  switch ((status ?? "").toLowerCase()) {
    case "active":
      return "bg-success/10 text-success hover:bg-success/10";
    case "pending":
      return "bg-info/10 text-info hover:bg-info/10";
    case "suspended":
      return "bg-warning/10 text-warning hover:bg-warning/10";
    case "cancelled":
    case "expired":
      return "bg-destructive/10 text-destructive hover:bg-destructive/10";
    default:
      return "bg-muted text-muted-foreground hover:bg-muted";
  }
}

export function paymentStatusClass(status?: string | null): string {
  switch ((status ?? "").toLowerCase()) {
    case "success":
      return "bg-success/10 text-success hover:bg-success/10";
    case "pending":
      return "bg-info/10 text-info hover:bg-info/10";
    case "failed":
      return "bg-destructive/10 text-destructive hover:bg-destructive/10";
    case "refunded":
      return "bg-warning/10 text-warning hover:bg-warning/10";
    default:
      return "bg-muted text-muted-foreground hover:bg-muted";
  }
}

export function accountStatusClass(status?: string | null): string {
  switch ((status ?? "").toUpperCase()) {
    case "APPROVED":
      return "bg-success/10 text-success hover:bg-success/10";
    case "PENDING":
      return "bg-info/10 text-info hover:bg-info/10";
    case "SUSPENDED":
    case "DELETED":
      return "bg-destructive/10 text-destructive hover:bg-destructive/10";
    default:
      return "bg-muted text-muted-foreground hover:bg-muted";
  }
}

export function initials(name?: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const last = parts[parts.length - 1];
  return (last[0] ?? "?").toUpperCase();
}

/** Reads a backend validation error message without inventing copy. */
export function apiErrorMessage(error: unknown, fallback: string): string {
  const detail = (error as { response?: { data?: { detail?: unknown; message?: unknown } } })
    ?.response?.data;
  const raw = detail?.detail ?? detail?.message;
  if (typeof raw === "string" && raw.trim()) return raw;
  if (Array.isArray(raw)) {
    const msgs = raw
      .map((r) => (typeof r === "object" && r && "msg" in r ? String((r as { msg: unknown }).msg) : null))
      .filter(Boolean);
    if (msgs.length) return msgs.join(", ");
  }
  return fallback;
}
