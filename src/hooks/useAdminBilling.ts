/* eslint-disable prettier/prettier */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminBillingService, type BillListParams, type CouponListParams } from "@/services/admin-billing.service";
import type { BillWrite, CouponCreate, CouponUpdate } from "@/types/checkout";

export const useAdminCoupons = (params: CouponListParams) =>
  useQuery({
    queryKey: ["admin", "coupons", params],
    queryFn: () => adminBillingService.listCoupons(params),
    placeholderData: keepPreviousData,
  });

export const useCreateCoupon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CouponCreate) => adminBillingService.createCoupon(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "coupons"] }),
  });
};

export const useUpdateCoupon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: CouponUpdate }) => adminBillingService.updateCoupon(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "coupons"] }),
  });
};

export const useAdminBills = (params: BillListParams) =>
  useQuery({
    queryKey: ["admin", "bills", params],
    queryFn: () => adminBillingService.listBills(params),
    placeholderData: keepPreviousData,
  });

export const useSaveBill = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id?: number; payload: BillWrite }) =>
      id ? adminBillingService.updateBill(id, payload) : adminBillingService.createBill(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "bills"] }),
  });
};

export const useCancelBill = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) => adminBillingService.cancelBill(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "bills"] }),
  });
};

export const useSalesmen = (enabled = true) =>
  useQuery({
    queryKey: ["admin", "salesmen"],
    queryFn: () => adminBillingService.salesmen(),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
