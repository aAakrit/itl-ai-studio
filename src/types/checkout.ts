/* eslint-disable prettier/prettier */
/** Public checkout (pricing-page dialog) — mirrors the /checkout/* API. */

export interface CheckoutDetails {
  name: string;
  firm?: string;
  mobile: string;
  telephone?: string;
  gstin?: string;
  address: string;
  city: string;
  state: string;
  pin_code: string;
}

export interface CheckoutProfile {
  email: string;
  exists: boolean;
  /** PENDING | APPROVED | … (null when no account yet) */
  status: string | null;
  user: CheckoutDetails | null;
  subscription: { plan_name: string; products: string[]; expiry_date: string | null; expired: boolean } | null;
  last_payment: { plan_name: string; amount: number; status: string; date: string | null; order_id: string } | null;
}

export interface Salesman {
  id: number;
  name: string;
}

export interface QuoteRequest {
  plan_id: string;
  state: string;
  coupon_code?: string | null;
  salesman_id?: number | null;
  override_base_price?: number | null;
  reason?: string | null;
}

export interface Quote {
  plan_id: string;
  plan_name: string;
  products: string[];
  term_years: number;
  list_price: number;
  discount_amount: number;
  discount_source: "coupon" | "salesman" | null;
  coupon_code: string | null;
  salesman_id: number | null;
  /** Lowest price a salesman may set (before GST). */
  min_allowed_price: number;
  /** Taxable amount (after discount, before GST). */
  base_price: number;
  cgst_rate: number;
  cgst_amount: number;
  sgst_rate: number;
  sgst_amount: number;
  igst_rate: number;
  igst_amount: number;
  gst_amount: number;
  payable_amount: number;
}

export interface CheckoutInitiateRequest extends QuoteRequest {
  details: CheckoutDetails;
  update_profile: boolean;
}

export interface CheckoutRegisterRequest extends CheckoutDetails {
  password: string;
}

/* ---- admin ---- */

export interface Coupon {
  id: number;
  code: string;
  description: string | null;
  discount_type: "percent" | "flat";
  value: number;
  max_discount: number | null;
  valid_from: string | null;
  valid_to: string | null;
  total_limit: number | null;
  per_user_limit: number | null;
  plan_ids: string[] | null;
  is_active: boolean;
  times_used: number;
  created_at: string;
}

export interface CouponCreate {
  code: string;
  description?: string | null;
  discount_type: "percent" | "flat";
  value: number;
  max_discount?: number | null;
  valid_from?: string | null;
  valid_to?: string | null;
  total_limit?: number | null;
  per_user_limit?: number | null;
  plan_ids?: string[] | null;
  is_active?: boolean;
}

export type CouponUpdate = Partial<Omit<CouponCreate, "code" | "discount_type">>;

export interface BillLine {
  particulars: string;
  hsn?: string;
  period?: string;
  amount: number | string;
}

export interface Bill {
  id: number;
  bill_number: string;
  financial_year: string;
  bill_date: string;
  status: "active" | "cancelled";
  user_id: number | null;
  payment_id: number | null;
  salesman_id: number | null;
  customer_name: string;
  customer_address: string | null;
  customer_city: string | null;
  customer_pin: string | null;
  customer_state: string | null;
  customer_tele: string | null;
  customer_mobile: string | null;
  customer_email: string | null;
  customer_gstin: string | null;
  lines: BillLine[];
  total_before_tax: number;
  cgst_rate: number;
  cgst_amount: number;
  sgst_rate: number;
  sgst_amount: number;
  igst_rate: number;
  igst_amount: number;
  total_tax: number;
  total_after_tax: number;
  amount_in_words: string | null;
  payment_ref: string | null;
  payment_date: string | null;
  payment_amount: number | null;
  bank: string | null;
  notes: string | null;
  reverse_charge: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  created_at: string;
}

/** Create / edit payload — totals are computed by the server. */
export interface BillWrite {
  user_id?: number | null;
  salesman_id?: number | null;
  bill_date?: string | null;
  customer_name?: string | null;
  customer_address?: string | null;
  customer_city?: string | null;
  customer_pin?: string | null;
  customer_state?: string | null;
  customer_tele?: string | null;
  customer_mobile?: string | null;
  customer_email?: string | null;
  customer_gstin?: string | null;
  lines?: BillLine[];
  cgst_rate?: number | null;
  sgst_rate?: number | null;
  igst_rate?: number | null;
  payment_ref?: string | null;
  payment_date?: string | null;
  payment_amount?: number | null;
  bank?: string | null;
  notes?: string | null;
  reverse_charge?: string | null;
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
