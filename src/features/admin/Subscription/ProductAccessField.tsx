/* eslint-disable prettier/prettier */
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/**
 * Which products a subscription grants: ITL AI (the web workspace), ITL Bridge AI (the GST AI /
 * Income Tax AI connectors), or both. "plan" = whatever the chosen plan includes.
 */
export type ProductAccess = "plan" | "itl_ai" | "bridge" | "bundle";

export const PRODUCT_ACCESS_PRODUCTS: Record<Exclude<ProductAccess, "plan">, string[]> = {
  itl_ai: ["itl_ai"],
  bridge: ["itl_bridge_ai"],
  bundle: ["itl_ai", "itl_bridge_ai"],
};

export function accessFromProducts(products?: string[] | null): ProductAccess {
  if (!products || products.length === 0) return "itl_ai";
  const bridge = products.includes("itl_bridge_ai");
  const ai = products.includes("itl_ai");
  return bridge && ai ? "bundle" : bridge ? "bridge" : "itl_ai";
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
          <SelectItem value="itl_ai">ITL AI (workspace)</SelectItem>
          <SelectItem value="bridge">ITL Bridge AI only (connectors)</SelectItem>
          <SelectItem value="bundle">ITL AI + ITL Bridge AI</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
