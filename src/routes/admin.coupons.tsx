/* eslint-disable prettier/prettier */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Pencil, Plus, Search, Ticket } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TableSkeleton } from "@/features/admin/AdminSkeletons";
import { apiErrorMessage, formatDate, formatMoney } from "@/features/admin/users/admin-user-utils";
import { useAdminCoupons, useCreateCoupon, useUpdateCoupon } from "@/hooks/useAdminBilling";
import { usePricing } from "@/hooks";
import { planOptionLabel } from "@/lib/plans";
import type { PricingPlan } from "@/types";
import type { Coupon } from "@/types/checkout";

export const Route = createFileRoute("/admin/coupons")({
  component: AdminCouponsPage,
  head: () => ({ meta: [{ title: "Coupons — Admin" }] }),
});

/* Dates are entered as India dates; the server stores naive UTC. */
const IST_MS = 5.5 * 60 * 60 * 1000;
const dayStartUtc = (d: string) => new Date(`${d}T00:00:00+05:30`).toISOString().slice(0, 19);
const dayEndUtc = (d: string) => new Date(`${d}T23:59:59+05:30`).toISOString().slice(0, 19);
const utcToIstDate = (s?: string | null) => (s ? new Date(new Date(`${s}Z`).getTime() + IST_MS).toISOString().slice(0, 10) : "");

function couponStatus(c: Coupon): { label: string; className: string } {
  const now = Date.now();
  if (!c.is_active) return { label: "Disabled", className: "bg-muted text-muted-foreground" };
  if (c.valid_to && new Date(`${c.valid_to}Z`).getTime() < now) return { label: "Expired", className: "bg-destructive/10 text-destructive" };
  if (c.valid_from && new Date(`${c.valid_from}Z`).getTime() > now) return { label: "Scheduled", className: "bg-warning/15 text-warning" };
  if (c.total_limit !== null && c.times_used >= c.total_limit) return { label: "Used up", className: "bg-muted text-muted-foreground" };
  return { label: "Active", className: "bg-success/15 text-success" };
}

function AdminCouponsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [creating, setCreating] = useState(false);
  const update = useUpdateCoupon();
  const limit = 20;

  const { data, isLoading } = useAdminCoupons({ page, limit, search: search.trim() || undefined });
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const toggle = (c: Coupon) =>
    update.mutate(
      { id: c.id, patch: { is_active: !c.is_active } },
      {
        onSuccess: () => toast.success(c.is_active ? `${c.code} disabled` : `${c.code} enabled`),
        onError: (e) => toast.error(apiErrorMessage(e, "Couldn't update the coupon.")),
      },
    );

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Coupons</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Discount codes customers can enter at checkout. Discounts apply before GST.
          </p>
        </div>
        <Button className="gap-1.5" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> New coupon
        </Button>
      </div>

      <Card className="p-4 shadow-soft">
        <div className="relative mb-4 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search code or description…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {isLoading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
            <Ticket className="h-8 w-8" />
            No coupons yet. Create one to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Valid</TableHead>
                  <TableHead>Used</TableHead>
                  <TableHead>Plans</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((c) => {
                  const st = couponStatus(c);
                  return (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="font-mono text-sm font-semibold">{c.code}</div>
                        {c.description && <div className="max-w-[220px] truncate text-xs text-muted-foreground">{c.description}</div>}
                      </TableCell>
                      <TableCell className="text-sm">
                        {c.discount_type === "percent" ? `${c.value}%` : formatMoney(c.value)}
                        {c.discount_type === "percent" && c.max_discount !== null && (
                          <div className="text-xs text-muted-foreground">max {formatMoney(c.max_discount)}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {c.valid_from ? formatDate(`${c.valid_from}Z`) : "Any time"} → {c.valid_to ? formatDate(`${c.valid_to}Z`) : "No end"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {c.times_used}
                        {c.total_limit !== null ? ` / ${c.total_limit}` : ""}
                        {c.per_user_limit !== null && <div className="text-xs text-muted-foreground">{c.per_user_limit} per user</div>}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{c.plan_ids?.length ? c.plan_ids.join(", ") : "All plans"}</TableCell>
                      <TableCell>
                        <Badge className={st.className} variant="secondary">
                          {st.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Switch checked={c.is_active} onCheckedChange={() => toggle(c)} disabled={update.isPending} aria-label="Enabled" />
                          <Button variant="ghost" size="icon" onClick={() => setEditing(c)} aria-label="Edit">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Page {page} of {totalPages} · {total} coupons
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      </Card>

      <CouponDialog open={creating} onOpenChange={setCreating} coupon={null} />
      {editing && <CouponDialog open onOpenChange={(v) => !v && setEditing(null)} coupon={editing} />}
    </>
  );
}

function CouponDialog({
  open,
  onOpenChange,
  coupon,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coupon: Coupon | null;
}) {
  const isEdit = Boolean(coupon);
  const create = useCreateCoupon();
  const update = useUpdateCoupon();
  const { data: pricing } = usePricing();
  const plans = (pricing?.plans ?? []) as PricingPlan[];

  const [code, setCode] = useState(coupon?.code ?? "");
  const [description, setDescription] = useState(coupon?.description ?? "");
  const [type, setType] = useState<"percent" | "flat">(coupon?.discount_type ?? "percent");
  const [value, setValue] = useState(coupon ? String(coupon.value) : "");
  const [maxDiscount, setMaxDiscount] = useState(coupon?.max_discount != null ? String(coupon.max_discount) : "");
  const [validFrom, setValidFrom] = useState(utcToIstDate(coupon?.valid_from));
  const [validTo, setValidTo] = useState(utcToIstDate(coupon?.valid_to));
  const [totalLimit, setTotalLimit] = useState(coupon?.total_limit != null ? String(coupon.total_limit) : "");
  const [perUser, setPerUser] = useState(coupon?.per_user_limit != null ? String(coupon.per_user_limit) : "");
  const [planIds, setPlanIds] = useState<string[]>(coupon?.plan_ids ?? []);
  const [active, setActive] = useState(coupon?.is_active ?? true);

  const pending = create.isPending || update.isPending;
  const num = (v: string) => (v.trim() === "" ? null : Number(v));

  const togglePlan = (id: string) => setPlanIds((cur) => (cur.includes(id) ? cur.filter((p) => p !== id) : [...cur, id]));

  const submit = () => {
    const val = Number(value);
    if (!isEdit && !/^[A-Za-z0-9_-]{3,40}$/.test(code.trim())) {
      toast.error("Code must be 3–40 characters: letters, digits, '-' or '_'.");
      return;
    }
    if (!Number.isFinite(val) || val <= 0) {
      toast.error("Enter a discount value greater than zero.");
      return;
    }
    if (type === "percent" && val > 100) {
      toast.error("A percentage can't exceed 100.");
      return;
    }
    const common = {
      description: description.trim() || null,
      value: val,
      max_discount: type === "percent" ? num(maxDiscount) : null,
      valid_from: validFrom ? dayStartUtc(validFrom) : null,
      valid_to: validTo ? dayEndUtc(validTo) : null,
      total_limit: num(totalLimit),
      per_user_limit: num(perUser),
      plan_ids: planIds.length ? planIds : null,
      is_active: active,
    };
    const done = {
      onSuccess: () => {
        toast.success(isEdit ? "Coupon updated" : "Coupon created");
        onOpenChange(false);
      },
      onError: (e: unknown) => toast.error(apiErrorMessage(e, "Couldn't save the coupon.")),
    };
    if (coupon) update.mutate({ id: coupon.id, patch: common }, done);
    else create.mutate({ code: code.trim().toUpperCase(), discount_type: type, ...common }, done);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit ${coupon!.code}` : "New coupon"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "The code and discount type can't be changed once created." : "Customers enter this code at checkout."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1.5">
            <Label>Code</Label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              disabled={isEdit}
              placeholder="e.g. WELCOME10"
              className="font-mono"
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Description (internal)</Label>
            <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Discount type</Label>
            <Select value={type} onValueChange={(v) => setType(v as "percent" | "flat")} disabled={isEdit}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percent">Percentage (%)</SelectItem>
                <SelectItem value="flat">Flat amount (₹)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{type === "percent" ? "Percent off" : "Amount off (₹)"}</Label>
            <Input type="number" min={0} value={value} onChange={(e) => setValue(e.target.value)} />
          </div>
          {type === "percent" && (
            <div className="col-span-2 space-y-1.5">
              <Label>Maximum discount (₹, optional)</Label>
              <Input type="number" min={0} value={maxDiscount} onChange={(e) => setMaxDiscount(e.target.value)} placeholder="No cap" />
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Valid from (optional)</Label>
            <Input type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Valid until (optional)</Label>
            <Input type="date" value={validTo} onChange={(e) => setValidTo(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Total uses (optional)</Label>
            <Input type="number" min={1} value={totalLimit} onChange={(e) => setTotalLimit(e.target.value)} placeholder="Unlimited" />
          </div>
          <div className="space-y-1.5">
            <Label>Uses per customer (optional)</Label>
            <Input type="number" min={1} value={perUser} onChange={(e) => setPerUser(e.target.value)} placeholder="Unlimited" />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Applies to (leave all unchecked for every plan)</Label>
            <div className="space-y-1.5 rounded-lg border border-border/60 p-3">
              {plans.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={planIds.includes(p.id)} onCheckedChange={() => togglePlan(p.id)} />
                  {planOptionLabel(p)}
                </label>
              ))}
            </div>
          </div>
          <div className="col-span-2 flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
            <Label className="text-sm font-normal">Enabled</Label>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending} className="gap-1.5">
            {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isEdit ? "Save changes" : "Create coupon"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
