/* eslint-disable prettier/prettier */
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Ban, Download, FileText, Loader2, Pencil, Plus, Search, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
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
import { UserPicker } from "@/features/admin/Subscription/UserPicker";
import { apiErrorMessage, formatDate, formatMoney } from "@/features/admin/users/admin-user-utils";
import { useAdminBills, useCancelBill, useSalesmen, useSaveBill } from "@/hooks/useAdminBilling";
import { usePricing } from "@/hooks";
import { adminBillingService } from "@/services/admin-billing.service";
import { downloadBlob } from "@/services/checkout-public.service";
import { INDIAN_STATES } from "@/lib/indian-states";
import { planOptionLabel } from "@/lib/plans";
import type { PricingPlan } from "@/types";
import type { AdminUser } from "@/types/admin";
import type { Bill, BillLine, BillWrite } from "@/types/checkout";

export const Route = createFileRoute("/admin/bills")({
  component: AdminBillsPage,
  head: () => ({ meta: [{ title: "Bills — Admin" }] }),
});

const SELLER_STATE = "Rajasthan"; // customers here get CGST + SGST, everyone else IGST (mirrors the server rule)
const HSN_DEFAULT = "998439";

const todayIst = () => new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
const autoRates = (state: string) =>
  state.trim().toLowerCase() === SELLER_STATE.toLowerCase()
    ? { cgst: 9, sgst: 9, igst: 0 }
    : { cgst: 0, sgst: 0, igst: 18 };

function AdminBillsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "cancelled">("all");
  const [editing, setEditing] = useState<Bill | null>(null);
  const [creating, setCreating] = useState(false);
  const [cancelling, setCancelling] = useState<Bill | null>(null);
  const limit = 20;

  const { data, isLoading } = useAdminBills({
    page,
    limit,
    search: search.trim() || undefined,
    status: status === "all" ? undefined : status,
  });
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const download = async (b: Bill) => {
    try {
      downloadBlob(await adminBillingService.billPdf(b.id), `Bill-${b.bill_number.replace(/\//g, "-")}.pdf`);
    } catch (e) {
      toast.error(apiErrorMessage(e, "Couldn't download the bill."));
    }
  };

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Bills</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            GST tax invoices. Online and cash payments create one automatically; create one by hand for a salesman's customer.
          </p>
        </div>
        <Button className="gap-1.5" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> New bill
        </Button>
      </div>

      <Card className="p-4 shadow-soft">
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="relative min-w-[240px] flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search bill no, name, email, mobile, GSTIN…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v as typeof status);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All bills</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
            <FileText className="h-8 w-8" />
            No bills found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bill no.</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[130px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((b) => (
                  <TableRow key={b.id} className={b.status === "cancelled" ? "opacity-60" : ""}>
                    <TableCell className="font-mono text-xs font-semibold">{b.bill_number}</TableCell>
                    <TableCell className="text-sm">{formatDate(b.bill_date)}</TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{b.customer_name}</div>
                      <div className="text-xs text-muted-foreground">{b.customer_email ?? b.customer_mobile ?? ""}</div>
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">{formatMoney(b.total_after_tax)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{b.payment_id ? "Payment" : "Manual"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={b.status === "active" ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive"}>
                        {b.status === "active" ? "Active" : "Cancelled"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => download(b)} aria-label="Download PDF">
                          <Download className="h-4 w-4" />
                        </Button>
                        {b.status === "active" && (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => setEditing(b)} aria-label="Edit">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setCancelling(b)} aria-label="Cancel bill">
                              <Ban className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Page {page} of {totalPages} · {total} bills
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

      {creating && <BillDialog open onOpenChange={(v) => !v && setCreating(false)} bill={null} />}
      {editing && <BillDialog open onOpenChange={(v) => !v && setEditing(null)} bill={editing} />}
      {cancelling && <CancelBillDialog bill={cancelling} onClose={() => setCancelling(null)} />}
    </>
  );
}

/* ------------------------------------------------------------------ */

function CancelBillDialog({ bill, onClose }: { bill: Bill; onClose: () => void }) {
  const cancel = useCancelBill();
  const [reason, setReason] = useState("");
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel {bill.bill_number}?</DialogTitle>
          <DialogDescription>
            The bill stays on record, marked cancelled — its number is never reused, so the series stays unbroken.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label>Reason</Label>
          <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={cancel.isPending}>
            Keep bill
          </Button>
          <Button
            variant="destructive"
            disabled={cancel.isPending}
            onClick={() =>
              cancel.mutate(
                { id: bill.id, reason: reason.trim() || undefined },
                {
                  onSuccess: () => {
                    toast.success("Bill cancelled");
                    onClose();
                  },
                  onError: (e) => toast.error(apiErrorMessage(e, "Couldn't cancel the bill.")),
                },
              )
            }
          >
            {cancel.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            Cancel bill
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */

type LineState = { particulars: string; hsn: string; period: string; amount: string };
const blankLine = (): LineState => ({ particulars: "", hsn: "", period: "", amount: "" });
const toLineState = (l: BillLine): LineState => ({
  particulars: l.particulars ?? "",
  hsn: l.hsn ?? "",
  period: l.period ?? "",
  amount: l.amount === undefined || l.amount === null ? "" : String(l.amount),
});

/** The bill form — laid out like the paper bill. Totals and amount in words are computed by the server on save. */
function BillDialog({
  open,
  onOpenChange,
  bill,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bill: Bill | null;
}) {
  const isEdit = Boolean(bill);
  const save = useSaveBill();
  const { data: pricing } = usePricing();
  const plans = (pricing?.plans ?? []) as PricingPlan[];
  const salesmen = useSalesmen(open);

  const [pickedUser, setPickedUser] = useState<AdminUser | null>(null);
  const [userId, setUserId] = useState<number | null>(bill?.user_id ?? null);
  const [billDate, setBillDate] = useState(bill?.bill_date ?? todayIst());
  const [name, setName] = useState(bill?.customer_name ?? "");
  const [address, setAddress] = useState(bill?.customer_address ?? "");
  const [city, setCity] = useState(bill?.customer_city ?? "");
  const [pin, setPin] = useState(bill?.customer_pin ?? "");
  const [state, setState] = useState(bill?.customer_state ?? "");
  const [tele, setTele] = useState(bill?.customer_tele ?? "");
  const [mobile, setMobile] = useState(bill?.customer_mobile ?? "");
  const [email, setEmail] = useState(bill?.customer_email ?? "");
  const [gstin, setGstin] = useState(bill?.customer_gstin ?? "");
  const [lines, setLines] = useState<LineState[]>(() => {
    const base = (bill?.lines ?? []).map(toLineState);
    while (base.length < 4) base.push(blankLine());
    return base;
  });

  const initialAuto = autoRates(bill?.customer_state ?? "");
  const [manualRates, setManualRates] = useState(
    bill
      ? Number(bill.cgst_rate) !== initialAuto.cgst || Number(bill.sgst_rate) !== initialAuto.sgst || Number(bill.igst_rate) !== initialAuto.igst
      : false,
  );
  const [cgst, setCgst] = useState(String(bill?.cgst_rate ?? 0));
  const [sgst, setSgst] = useState(String(bill?.sgst_rate ?? 0));
  const [igst, setIgst] = useState(String(bill?.igst_rate ?? 18));

  const [payRef, setPayRef] = useState(bill?.payment_ref ?? "");
  const [payDate, setPayDate] = useState(bill?.payment_date ?? "");
  const [payAmount, setPayAmount] = useState(bill?.payment_amount != null ? String(bill.payment_amount) : "");
  const [bank, setBank] = useState(bill?.bank ?? "");
  const [notes, setNotes] = useState(bill?.notes ?? "");
  const [reverse, setReverse] = useState(bill?.reverse_charge ?? "");
  const [salesmanId, setSalesmanId] = useState<string>(bill?.salesman_id ? String(bill.salesman_id) : "none");
  const [prefillPlan, setPrefillPlan] = useState("");
  const [prefilling, setPrefilling] = useState(false);

  const setLine = (i: number, patch: Partial<LineState>) =>
    setLines((cur) => cur.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const rates = manualRates
    ? { cgst: Number(cgst) || 0, sgst: Number(sgst) || 0, igst: Number(igst) || 0 }
    : autoRates(state);

  const before = useMemo(() => lines.reduce((sum, l) => sum + (Number(l.amount) || 0), 0), [lines]);
  const money = (n: number) => Math.round(n * 100) / 100;
  const cgstAmt = money((before * rates.cgst) / 100);
  const sgstAmt = money((before * rates.sgst) / 100);
  const igstAmt = money((before * rates.igst) / 100);
  const after = money(before + cgstAmt + sgstAmt + igstAmt);

  const fillFrom = async () => {
    if (!pickedUser && !prefillPlan) {
      toast.error("Pick a user and/or a plan to fill from.");
      return;
    }
    setPrefilling(true);
    try {
      const d = await adminBillingService.prefillBill({ user_id: pickedUser?.id, plan_id: prefillPlan || undefined });
      if (pickedUser) {
        setUserId(pickedUser.id);
        setName(d.customer_name ?? "");
        setAddress(d.customer_address ?? "");
        setCity(d.customer_city ?? "");
        setPin(d.customer_pin ?? "");
        setState(d.customer_state ?? "");
        setTele(d.customer_tele ?? "");
        setMobile(d.customer_mobile ?? "");
        setEmail(d.customer_email ?? "");
        setGstin(d.customer_gstin ?? "");
      }
      if (prefillPlan && d.lines?.length) {
        const filled = d.lines.map(toLineState);
        while (filled.length < 4) filled.push(blankLine());
        setLines(filled);
      }
    } catch (e) {
      toast.error(apiErrorMessage(e, "Couldn't fill the form."));
    } finally {
      setPrefilling(false);
    }
  };

  const submit = () => {
    if (!name.trim()) {
      toast.error("Customer name is required.");
      return;
    }
    const filled = lines.filter((l) => l.particulars.trim() || Number(l.amount));
    if (filled.length === 0 || before <= 0) {
      toast.error("Add at least one line with an amount.");
      return;
    }
    const payload: BillWrite = {
      user_id: userId,
      salesman_id: salesmanId === "none" ? null : Number(salesmanId),
      bill_date: billDate || null,
      customer_name: name.trim(),
      customer_address: address,
      customer_city: city,
      customer_pin: pin,
      customer_state: state,
      customer_tele: tele,
      customer_mobile: mobile,
      customer_email: email,
      customer_gstin: gstin.trim().toUpperCase(),
      lines: filled.map((l) => ({ particulars: l.particulars.trim(), hsn: l.hsn.trim(), period: l.period.trim(), amount: Number(l.amount) || 0 })),
      payment_ref: payRef,
      payment_date: payDate || null,
      payment_amount: payAmount.trim() === "" ? null : Number(payAmount),
      bank,
      notes,
      reverse_charge: reverse,
      // Left out (server derives CGST+SGST / IGST from the state) unless typed in by hand.
      ...(manualRates ? { cgst_rate: rates.cgst, sgst_rate: rates.sgst, igst_rate: rates.igst } : {}),
    };
    save.mutate(
      { id: bill?.id, payload },
      {
        onSuccess: async (saved) => {
          toast.success(isEdit ? `Bill ${saved.bill_number} updated` : `Bill ${saved.bill_number} created`);
          try {
            downloadBlob(await adminBillingService.billPdf(saved.id), `Bill-${saved.bill_number.replace(/\//g, "-")}.pdf`);
          } catch {
            /* the bill is saved either way — it can be downloaded from the list */
          }
          onOpenChange(false);
        },
        onError: (e) => toast.error(apiErrorMessage(e, "Couldn't save the bill.")),
      },
    );
  };

  const f = (label: string, node: React.ReactNode, cls = "") => (
    <div className={cls}>
      <Label className="mb-1 block text-xs text-muted-foreground">{label}</Label>
      {node}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[94vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit bill ${bill!.bill_number}` : "New bill"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "The bill number stays the same. Totals and amount in words are recalculated on save."
              : "A bill number (ITL/<year>/<no.>) is assigned when you save. Totals and amount in words are calculated for you."}
          </DialogDescription>
        </DialogHeader>

        {/* fill from */}
        {!isEdit && (
          <div className="grid gap-3 rounded-lg border border-dashed border-border/70 p-3 sm:grid-cols-[1fr_1fr_auto]">
            <div>
              <Label className="mb-1 block text-xs text-muted-foreground">Fill customer from a user (optional)</Label>
              <UserPicker value={pickedUser} onChange={setPickedUser} />
            </div>
            <div>
              <Label className="mb-1 block text-xs text-muted-foreground">Fill line from a plan (optional)</Label>
              <Select value={prefillPlan || "none"} onValueChange={(v) => setPrefillPlan(v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No plan</SelectItem>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {planOptionLabel(p)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" className="gap-1.5 self-end" onClick={fillFrom} disabled={prefilling}>
              {prefilling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Fill
            </Button>
          </div>
        )}

        {/* header */}
        <div className="grid gap-3 sm:grid-cols-4">
          {f("Bill no.", <Input value={bill?.bill_number ?? "Assigned on save"} disabled className="font-mono" />)}
          {f("Date", <Input type="date" value={billDate} onChange={(e) => setBillDate(e.target.value)} />)}
          {f(
            "Salesman",
            <Select value={salesmanId} onValueChange={setSalesmanId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {(salesmen.data ?? []).map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>,
            "sm:col-span-2",
          )}
        </div>

        {/* customer */}
        <div className="grid gap-3 sm:grid-cols-4">
          {f("Name *", <Input value={name} onChange={(e) => setName(e.target.value)} />, "sm:col-span-4")}
          {f("Address", <Textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)} />, "sm:col-span-4")}
          {f("Dist", <Input value={city} onChange={(e) => setCity(e.target.value)} />, "sm:col-span-2")}
          {f("PIN", <Input value={pin} onChange={(e) => setPin(e.target.value)} />)}
          {f(
            "State",
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Select state</option>
              {INDIAN_STATES.map((s: string) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
              {state && !INDIAN_STATES.includes(state) && <option value={state}>{state}</option>}
            </select>,
          )}
          {f("Tele", <Input value={tele} onChange={(e) => setTele(e.target.value)} />, "sm:col-span-2")}
          {f("Mob", <Input value={mobile} onChange={(e) => setMobile(e.target.value)} />, "sm:col-span-2")}
          {f("E-mail", <Input value={email} onChange={(e) => setEmail(e.target.value)} />, "sm:col-span-4")}
          {f("GSTIN", <Input value={gstin} onChange={(e) => setGstin(e.target.value.toUpperCase())} maxLength={15} />, "sm:col-span-4")}
        </div>

        <Separator />

        {/* lines */}
        <div className="space-y-2">
          <div className="hidden grid-cols-[2rem_1fr_7rem_9rem_8rem] gap-2 text-xs font-medium text-muted-foreground sm:grid">
            <span>#</span>
            <span>Particulars</span>
            <span>HSN</span>
            <span>Subscription</span>
            <span className="text-right">Amount (₹)</span>
          </div>
          {lines.map((l, i) => (
            <div key={i} className="grid grid-cols-2 items-center gap-2 sm:grid-cols-[2rem_1fr_7rem_9rem_8rem]">
              <span className="hidden text-xs text-muted-foreground sm:block">{i + 1}</span>
              <Input className="col-span-2 sm:col-span-1" placeholder="Particulars" value={l.particulars} onChange={(e) => setLine(i, { particulars: e.target.value })} />
              <Input placeholder={i === 0 ? HSN_DEFAULT : "HSN"} value={l.hsn} onChange={(e) => setLine(i, { hsn: e.target.value })} />
              <Input placeholder="e.g. 2026-27" value={l.period} onChange={(e) => setLine(i, { period: e.target.value })} />
              <Input className="text-right" type="number" min={0} placeholder="0.00" value={l.amount} onChange={(e) => setLine(i, { amount: e.target.value })} />
            </div>
          ))}
          {lines.length < 10 && (
            <Button variant="ghost" size="sm" className="gap-1" onClick={() => setLines((c) => [...c, blankLine()])}>
              <Plus className="h-3.5 w-3.5" /> Add line
            </Button>
          )}
        </div>

        {/* totals */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-3">
            {f("Notes", <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />)}
            <div className="grid grid-cols-2 gap-3">
              {f("Cheque no. / payment ref", <Input value={payRef} onChange={(e) => setPayRef(e.target.value)} />, "col-span-2")}
              {f("Payment date", <Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />)}
              {f("Rs", <Input type="number" min={0} value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />)}
              {f("Bank", <Input value={bank} onChange={(e) => setBank(e.target.value)} />, "col-span-2")}
            </div>
          </div>

          <div className="space-y-2 rounded-xl border border-border/60 bg-secondary/30 p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total amount (before tax)</span>
              <span>{formatMoney(before)}</span>
            </div>
            {(["cgst", "sgst", "igst"] as const).map((k) => {
              const amt = { cgst: cgstAmt, sgst: sgstAmt, igst: igstAmt }[k];
              const val = { cgst, sgst, igst }[k];
              const set = { cgst: setCgst, sgst: setSgst, igst: setIgst }[k];
              return (
                <div key={k} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    Add {k.toUpperCase()} @
                    {manualRates ? (
                      <Input className="h-7 w-16 px-2 text-right" type="number" min={0} value={val} onChange={(e) => set(e.target.value)} />
                    ) : (
                      <span>{rates[k]}</span>
                    )}
                    %
                  </span>
                  <span>{formatMoney(amt)}</span>
                </div>
              );
            })}
            <label className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
              <Checkbox
                checked={manualRates}
                onCheckedChange={(v) => {
                  const on = v === true;
                  if (on) {
                    setCgst(String(rates.cgst));
                    setSgst(String(rates.sgst));
                    setIgst(String(rates.igst));
                  }
                  setManualRates(on);
                }}
              />
              Set tax rates by hand (otherwise from the customer's state)
            </label>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total amount after tax</span>
              <span>{formatMoney(after)}</span>
            </div>
            {f("GST on reverse charge", <Input value={reverse} onChange={(e) => setReverse(e.target.value)} />)}
            <p className="text-[11px] text-muted-foreground">Preview — the saved bill uses server-calculated amounts and shows the total in words.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={save.isPending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={save.isPending} className="gap-1.5">
            {save.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save and print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
