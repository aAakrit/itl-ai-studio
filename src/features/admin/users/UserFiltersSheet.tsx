/* eslint-disable prettier/prettier */
import { useEffect, useState } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePricing } from "@/hooks";
import { EXPIRY_WINDOW_OPTIONS } from "./admin-user-utils";
import type { PricingPlan } from "@/types";

/** Every server-side filter the admin user list supports (search lives outside). */
export interface UserFilters {
  role: string;
  status: string;
  plan: string;
  approval_status: string;
  registration_from: string;
  registration_to: string;

  subscription_status: string;
  payment_type: string;
  payment_status: string;

  expiry_window: string;
  expiry_from: string;
  expiry_to: string;

  state: string;
  city: string;
}

export const EMPTY_FILTERS: UserFilters = {
  role: "",
  status: "",
  plan: "",
  approval_status: "",
  registration_from: "",
  registration_to: "",
  subscription_status: "",
  payment_type: "",
  payment_status: "",
  expiry_window: "",
  expiry_from: "",
  expiry_to: "",
  state: "",
  city: "",
};

export function countActiveFilters(filters: UserFilters): number {
  return Object.values(filters).filter((v) => v !== "").length;
}

const ALL = "__all__";

function FilterSelect({
  label,
  value,
  onChange,
  options,
  allLabel,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  allLabel: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select value={value || ALL} onValueChange={(v) => onChange(v === ALL ? "" : v)}>
        <SelectTrigger className="h-9">
          <SelectValue placeholder={allLabel} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{allLabel}</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      {children}
    </div>
  );
}

export function UserFiltersSheet({
  filters,
  onApply,
}: {
  filters: UserFilters;
  onApply: (next: UserFilters) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<UserFilters>(filters);
  const { data: pricing } = usePricing();
  const plans = (pricing?.plans ?? []) as PricingPlan[];

  useEffect(() => {
    if (open) setDraft(filters);
  }, [open, filters]);

  const set = <K extends keyof UserFilters>(key: K, value: UserFilters[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const active = countActiveFilters(filters);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" /> Filters
          {active > 0 && (
            <Badge className="ml-0.5 h-5 min-w-5 justify-center px-1 text-[11px]">{active}</Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="px-5 pt-5">
          <SheetTitle>Filter users</SheetTitle>
          <SheetDescription>All filters are applied server-side.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <Group title="User">
            <div className="grid grid-cols-2 gap-3">
              <FilterSelect
                label="Role"
                allLabel="All roles"
                value={draft.role}
                onChange={(v) => set("role", v)}
                options={[
                  { value: "admin", label: "Admin" },
                  { value: "staff", label: "Staff" },
                  { value: "user", label: "User" },
                ]}
              />
              <FilterSelect
                label="Account status"
                allLabel="All statuses"
                value={draft.status}
                onChange={(v) => set("status", v)}
                options={[
                  { value: "APPROVED", label: "Approved" },
                  { value: "PENDING", label: "Pending" },
                  { value: "SUSPENDED", label: "Suspended" },
                  { value: "DELETED", label: "Deleted" },
                ]}
              />
              <div className="col-span-2">
                {/* Approval status is derived from the User status field on the
                    backend — same vocabulary, different filter semantics. */}
                <FilterSelect
                  label="Approval status"
                  allLabel="Any approval state"
                  value={draft.approval_status}
                  onChange={(v) => set("approval_status", v)}
                  options={[
                    { value: "APPROVED", label: "Approved" },
                    { value: "PENDING", label: "Pending" },
                    { value: "SUSPENDED", label: "Suspended" },
                  ]}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Registered from</Label>
                <Input
                  type="date"
                  className="h-9"
                  value={draft.registration_from}
                  onChange={(e) => set("registration_from", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Registered to</Label>
                <Input
                  type="date"
                  className="h-9"
                  value={draft.registration_to}
                  onChange={(e) => set("registration_to", e.target.value)}
                />
              </div>
            </div>
          </Group>

          <Separator />

          <Group title="Subscription">
            <div className="grid grid-cols-2 gap-3">
              <FilterSelect
                label="Plan"
                allLabel="All plans"
                value={draft.plan}
                onChange={(v) => set("plan", v)}
                options={plans.map((p) => ({ value: p.id, label: p.name }))}
              />
              <FilterSelect
                label="Subscription status"
                allLabel="All subscription states"
                value={draft.subscription_status}
                onChange={(v) => set("subscription_status", v)}
                options={[
                  { value: "active", label: "Active" },
                  { value: "pending", label: "Pending" },
                  { value: "suspended", label: "Suspended" },
                  { value: "cancelled", label: "Cancelled" },
                  { value: "expired", label: "Expired" },
                ]}
              />
              <FilterSelect
                label="Payment type"
                allLabel="All payment types"
                value={draft.payment_type}
                onChange={(v) => set("payment_type", v)}
                options={[
                  { value: "paytm", label: "Paytm" },
                  { value: "cash", label: "Cash / Manual" },
                  { value: "complimentary", label: "Complimentary" },
                ]}
              />
              <FilterSelect
                label="Payment status"
                allLabel="All payment states"
                value={draft.payment_status}
                onChange={(v) => set("payment_status", v)}
                options={[
                  { value: "pending", label: "Pending" },
                  { value: "success", label: "Success" },
                  { value: "failed", label: "Failed" },
                  { value: "refunded", label: "Refunded" },
                ]}
              />
            </div>
          </Group>

          <Separator />

          <Group title="Expiry">
            <FilterSelect
              label="Expiry window"
              allLabel="Any expiry"
              value={draft.expiry_window}
              onChange={(v) => set("expiry_window", v)}
              options={EXPIRY_WINDOW_OPTIONS}
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Expiry from</Label>
                <Input
                  type="date"
                  className="h-9"
                  value={draft.expiry_from}
                  onChange={(e) => set("expiry_from", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Expiry to</Label>
                <Input
                  type="date"
                  className="h-9"
                  value={draft.expiry_to}
                  onChange={(e) => set("expiry_to", e.target.value)}
                />
              </div>
            </div>
          </Group>

          <Separator />

          <Group title="Location">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">State</Label>
                <Input
                  className="h-9"
                  placeholder="State"
                  value={draft.state}
                  onChange={(e) => set("state", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">City</Label>
                <Input
                  className="h-9"
                  placeholder="City"
                  value={draft.city}
                  onChange={(e) => set("city", e.target.value)}
                />
              </div>
            </div>
          </Group>
        </div>

        <SheetFooter className="flex-row justify-between gap-2 border-t border-border/60 px-5 py-4">
          <Button
            variant="ghost"
            className="gap-1.5"
            onClick={() => {
              setDraft(EMPTY_FILTERS);
              onApply(EMPTY_FILTERS);
              setOpen(false);
            }}
          >
            <X className="h-3.5 w-3.5" /> Clear filters
          </Button>
          <Button
            onClick={() => {
              onApply(draft);
              setOpen(false);
            }}
          >
            Apply filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
