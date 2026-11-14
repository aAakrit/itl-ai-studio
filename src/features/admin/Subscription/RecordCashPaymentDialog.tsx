/* eslint-disable prettier/prettier */
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { useRecordCashPayment, usePricing } from "@/hooks";
import type { AdminUser, BillingCycle } from "@/types/admin";
import type { PricingPlan } from "@/types";
import { planBasePrice, planOptionLabel, planTermYears, termLabel } from "@/lib/plans";
import { UserPicker } from "./UserPicker";
import { BILLING_CYCLE_OPTIONS, apiErrorMessage, formatMoney } from "@/features/admin/users/admin-user-utils";

export function RecordCashPaymentDialog({
  open,
  onOpenChange,
  defaultUser,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultUser?: AdminUser | null;
}) {
  const { data: pricing } = usePricing();
  const plans = (pricing?.plans ?? []) as PricingPlan[];
  const record = useRecordCashPayment();

  const [user, setUser] = useState<AdminUser | null>(defaultUser ?? null);
  const [planId, setPlanId] = useState("");
    const [override, setOverride] = useState("");
  const [notes, setNotes] = useState("");

  const plan = plans.find((p) => p.id === planId);
  const previewBase = (() => {
    const parsed = Number(override);
    if (override !== "" && Number.isFinite(parsed)) return parsed;
    if (!plan) return null;
    return planBasePrice(plan);
  })();

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
    record.mutate(
      {
        user_id: user.id,
        plan_id: planId,
        override_base_price:
          override !== "" && Number.isFinite(parsedOverride) ? parsedOverride : null,
        payment_notes: notes.trim() || null,
      },
      {
        onSuccess: () => {
          toast.success(`Cash payment recorded for ${user.name}`);
          setUser(null);
          setPlanId("");
          setOverride("");
          setNotes("");
          onOpenChange(false);
        },
        onError: (e) => toast.error(apiErrorMessage(e, "Couldn't record the payment.")),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Record cash payment</DialogTitle>
          <DialogDescription>
            Activates a subscription immediately, exactly like a successful online payment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>User</Label>
            <UserPicker value={user} onChange={setUser} disabled={Boolean(defaultUser)} />
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
                      {planOptionLabel(p)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Term</Label>
              <div className="flex h-10 items-center rounded-md border border-border/60 bg-secondary/30 px-3 text-sm text-muted-foreground">
                {plan ? termLabel(planTermYears(plan)) : "Set by the plan"}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cash-override">Price override (optional)</Label>
              <Input
                id="cash-override"
                type="number"
                min={0}
                placeholder="Plan price"
                value={override}
                onChange={(e) => setOverride(e.target.value)}
              />
            </div>
          </div>

          {previewBase !== null && (
            <div className="rounded-lg border border-border/60 bg-secondary/30 p-3 text-xs">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Preview — final amount is calculated by the server
              </p>
              <p className="text-sm font-semibold">
                {formatMoney(previewBase + Math.round(previewBase * 18) / 100)} payable (incl. 18% GST)
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="cash-notes">Notes</Label>
            <Textarea
              id="cash-notes"
              rows={2}
              placeholder="e.g. Cash received at office, receipt handed over"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={record.isPending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={record.isPending} className="gap-1.5">
            {record.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Record payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
