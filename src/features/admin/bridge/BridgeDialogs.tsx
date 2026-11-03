/* eslint-disable prettier/prettier */
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useRevokeBridgeCustomer,
  useSetBridgeCustomerLimits,
  useSetBridgeCustomerStatus,
  useSetBridgePlanLimits,
} from "@/hooks";
import { apiErrorMessage } from "@/features/admin/users/admin-user-utils";
import type { BridgeCustomer, BridgePlanLimits } from "@/types/bridge";
import { bridgePlanLabel } from "@/features/bridge/bridge-utils";

/** "" -> null (no number), otherwise a whole number >= 0, or undefined when invalid. */
function parseLimit(value: string): number | null | undefined {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isInteger(n) && n >= 0 ? n : undefined;
}

/* ------------------------------------------------------------------ */
/* Plan limits                                                        */
/* ------------------------------------------------------------------ */

export function EditPlanLimitsDialog({
  plan,
  onOpenChange,
}: {
  plan: BridgePlanLimits | null;
  onOpenChange: (open: boolean) => void;
}) {
  const save = useSetBridgePlanLimits();
  const [searches, setSearches] = useState(plan?.daily_limit != null ? String(plan.daily_limit) : "");
  const [docs, setDocs] = useState(plan?.daily_doc_limit != null ? String(plan.daily_doc_limit) : "");

  const submit = () => {
    if (!plan) return;
    const s = parseLimit(searches);
    const d = parseLimit(docs);
    if (s === undefined || d === undefined || s === null || d === null) {
      toast.error("Enter whole numbers for both limits.");
      return;
    }
    save.mutate(
      { plan: plan.plan, limits: { daily_limit: s, daily_doc_limit: d } },
      {
        onSuccess: () => {
          toast.success("Plan limits updated");
          onOpenChange(false);
        },
        onError: (e) => toast.error(apiErrorMessage(e, "Couldn't update the plan limits.")),
      },
    );
  };

  return (
    <Dialog open={plan !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit plan limits</DialogTitle>
          <DialogDescription>
            {plan ? bridgePlanLabel(plan.plan) : ""} — applies on each customer's next question to everyone on this plan
            who has no personal limit.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="plan-searches">Searches / day</Label>
            <Input id="plan-searches" inputMode="numeric" value={searches} onChange={(e) => setSearches(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="plan-docs">Documents / day</Label>
            <Input id="plan-docs" inputMode="numeric" value={docs} onChange={(e) => setDocs(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={save.isPending}>
            Close
          </Button>
          <Button onClick={submit} disabled={save.isPending} className="gap-1.5">
            {save.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save limits
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* One customer's limits                                              */
/* ------------------------------------------------------------------ */

export function EditCustomerLimitsDialog({
  customer,
  onOpenChange,
}: {
  customer: BridgeCustomer | null;
  onOpenChange: (open: boolean) => void;
}) {
  const save = useSetBridgeCustomerLimits();
  const [searches, setSearches] = useState(
    customer?.search_limit_source === "user" && customer.search_limit != null ? String(customer.search_limit) : "",
  );
  const [docs, setDocs] = useState(
    customer?.document_limit_source === "user" && customer.document_limit != null ? String(customer.document_limit) : "",
  );

  const submit = () => {
    if (!customer) return;
    const s = parseLimit(searches);
    const d = parseLimit(docs);
    if (s === undefined || d === undefined) {
      toast.error("Limits must be whole numbers, or left empty to follow the plan.");
      return;
    }
    save.mutate(
      { userId: customer.user_id, limits: { daily_limit: s, daily_doc_limit: d } },
      {
        onSuccess: () => {
          toast.success("Customer limits updated");
          onOpenChange(false);
        },
        onError: (e) => toast.error(apiErrorMessage(e, "Couldn't update the customer's limits.")),
      },
    );
  };

  return (
    <Dialog open={customer !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit limits</DialogTitle>
          <DialogDescription>
            {customer?.name ?? customer?.email ?? customer?.user_id} — a personal limit overrides the plan. Leave a field
            empty to follow the plan.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="cust-searches">Searches / day</Label>
            <Input
              id="cust-searches"
              inputMode="numeric"
              placeholder="Plan limit"
              value={searches}
              onChange={(e) => setSearches(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cust-docs">Documents / day</Label>
            <Input
              id="cust-docs"
              inputMode="numeric"
              placeholder="Plan limit"
              value={docs}
              onChange={(e) => setDocs(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={save.isPending}>
            Close
          </Button>
          <Button onClick={submit} disabled={save.isPending} className="gap-1.5">
            {save.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save limits
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Suspend / activate / revoke                                        */
/* ------------------------------------------------------------------ */

export type BridgeCustomerAction = "suspend" | "activate" | "revoke";

const ACTION_COPY: Record<BridgeCustomerAction, { title: string; description: string; confirm: string; destructive?: boolean; done: string }> = {
  suspend: {
    title: "Suspend ITL Bridge AI access",
    description: "Access stops until you activate it again. The customer's record and connected apps are kept.",
    confirm: "Suspend",
    done: "Customer suspended",
  },
  activate: {
    title: "Activate ITL Bridge AI access",
    description: "Access resumes on the customer's next question — no reconnect needed.",
    confirm: "Activate",
    done: "Customer activated",
  },
  revoke: {
    title: "Revoke ITL Bridge AI access",
    description:
      "Access stops at once and all of this customer's AI apps are disconnected. They must reconnect after buying again. Use for refunds or misuse.",
    confirm: "Revoke access",
    destructive: true,
    done: "Customer revoked",
  },
};

export function BridgeCustomerActionDialog({
  customer,
  action,
  onOpenChange,
}: {
  customer: BridgeCustomer;
  action: BridgeCustomerAction | null;
  onOpenChange: (open: boolean) => void;
}) {
  const setStatus = useSetBridgeCustomerStatus();
  const revoke = useRevokeBridgeCustomer();
  const copy = action ? ACTION_COPY[action] : null;
  const pending = setStatus.isPending || revoke.isPending;

  const submit = () => {
    if (!action || !copy) return;
    const options = {
      onSuccess: () => {
        toast.success(copy.done);
        onOpenChange(false);
      },
      onError: (e: unknown) => toast.error(apiErrorMessage(e, "The action couldn't be completed.")),
    };
    if (action === "revoke") revoke.mutate(customer.user_id, options);
    else setStatus.mutate({ userId: customer.user_id, status: action === "suspend" ? "suspended" : "active" }, options);
  };

  return (
    <Dialog open={action !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{copy?.title}</DialogTitle>
          <DialogDescription>
            {customer.name ?? customer.email ?? customer.user_id}. {copy?.description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Close
          </Button>
          <Button
            onClick={submit}
            disabled={pending}
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
