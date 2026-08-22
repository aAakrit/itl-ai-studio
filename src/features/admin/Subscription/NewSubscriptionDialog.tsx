/* eslint-disable prettier/prettier */
import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateManualSubscription, usePricing } from "@/hooks";
import type { AdminUser, BillingCycle, SubscriptionSource } from "@/types/admin";
import type { PricingPlan } from "@/types";
import { UserPicker } from "./UserPicker";
import {
  BILLING_CYCLE_OPTIONS,
  SUBSCRIPTION_SOURCE_OPTIONS,
  apiErrorMessage,
  formatMoney,
  fromDateInput,
} from "@/features/admin/users/admin-user-utils";

const GST_RATE = 18;

/**
 * Same create-subscription flow as the per-user dialog, but with a user
 * search built in — used from the global Admin > Subscriptions page where
 * there's no user already in context.
 */
export function NewSubscriptionDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: pricing } = usePricing();
  const plans = (pricing?.plans ?? []) as PricingPlan[];
  const create = useCreateManualSubscription();

  const [user, setUser] = useState<AdminUser | null>(null);
  const [planId, setPlanId] = useState("");
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [source, setSource] = useState<SubscriptionSource>("manual");
  const [override, setOverride] = useState("");
  const [startDate, setStartDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");

  const plan = plans.find((p) => p.id === planId);
  const previewBase = useMemo(() => {
    const parsed = Number(override);
    if (override !== "" && Number.isFinite(parsed)) return parsed;
    if (!plan) return null;
    return cycle === "yearly" ? (plan.yearlyPrice ?? plan.price) : plan.price;
  }, [override, plan, cycle]);

  const reset = () => {
    setUser(null);
    setPlanId("");
    setOverride("");
    setStartDate("");
    setExpiryDate("");
    setNotes("");
  };

  const submit = () => {
    if (!user) {
      toast.error("Select a user first.");
      return;
    }
    if (!planId) {
      toast.error("Select a plan first.");
      return;
    }
    const parsedOverride = Number(override);
    create.mutate(
      {
        user_id: user.id,
        plan_id: planId,
        billing_cycle: cycle,
        source,
        override_base_price:
          override !== "" && Number.isFinite(parsedOverride) ? parsedOverride : null,
        override_start_date: fromDateInput(startDate) ?? null,
        override_expiry_date: fromDateInput(expiryDate) ?? null,
        notes: notes.trim() || null,
      },
      {
        onSuccess: () => {
          toast.success(`Subscription created for ${user.name}`);
          reset();
          onOpenChange(false);
        },
        onError: (e) => toast.error(apiErrorMessage(e, "Couldn't create the subscription.")),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New subscription</DialogTitle>
          <DialogDescription>Create a subscription for any user.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>User</Label>
            <UserPicker value={user} onChange={setUser} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Plan</Label>
              <Select value={planId} onValueChange={setPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Billing cycle</Label>
              <Select value={cycle} onValueChange={(v) => setCycle(v as BillingCycle)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BILLING_CYCLE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Source</Label>
              <Select value={source} onValueChange={(v) => setSource(v as SubscriptionSource)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUBSCRIPTION_SOURCE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="new-sub-override">Price override (optional)</Label>
              <Input
                id="new-sub-override"
                type="number"
                min={0}
                placeholder="Leave blank to use the plan price"
                value={override}
                onChange={(e) => setOverride(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-sub-start">Start date (optional)</Label>
              <Input
                id="new-sub-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-sub-expiry">Expiry date (optional)</Label>
              <Input
                id="new-sub-expiry"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
          </div>

          {previewBase !== null && (
            <div className="space-y-1.5 rounded-lg border border-border/60 bg-secondary/30 p-3 text-xs">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Pricing preview
              </p>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Base price</span>
                <span>{formatMoney(previewBase)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">GST {GST_RATE}%</span>
                <span>{formatMoney(Math.round(previewBase * GST_RATE) / 100)}</span>
              </div>
              <Separator className="my-1.5" />
              <div className="flex items-center justify-between font-semibold text-foreground">
                <span>Payable amount</span>
                <span>{formatMoney(previewBase + Math.round(previewBase * GST_RATE) / 100)}</span>
              </div>
              <p className="pt-1 text-[11px] text-muted-foreground">
                Preview only — the saved subscription uses server-calculated amounts.
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="new-sub-notes">Notes</Label>
            <Textarea
              id="new-sub-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={create.isPending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={create.isPending} className="gap-1.5">
            {create.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Create subscription
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
