/* eslint-disable prettier/prettier */

/* ------------------------------------------------------------------ */
/* Admin user list query params — mirrors GET /admin/users            */
/* ------------------------------------------------------------------ */

export interface UserListParams {
  page?: number;
  limit?: number;

  search?: string;

  role?: string;
  status?: string;
  plan?: string;

  subscription_status?: string;
  payment_type?: string;
  payment_status?: string;

  expiry_window?: string;
  expiry_from?: string;
  expiry_to?: string;

  registration_from?: string;
  registration_to?: string;
  approval_status?: string;

  state?: string;
  city?: string;

  sort?: string;
  order?: "asc" | "desc";
}

/* ------------------------------------------------------------------ */
/* Backend enums (wire values — never send display labels)            */
/* ------------------------------------------------------------------ */

export type SubscriptionStatus =
  | "pending"
  | "active"
  | "suspended"
  | "cancelled"
  | "expired";

export type PaymentType = "paytm" | "cash" | "complimentary";
export type PaymentStatus = "pending" | "success" | "failed" | "refunded";
export type BillingCycle = "monthly" | "yearly";
export type SubscriptionSource = "manual" | "complimentary";

/* ------------------------------------------------------------------ */
/* Response shapes                                                    */
/* ------------------------------------------------------------------ */

export interface SubscriptionSummary {
  id: number | null;
  user_name?: string | null;
  user_email?: string | null;
  plan_id: string | null;
  plan_name: string | null;
  billing_cycle: string | null;
  status: string | null;
  source: string | null;
  base_price: number | null;
  gst_rate: number | null;
  gst_amount: number | null;
  payable_amount: number | null;
  start_date: string | null;
  expiry_date: string | null;
  renewal_date: string | null;
  auto_renew: boolean;
  remaining_days: number | null;
  notes: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  user_id?: number | null;
}

export interface PaymentSummary {
  id: number | null;
  status: string | null;
  type: string | null;
  gateway: string | null;
  amount: number | null;
  currency: string | null;
  invoice_number: string | null;
  receipt_number: string | null;
  paid_at: string | null;
  order_id: string | null;
}

export interface AIUsageSummary {
  daily_limit: number | null;
  daily_used: number;
  daily_remaining: number | null;

  monthly_limit: number | null;
  monthly_used: number;
  monthly_remaining: number | null;

  yearly_limit: number | null;
  yearly_used: number;
  yearly_remaining: number | null;

  token_balance: number | null;
  tokens_used: number;

  reset_frequency: string | null;
  last_reset_at: string | null;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  mobile?: string | null;
  firm?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pin_code?: string | null;
  plan?: string | null;
  role: string;
  status: string;
  last_login?: string | null;
  created_at: string;

  subscription?: SubscriptionSummary | null;
  payment?: PaymentSummary | null;
  ai_usage?: AIUsageSummary | null;
}

export interface AdminUserDetail extends AdminUser {
  telephone?: string | null;
  fax?: string | null;
  is_admin?: boolean;
  is_staff?: boolean;
  approved_at?: string | null;
  approved_by?: string | null;
  updated_at?: string | null;
  subscription_history?: SubscriptionSummary[] | null;
}

/** Payload for PUT /admin/users/{id} — password is write-only, never returned. */
export interface AdminUserUpdate {
  name?: string;
  firm?: string;
  mobile?: string;
  telephone?: string;
  fax?: string;
  address?: string;
  city?: string;
  state?: string;
  pin_code?: string;
  status?: string;
  is_admin?: boolean;
  is_staff?: boolean;
  password?: string;
}

export interface AdminAuditEvent {
  id: number;
  timestamp: string;
  action: string;
  performed_by: string | null;
  description: string | null;
  previous_value?: Record<string, unknown> | null;
  new_value?: Record<string, unknown> | null;
  target_type?: string | null;
  target_id?: number | null;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

/* ------------------------------------------------------------------ */
/* Subscription request payloads                                      */
/* ------------------------------------------------------------------ */

export interface SubscriptionListParams {
  page?: number;
  limit?: number;
  status?: string;
  plan_id?: string;
  source?: string;
  search?: string;
  expiry_window?: string;
  expiry_from?: string;
  expiry_to?: string;
}

export interface SubscriptionCreateManual {
  user_id: number;
  plan_id: string;
  billing_cycle: BillingCycle;
  source: SubscriptionSource;
  override_base_price?: number | null;
  override_start_date?: string | null;
  override_expiry_date?: string | null;
  notes?: string | null;
}

export interface SubscriptionUpdate {
  plan_id?: string;
  billing_cycle?: BillingCycle;
  status?: SubscriptionStatus;
  start_date?: string;
  expiry_date?: string;
  renewal_date?: string;
  auto_renew?: boolean;
  notes?: string;
  reason?: string;
}

export interface SubscriptionExtend {
  days: number;
  reason?: string;
}

/* ------------------------------------------------------------------ */
/* Payment request/response payloads — mirrors GET/POST /admin/payments */
/* ------------------------------------------------------------------ */

export interface PaymentListParams {
  page?: number;
  limit?: number;
  status?: PaymentStatus | string;
  gateway?: PaymentType | string;
  search?: string;
  date_from?: string;
  date_to?: string;
}

export interface AdminPayment {
  id: number;
  user_id: number;
  subscription_id: number | null;
  gateway: string;
  status: string;
  order_id: string;
  gateway_txn_id: string | null;
  plan_id: string;
  plan_name: string;
  base_price: number;
  gst_rate: number;
  gst_amount: number;
  payable_amount: number;
  currency: string;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_mobile?: string | null;
  invoice_number: string | null;
  receipt_number: string | null;
  payment_notes?: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface CashPaymentCreate {
  user_id: number;
  plan_id: string;
  billing_cycle: BillingCycle;
  override_base_price?: number | null;
  payment_notes?: string | null;
}
