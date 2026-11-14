/* eslint-disable prettier/prettier */
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/**
 * Which products a subscription grants. ITL Bridge AI is never sold alone, so the
 * only choices are ITL AI and ITL AI + ITL Bridge AI. "plan" = whatever the chosen plan includes.
 */
export type ProductAccess = "plan" | "itl_ai" | "bundle";

export const PRODUCT_ACCESS_PRODUCTS: Record<Exclude<ProductAccess, "plan">, string[]> = {
  itl_ai: ["itl_ai"],
  bundle: ["itl_ai", "itl_bridge_ai"],
};

export function accessFromProducts(products?: string[] | null): ProductAccess {
  if (!products || products.length === 0) return "itl_ai";
  return products.includes("itl_bridge_ai") ? "bundle" : "itl_ai";
}

export function productsFromAccess(access: ProductAccess): string[] | undefined {
  return access === "plan" ? undefined : PRODUCT_ACCESS_PRODUCTS[access];
}

export function ProductAccessField({
  value,
  onChange,
  allowPlanDefault = false,
}: {
  value: ProductAccess;
  onChange: (value: ProductAccess) => void;
  /** Offer "Same as the plan" (for creating a subscription). */
  allowPlanDefault?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label>Product access</Label>
      <Select value={value} onValueChange={(v) => onChange(v as ProductAccess)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {allowPlanDefault && <SelectItem value="plan">Same as the plan</SelectItem>}
          <SelectItem value="itl_ai">ITL AI</SelectItem>
          <SelectItem value="bundle">ITL AI + ITL Bridge AI</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
