/* eslint-disable prettier/prettier */
import { api, endpoints } from "@/services/api/api";
import type { Bill, BillWrite, Coupon, CouponCreate, CouponUpdate, Paged, Salesman } from "@/types/checkout";

export interface CouponListParams {
  page?: number;
  limit?: number;
  search?: string;
  active?: boolean;
}

export interface BillListParams {
  page?: number;
  limit?: number;
  search?: string;
  financial_year?: string;
  status?: "active" | "cancelled";
}

function clean<T extends Record<string, unknown>>(params: T): Partial<T> {
  return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== "" && v !== null)) as Partial<T>;
}

export const adminBillingService = {
  /* ---- coupons ---- */
  async listCoupons(params: CouponListParams = {}): Promise<Paged<Coupon>> {
    const { data } = await api.get(endpoints.adminCoupons.list, { params: clean(params) });
    return data;
  },
  async createCoupon(payload: CouponCreate): Promise<Coupon> {
    const { data } = await api.post(endpoints.adminCoupons.list, payload);
    return data;
  },
  async updateCoupon(id: number, payload: CouponUpdate): Promise<Coupon> {
    const { data } = await api.put(endpoints.adminCoupons.detail(id), payload);
    return data;
  },

  /* ---- bills ---- */
  async listBills(params: BillListParams = {}): Promise<Paged<Bill>> {
    const { data } = await api.get(endpoints.adminBills.list, { params: clean(params) });
    return data;
  },
  async prefillBill(params: { user_id?: number; plan_id?: string }): Promise<Partial<BillWrite> & { lines: BillWrite["lines"] }> {
    const { data } = await api.get(endpoints.adminBills.prefill, { params: clean(params) });
    return data;
  },
  async createBill(payload: BillWrite): Promise<Bill> {
    const { data } = await api.post(endpoints.adminBills.list, payload);
    return data;
  },
  async updateBill(id: number, payload: BillWrite): Promise<Bill> {
    const { data } = await api.put(endpoints.adminBills.detail(id), payload);
    return data;
  },
  async cancelBill(id: number, reason?: string): Promise<Bill> {
    const { data } = await api.post(endpoints.adminBills.cancel(id), { reason: reason || null });
    return data;
  },
  async billPdf(id: number): Promise<Blob> {
    const { data } = await api.get(endpoints.adminBills.pdf(id), { responseType: "blob" });
    return data;
  },
  async paymentBill(paymentId: number): Promise<Blob> {
    const { data } = await api.get(endpoints.adminPayments.bill(paymentId), { responseType: "blob" });
    return data;
  },

  /** Staff (non-admin) users a customer can attribute a sale to. */
  async salesmen(): Promise<Salesman[]> {
    const { data } = await api.get("/checkout/salesmen");
    return data.items;
  },
};
