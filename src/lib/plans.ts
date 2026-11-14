/* eslint-disable prettier/prettier */
import type { PricingPlan } from "@/types";

export type ProductId = "itl_ai" | "itl_bridge_ai";

export const PRODUCT_LABELS: Record<string, string> = {
  itl_ai: "ITL AI",
  itl_bridge_ai: "ITL Bridge AI",
};

/** "ITL AI" or "ITL AI + ITL Bridge AI". */
export function productsLabel(products?: string[] | null): string {
  const list = products && products.length ? products : ["itl_ai"];
  return (["itl_ai", "itl_bridge_ai"] as const)
    .filter((p) => list.includes(p))
    .map((p) => PRODUCT_LABELS[p])
    .join(" + ");
}

/** Price before GST for the plan's whole term. Falls back to the older yearlyPrice / price fields. */
export function planBasePrice(plan?: Partial<PricingPlan> | null): number | null {
  if (!plan) return null;
  const raw = plan.basePrice ?? plan.yearlyPrice ?? plan.price;
  const n = Number(raw);
  return raw === undefined || raw === null || (raw as unknown) === "" || !Number.isFinite(n) ? null : n;
}

export function planTermYears(plan?: Partial<PricingPlan> | null): number {
  return Number(plan?.termYears) > 0 ? Number(plan?.termYears) : 1;
}

export function termLabel(years: number): string {
  return years === 1 ? "1 Year" : `${years} Years`;
}

/** Plan name with its term, for pickers: "ITL AI + ITL Bridge AI — 3 Years". */
export function planOptionLabel(plan: Partial<PricingPlan>): string {
  return `${plan.name ?? plan.id} — ${termLabel(planTermYears(plan))}`;
}
