/* eslint-disable prettier/prettier */
import { useMemo, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import {
  useActivateSubscription,
  useCancelSubscription,
  useCreateManualSubscription,
  useExtendSubscription,
  usePricing,
  useSuspendSubscription,
  useUpdateSubscription,
} from "@/hooks";
import type {
  BillingCycle,
  SubscriptionSource,
  SubscriptionStatus,
  SubscriptionSummary,
} from "@/types/admin";
import type { PricingPlan } from "@/types";
import {
  BILLING_CYCLE_OPTIONS,
  SUBSCRIPTION_SOURCE_OPTIONS,
  apiErrorMessage,
  formatDate,
  formatMoney,
  fromDateInput,
  toDateInput,
} from "./admin-user-utils";

const GST_RATE = 18;

/** Optional client-side preview only — the backend response is authoritative. */
function PricingPreview({
  plan,
  cycle,
  override,
}: {
  plan?: PricingPlan;
  cycle: BillingCycle;
  override: string;
}) {
  const base = useMemo(() => {
    const parsed = Number(override);
    if (override !== "" && Number.isFinite(parsed)) return parsed;
    if (!plan) return null;
    return cycle === "yearly" ? (plan.yearlyPrice ?? plan.price) : plan.price;
  }, [override, plan, cycle]);

  if (base === null || base === undefined) {
    return (
      <div className="rounded-lg border border-dashed border-border/60 p-3 text-xs text-muted-foreground">
        Select a plan to preview pricing. Final amounts are calculated by the server.
      </div>
    );
  }

  const gst = Math.round(base * GST_RATE) / 100;
  return (
    <div className="space-y-1.5 rounded-lg border border-border/60 bg-secondary/30 p-3 text-xs">
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Pricing preview
      </p>
      <Row label="Base price" value={formatMoney(base)} />
      <Row label={`GST ${GST_RATE}%`} value={formatMoney(gst)} />
      <Separator className="my-1.5" />
      <Row label="Payable amount" value={formatMoney(base + gst)} strong />
      <p className="pt-1 text-[11px] text-muted-foreground">
        Preview only — the saved subscription uses server-calculated amounts.
      </p>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? "font-semibold text-foreground" : "text-foreground"}>{value}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Create manual subscription                                         */
/* ------------------------------------------------------------------ */

export function CreateSubscriptionDialog({
  open,
  onOpenChange,
  userId,
  userName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: number;
  userName?: string | null;
}) {
  const { data: pricing } = usePricing();
  const plans = (pricing?.plans ?? []) as PricingPlan[];
  const create = useCreateManualSubscription();

  const [planId, setPlanId] = useState("");
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [source, setSource] = useState<SubscriptionSource>("manual");
  const [override, setOverride] = useState("");
  const [startDate, setStartDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");

  const plan = plans.find((p) => p.id === planId);

  const submit = () => {
    if (!planId) {
      toast.error("Select a plan first.");
      return;
    }
    const parsedOverride = Number(override);
    create.mutate(
      {
        user_id: userId,
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
          toast.success("Subscription created");
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
          <DialogTitle>Create subscription</DialogTitle>
          <DialogDescription>
            {userName ? `For ${userName}` : `For user #${userId}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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
              <Label htmlFor="override">Price override (optional)</Label>
              <Input
                id="override"
                type="number"
                min={0}
                placeholder="Leave blank to use the plan price"
                value={override}
                onChange={(e) => setOverride(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="start">Start date (optional)</Label>
              <Input
                id="start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expiry">Expiry date (optional)</Label>
              <Input
                id="expiry"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <PricingPreview plan={plan} cycle={cycle} override={override} />
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

/* ------------------------------------------------------------------ */
/* Edit subscription                                                  */
/* ------------------------------------------------------------------ */

const STATUS_OPTIONS: { value: SubscriptionStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "cancelled", label: "Cancelled" },
  { value: "expired", label: "Expired" },
];

export function EditSubscriptionDialog({
  open,
  onOpenChange,
  subscription,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: SubscriptionSummary;
}) {
  const { data: pricing } = usePricing();
  const plans = (pricing?.plans ?? []) as PricingPlan[];
  const update = useUpdateSubscription();

  const [planId, setPlanId] = useState(subscription.plan_id ?? "");
  const [cycle, setCycle] = useState<BillingCycle>(
    (subscription.billing_cycle as BillingCycle) ?? "monthly",
  );
  const [status, setStatus] = useState<SubscriptionStatus>(
    (subscription.status as SubscriptionStatus) ?? "active",
  );
  const [startDate, setStartDate] = useState(toDateInput(subscription.start_date));
  const [expiryDate, setExpiryDate] = useState(toDateInput(subscription.expiry_date));
  const [renewalDate, setRenewalDate] = useState(toDateInput(subscription.renewal_date));
  const [autoRenew, setAutoRenew] = useState(Boolean(subscription.auto_renew));
  const [notes, setNotes] = useState(subscription.notes ?? "");
  const [reason, setReason] = useState("");

  const planChanged = planId !== (subscription.plan_id ?? "");
  const cycleChanged = cycle !== (subscription.billing_cycle ?? "monthly");

  const submit = () => {
    if (!subscription.id) return;
    update.mutate(
      {
        id: subscription.id,
        patch: {
          plan_id: planId || undefined,
          billing_cycle: cycle,
          status,
          start_date: fromDateInput(startDate),
          expiry_date: fromDateInput(expiryDate),
          renewal_date: fromDateInput(renewalDate),
          auto_renew: autoRenew,
          notes: notes.trim() || undefined,
          reason: reason.trim() || undefined,
        },
      },
      {
        onSuccess: (saved) => {
          const s = saved as SubscriptionSummary;
          toast.success(
            s?.payable_amount != null
              ? `Subscription updated — payable ${formatMoney(s.payable_amount)}`
              : "Subscription updated",
          );
          onOpenChange(false);
        },
        onError: (e) => toast.error(apiErrorMessage(e, "Couldn't update the subscription.")),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit subscription</DialogTitle>
          <DialogDescription>
            {subscription.plan_name ?? "Current subscription"} · #{subscription.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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
                  {planId && !plans.some((p) => p.id === planId) && (
                    <SelectItem value={planId}>{subscription.plan_name ?? planId}</SelectItem>
                  )}
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
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as SubscriptionStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="e-start">Start date</Label>
              <Input
                id="e-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="e-expiry">Expiry date</Label>
              <Input
                id="e-expiry"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="e-renewal">Renewal date</Label>
              <Input
                id="e-renewal"
                type="date"
                value={renewalDate}
                onChange={(e) => setRenewalDate(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between self-end rounded-lg border border-border/60 px-3 py-2">
              <Label htmlFor="e-auto" className="text-sm font-normal">
                Auto renew
              </Label>
              <Switch id="e-auto" checked={autoRenew} onCheckedChange={setAutoRenew} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="e-notes">Notes</Label>
              <Textarea
                id="e-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="e-reason">Reason (recorded in the audit trail)</Label>
              <Input id="e-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
          </div>

          {(planChanged || cycleChanged) && (
            <div className="flex gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              <p>
                Changing the {planChanged && "plan"}
                {planChanged && cycleChanged && " and "}
                {cycleChanged && "billing cycle"} re-snapshots the pricing. The server recalculates
                base price, GST and payable amount — the new values will be shown after saving.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={update.isPending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={update.isPending} className="gap-1.5">
            {update.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save subscription
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Extend subscription                                                */
/* ------------------------------------------------------------------ */

export function ExtendSubscriptionDialog({
  open,
  onOpenChange,
  subscription,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: SubscriptionSummary;
}) {
  const extend = useExtendSubscription();
  const [days, setDays] = useState("30");
  const [reason, setReason] = useState("");

  const parsedDays = Number(days);
  const valid = Number.isInteger(parsedDays) && parsedDays > 0 && parsedDays <= 3650;

  const projectedExpiry = useMemo(() => {
    if (!valid || !subscription.expiry_date) return null;
    const d = new Date(subscription.expiry_date);
    if (Number.isNaN(d.getTime())) return null;
    d.setDate(d.getDate() + parsedDays);
    return d.toISOString();
  }, [valid, parsedDays, subscription.expiry_date]);

  const submit = () => {
    if (!subscription.id || !valid) return;
    extend.mutate(
      { id: subscription.id, payload: { days: parsedDays, reason: reason.trim() || undefined } },
      {
        onSuccess: (saved) => {
          const s = saved as SubscriptionSummary;
          toast.success(
            s?.expiry_date
              ? `Extended — new expiry ${formatDate(s.expiry_date)}`
              : "Subscription extended",
          );
          onOpenChange(false);
        },
        onError: (e) => toast.error(apiErrorMessage(e, "Couldn't extend the subscription.")),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Extend subscription</DialogTitle>
          <DialogDescription>{subscription.plan_name ?? `#${subscription.id}`}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
            <span className="text-muted-foreground">Current expiry</span>
            <span className="font-medium">{formatDate(subscription.expiry_date)}</span>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="days">Extension days</Label>
            <Input
              id="days"
              type="number"
              min={1}
              max={3650}
              value={days}
              onChange={(e) => setDays(e.target.value)}
            />
            {!valid && (
              <p className="text-xs text-destructive">Enter a whole number between 1 and 3650.</p>
            )}
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
            <span className="text-muted-foreground">Projected new expiry</span>
            <span className="font-medium">
              {projectedExpiry ? formatDate(projectedExpiry) : "Calculated by the server"}
            </span>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="x-reason">Reason</Label>
            <Input id="x-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={extend.isPending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!valid || extend.isPending} className="gap-1.5">
            {extend.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Extend
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Suspend / cancel / activate                                        */
/* ------------------------------------------------------------------ */

export type SubscriptionAction = "suspend" | "cancel" | "activate";

const ACTION_COPY: Record<
  SubscriptionAction,
  { title: string; description: string; confirm: string; requireReason: boolean; destructive: boolean }
> = {
  suspend: {
    title: "Suspend subscription",
    description:
      "The subscription entitlement is paused. This does not suspend the user's account — use the user actions for that.",
    confirm: "Suspend subscription",
    requireReason: false,
    destructive: false,
  },
  cancel: {
    title: "Cancel subscription",
    description:
      "Cancelling ends this subscription entitlement. A reason is required and is recorded in the audit trail.",
    confirm: "Cancel subscription",
    requireReason: true,
    destructive: true,
  },
  activate: {
    title: "Activate subscription",
    description: "The subscription entitlement becomes active immediately.",
    confirm: "Activate subscription",
    requireReason: false,
    destructive: false,
  },
};

export function SubscriptionActionDialog({
  action,
  onOpenChange,
  subscription,
}: {
  action: SubscriptionAction | null;
  onOpenChange: (open: boolean) => void;
  subscription: SubscriptionSummary;
}) {
  const [reason, setReason] = useState("");
  const suspend = useSuspendSubscription();
  const cancel = useCancelSubscription();
  const activate = useActivateSubscription();

  const copy = action ? ACTION_COPY[action] : null;
  const pending = suspend.isPending || cancel.isPending || activate.isPending;
  const blocked = Boolean(copy?.requireReason && !reason.trim());

  const submit = () => {
    if (!action || !subscription.id) return;
    const mutation = action === "suspend" ? suspend : action === "cancel" ? cancel : activate;
    mutation.mutate(
      { id: subscription.id, reason: reason.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(
            action === "suspend"
              ? "Subscription suspended"
              : action === "cancel"
                ? "Subscription cancelled"
                : "Subscription activated",
          );
          setReason("");
          onOpenChange(false);
        },
        onError: (e) => toast.error(apiErrorMessage(e, "The action couldn't be completed.")),
      },
    );
  };

  return (
    <Dialog open={action !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{copy?.title}</DialogTitle>
          <DialogDescription>{copy?.description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="a-reason">
            Reason {copy?.requireReason ? "(required)" : "(optional)"}
          </Label>
          <Textarea
            id="a-reason"
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Close
          </Button>
          <Button
            onClick={submit}
            disabled={pending || blocked}
            className="gap-1.5"
            variant={copy?.destructive ? "destructive" : "default"}
          >
            {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {copy?.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
