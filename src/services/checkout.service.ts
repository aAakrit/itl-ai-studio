import { api, endpoints } from "@/services/api/api";
import type { AdminPayment, PaymentInitiateRequest, PaymentInitiateResponse } from "@/types/admin";

/** User-facing checkout — starting a Paytm transaction and checking on it afterwards. */
export const checkoutService = {
  async initiate(payload: PaymentInitiateRequest): Promise<PaymentInitiateResponse> {
    const { data } = await api.post(endpoints.checkout.initiate, payload);
    return data;
  },
  async status(orderId: string): Promise<AdminPayment> {
    const { data } = await api.get(endpoints.checkout.status(orderId));
    return data;
  },
  async recheck(orderId: string): Promise<AdminPayment> {
    const { data } = await api.post(endpoints.checkout.recheck(orderId));
    return data;
  },
};
