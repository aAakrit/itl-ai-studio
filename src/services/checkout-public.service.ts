/* eslint-disable prettier/prettier */
/**
 * Public checkout client — for visitors who are not logged in.
 *
 * Uses its OWN axios instance (not the app-wide `api`) because:
 *  - the visitor's credential is a short-lived checkout token, not a login session;
 *  - a 401 here must never trigger the global "log out and redirect" handler.
 * The token (issued after the e-mail code is verified) lives in sessionStorage.
 */
import axios from "axios";
import type {
  CheckoutInitiateRequest,
  CheckoutProfile,
  CheckoutRegisterRequest,
  Quote,
  QuoteRequest,
  Salesman,
  CheckoutDetails,
} from "@/types/checkout";
import type { AdminPayment, PaymentInitiateResponse } from "@/types/admin";

const TOKEN_KEY = "itl_checkout_token";

const http = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE_URL as string) ?? "/api",
  timeout: 120_000,
  headers: { "Content-Type": "application/json" },
});

export const checkoutToken = {
  get: (): string | null => {
    try {
      return sessionStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token: string) => {
    try {
      sessionStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* private mode — the dialog still works for this page view */
    }
  },
  clear: () => {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
};

function auth() {
  const token = checkoutToken.get();
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
}

export const checkoutPublicService = {
  async salesmen(): Promise<Salesman[]> {
    const { data } = await http.get("/checkout/salesmen");
    return data.items;
  },
  async requestOtp(email: string): Promise<void> {
    await http.post("/checkout/otp/request", { email });
  },
  async verifyOtp(email: string, otp: string): Promise<string> {
    const { data } = await http.post("/checkout/otp/verify", { email, otp });
    checkoutToken.set(data.token);
    return data.token as string;
  },
  async profile(): Promise<CheckoutProfile> {
    const { data } = await http.get("/checkout/profile", auth());
    return data;
  },
  async register(payload: CheckoutRegisterRequest): Promise<CheckoutProfile> {
    const { data } = await http.post("/checkout/register", payload, auth());
    return data;
  },
  async quote(payload: QuoteRequest): Promise<Quote> {
    const { data } = await http.post("/checkout/quote", payload, auth());
    return data;
  },
  /** Pro-forma bill as a PDF blob. */
  async proforma(payload: QuoteRequest & { details: CheckoutDetails }): Promise<Blob> {
    const { data } = await http.post("/checkout/proforma", payload, { ...auth(), responseType: "blob" });
    return data;
  },
  async initiate(payload: CheckoutInitiateRequest): Promise<PaymentInitiateResponse> {
    const { data } = await http.post("/checkout/initiate", payload, auth());
    return data;
  },
  async status(orderId: string): Promise<AdminPayment> {
    const { data } = await http.get(`/checkout/orders/${encodeURIComponent(orderId)}/status`, auth());
    return data;
  },
  async recheck(orderId: string): Promise<AdminPayment> {
    const { data } = await http.post(`/checkout/orders/${encodeURIComponent(orderId)}/recheck`, {}, auth());
    return data;
  },
  async bill(orderId: string): Promise<Blob> {
    const { data } = await http.get(`/checkout/orders/${encodeURIComponent(orderId)}/bill`, { ...auth(), responseType: "blob" });
    return data;
  },
  async receipt(orderId: string): Promise<Blob> {
    const { data } = await http.get(`/checkout/orders/${encodeURIComponent(orderId)}/receipt`, { ...auth(), responseType: "blob" });
    return data;
  },
};

/** Saves a blob as a file download. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function checkoutErrorMessage(e: unknown, fallback: string): string {
  const detail = (e as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    // FastAPI validation errors: [{loc, msg}]
    return detail.map((d: { loc?: string[]; msg?: string }) => `${(d.loc ?? []).slice(-1)[0] ?? ""}: ${d.msg ?? ""}`).join("; ") || fallback;
  }
  if (detail && typeof detail === "object" && "message" in detail) return String((detail as { message: unknown }).message);
  return fallback;
}

export function checkoutAuthExpired(e: unknown): boolean {
  return (e as { response?: { status?: number } })?.response?.status === 401;
}
