/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Download, Loader2, Mail, ShieldCheck, Tag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PricingPlan } from "@/types";
import type { CheckoutDetails, CheckoutProfile, Quote } from "@/types/checkout";
import { INDIAN_STATES } from "@/lib/indian-states";
import { planBasePrice, planTermYears, productsLabel, termLabel } from "@/lib/plans";
import { formatDate, formatMoney } from "@/features/admin/users/admin-user-utils";
import {
  checkoutAuthExpired,
  checkoutErrorMessage,
  checkoutPublicService as svc,
  checkoutToken,
  downloadBlob,
} from "@/services/checkout-public.service";
import { launchPaytmCheckout } from "./paytm";

type Step = "email" | "code" | "form";

const EMPTY_DETAILS: CheckoutDetails = {
  name: "",
  firm: "",
  mobile: "",
  telephone: "",
  gstin: "",
  address: "",
  city: "",
  state: "",
  pin_code: "",
};

const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const MAX_SALESMAN_DISCOUNT_NOTE = "A salesman can discount up to 50%. For more, please contact us.";

function useDebounced<T>(value: T, ms = 450): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-xs">{label}</Label>
      {children}
    </div>
  );
}

function Row({ label, value, strong, muted }: { label: string; value: string; strong?: boolean; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={muted ? "text-muted-foreground" : strong ? "font-semibold" : ""}>{label}</span>
      <span className={strong ? "font-semibold" : ""}>{value}</span>
    </div>
  );
}

export function CheckoutDialog({
  open,
  onOpenChange,
  plan,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: PricingPlan | null;
}) {
  const listPrice = planBasePrice(plan);

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [profile, setProfile] = useState<CheckoutProfile | null>(null);
  const [details, setDetails] = useState<CheckoutDetails>(EMPTY_DETAILS);
  const [password, setPassword] = useState("");
  const [updateProfile, setUpdateProfile] = useState(false);

  const [salesmanId, setSalesmanId] = useState<string>("none");
  const [overridePrice, setOverridePrice] = useState("");
  const [reason, setReason] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  const setField = (k: keyof CheckoutDetails) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setDetails((d: any) => ({ ...d, [k]: e.target.value }));

  /* --- start fresh when a different plan is chosen -------------------- */
  useEffect(() => {
    setSalesmanId("none");
    setOverridePrice("");
    setReason("");
    setCouponInput("");
    setAppliedCoupon(null);
  }, [plan?.id]);

  /* --- resume if the visitor already verified their email in this tab -- */
  const loadProfile = async () => {
    const p = await svc.profile();
    setProfile(p);
    setEmail(p.email);
    setDetails(p.user ? { ...EMPTY_DETAILS, ...p.user, firm: p.user.firm ?? "", telephone: p.user.telephone ?? "", gstin: p.user.gstin ?? "" } : EMPTY_DETAILS);
    setUpdateProfile(!p.exists);
    setStep("form");
  };

  useEffect(() => {
    if (!open || step !== "email" || profile || !checkoutToken.get()) return;
    setBusy(true);
    loadProfile()
      .catch(() => checkoutToken.clear())
      .finally(() => setBusy(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const expireSession = () => {
    checkoutToken.clear();
    setProfile(null);
    setOtp("");
    setStep("email");
    toast.error("Your verification expired — please verify your email again.");
  };

  /* --- step 1: email -> code ------------------------------------------- */
  const sendCode = async () => {
    const value = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(value)) {
      toast.error("Enter a valid email address.");
      return;
    }
    setBusy(true);
    try {
      await svc.requestOtp(value);
      setStep("code");
      toast.success("We've emailed you a 6-digit code.");
    } catch (e) {
      toast.error(checkoutErrorMessage(e, "Couldn't send the code — please try again."));
    } finally {
      setBusy(false);
    }
  };

  /* --- step 2: code -> token + profile ---------------------------------- */
  const verifyCode = async () => {
    if (otp.trim().length < 4) {
      toast.error("Enter the code from your email.");
      return;
    }
    setBusy(true);
    try {
      await svc.verifyOtp(email.trim(), otp.trim());
      await loadProfile();
    } catch (e) {
      toast.error(checkoutErrorMessage(e, "That code didn't work — please try again."));
    } finally {
      setBusy(false);
    }
  };

  /* --- salesmen --------------------------------------------------------- */
  const salesmen = useQuery({
    queryKey: ["checkout", "salesmen"],
    queryFn: () => svc.salesmen(),
    enabled: open && step === "form",
    staleTime: 5 * 60 * 1000,
  });

  const hasSalesman = salesmanId !== "none";
  const overrideNum = overridePrice.trim() === "" ? null : Number(overridePrice);
  const priceEdited = hasSalesman && overrideNum !== null && Number.isFinite(overrideNum) && listPrice !== null && overrideNum !== listPrice;
  const debouncedOverride = useDebounced(overridePrice);
  const debouncedReason = useDebounced(reason);

  /* --- live quote (server-computed) --------------------------------------- */
  const quoteKey = [
    "checkout", "quote", plan?.id, details.state, appliedCoupon, salesmanId,
    priceEdited ? debouncedOverride : null, priceEdited ? debouncedReason : null,
  ];
  const quote = useQuery<Quote>({
    queryKey: quoteKey,
    queryFn: () =>
      svc.quote({
        plan_id: plan!.id,
        state: details.state,
        coupon_code: appliedCoupon,
        salesman_id: hasSalesman ? Number(salesmanId) : null,
        override_base_price: priceEdited ? Number(debouncedOverride) : null,
        reason: priceEdited ? debouncedReason.trim() || null : null,
      }),
    enabled: open && step === "form" && Boolean(plan) && Boolean(details.state),
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (quote.error && checkoutAuthExpired(quote.error)) expireSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quote.error]);

  const quoteError = quote.error && !checkoutAuthExpired(quote.error) ? checkoutErrorMessage(quote.error, "Couldn't calculate the price.") : null;
  const q = quote.data;
  const quoteReady = Boolean(q) && !quote.isFetching && !quoteError;

  const applyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    if (priceEdited) {
      toast.error("A coupon can't be combined with a special price.");
      return;
    }
    setAppliedCoupon(code);
  };
  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
  };
  // a coupon the server rejected shouldn't stay "applied"
  useEffect(() => {
    if (appliedCoupon && quoteError) toast.error(quoteError);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteError]);

  const onSalesmanChange = (v: string) => {
    setSalesmanId(v);
    if (v === "none") {
      setOverridePrice("");
      setReason("");
    } else if (overridePrice === "" && listPrice !== null) {
      setOverridePrice(String(listPrice));
    }
  };

  /* --- validation --------------------------------------------------------- */
  const validate = (): string | null => {
    if (details.name.trim().length < 2) return "Enter your name.";
    if (details.mobile.trim().length < 7) return "Enter a valid mobile number.";
    if (details.address.trim().length < 3) return "Enter your address.";
    if (details.city.trim().length < 2) return "Enter your city / district.";
    if (!details.state) return "Select your state.";
    if (!/^[0-9]{6}$/.test(details.pin_code.trim())) return "Enter a valid 6-digit PIN code.";
    if (details.gstin && !GSTIN_RE.test(details.gstin.trim().toUpperCase())) return "Enter a valid 15-character GSTIN, or leave it blank.";
    if (profile && !profile.exists && password.length < 8) return "Choose a password of at least 8 characters.";
    if (priceEdited && reason.trim().length < 3) return "Give a reason for the special price.";
    return null;
  };

  const cleanDetails = (): CheckoutDetails => ({
    ...details,
    name: details.name.trim(),
    firm: details.firm?.trim() || undefined,
    mobile: details.mobile.trim(),
    telephone: details.telephone?.trim() || undefined,
    gstin: details.gstin?.trim().toUpperCase() || undefined,
    address: details.address.trim(),
    city: details.city.trim(),
    pin_code: details.pin_code.trim(),
  });

  const quoteBody = () => ({
    plan_id: plan!.id,
    state: details.state,
    coupon_code: appliedCoupon,
    salesman_id: hasSalesman ? Number(salesmanId) : null,
    override_base_price: priceEdited ? Number(overridePrice) : null,
    reason: priceEdited ? reason.trim() : null,
  });

  /* --- pro-forma bill ---------------------------------------------------- */
  const downloadProforma = async () => {
    const problem = validate();
    if (problem && !problem.startsWith("Choose a password")) {
      toast.error(problem);
      return;
    }
    setBusy(true);
    try {
      const blob = await svc.proforma({ ...quoteBody(), details: cleanDetails() });
      downloadBlob(blob, "Proforma-Invoice.pdf");
    } catch (e) {
      if (checkoutAuthExpired(e)) expireSession();
      else toast.error(await blobAwareMessage(e, "Couldn't generate the proforma."));
    } finally {
      setBusy(false);
    }
  };

  /* --- pay --------------------------------------------------------------- */
  const pay = async () => {
    if (!plan || !profile) return;
    const problem = validate();
    if (problem) {
      toast.error(problem);
      return;
    }
    setBusy(true);
    try {
      if (!profile.exists) {
        const created = await svc.register({ ...cleanDetails(), password });
        setProfile(created);
      }
      const res = await svc.initiate({
        ...quoteBody(),
        details: cleanDetails(),
        update_profile: updateProfile,
      });

      // Paytm draws its own window on the page; a modal dialog would block clicks on it.
      onOpenChange(false);
      await launchPaytmCheckout((orderId) => svc.recheck(orderId), {
        scriptUrl: res.paytm_params.scriptUrl,
        orderId: res.paytm_params.orderId,
        txnToken: res.paytm_params.txnToken,
        amount: String(res.amount),
        useCallback: res.paytm_params.useCallback !== false,
      });
    } catch (e: any) {
      if (checkoutAuthExpired(e)) {
        onOpenChange(true);
        expireSession();
      } else if (e?.message === "Checkout closed.") {
        toast.message("Checkout closed — your details are saved if you want to try again.");
        onOpenChange(true);
      } else {
        onOpenChange(true);
        toast.error(e?.response ? checkoutErrorMessage(e, "Couldn't start checkout — please try again.") : e?.message ?? "Couldn't start checkout — please try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  const existingBanner = useMemo(() => {
    if (!profile?.exists) return null;
    return (
      <div className="space-y-1 rounded-lg border border-border/60 bg-secondary/30 p-3 text-xs">
        <p className="font-semibold text-foreground">Welcome back — we found your account.</p>
        {profile.subscription && (
          <p className="text-muted-foreground">
            Current plan: {profile.subscription.plan_name} ({productsLabel(profile.subscription.products)})
            {profile.subscription.expiry_date ? ` · ${profile.subscription.expired ? "expired" : "valid until"} ${formatDate(profile.subscription.expiry_date)}` : ""}
          </p>
        )}
        {profile.last_payment && (
          <p className="text-muted-foreground">
            Last payment: {formatMoney(profile.last_payment.amount)} for {profile.last_payment.plan_name} ·{" "}
            {profile.last_payment.status}
            {profile.last_payment.date ? ` · ${formatDate(profile.last_payment.date)}` : ""}
          </p>
        )}
        {profile.status === "PENDING" && (
          <p className="text-muted-foreground">
            Your account is awaiting approval. After payment our team will verify and activate your login.
          </p>
        )}
      </div>
    );
  }, [profile]);

  if (!plan) return null;

  const termYears = planTermYears(plan);
  const intraState = q ? q.igst_amount === 0 && q.cgst_amount > 0 : false;

  return (
    <Dialog open={open} onOpenChange={(v) => !busy && onOpenChange(v)}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {plan.name} — {termLabel(termYears)}
          </DialogTitle>
          <DialogDescription>
            {step === "form"
              ? "Check your details, then pay securely with Paytm."
              : "Verify your email to continue. No password needed for this step."}
          </DialogDescription>
        </DialogHeader>

        {/* ---------------- step 1 ---------------- */}
        {step === "email" && (
          <div className="space-y-4">
            <Field label="Email address">
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  autoFocus
                  className="pl-9"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendCode()}
                  disabled={busy}
                />
              </div>
            </Field>
            <p className="text-xs text-muted-foreground">
              We'll email you a one-time code. If you already have an account we'll fill in your details; if not,
              you can create one in the next step.
            </p>
            <DialogFooter>
              <Button onClick={sendCode} disabled={busy} className="gap-1.5">
                {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Send code
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* ---------------- step 2 ---------------- */}
        {step === "code" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter the 6-digit code we sent to <span className="font-medium text-foreground">{email}</span>.
            </p>
            <Input
              inputMode="numeric"
              autoFocus
              maxLength={10}
              className="text-center text-lg tracking-[0.4em]"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && verifyCode()}
              disabled={busy}
            />
            <DialogFooter className="gap-2 sm:justify-between">
              <Button variant="ghost" onClick={() => setStep("email")} disabled={busy}>
                Change email
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={sendCode} disabled={busy}>
                  Resend code
                </Button>
                <Button onClick={verifyCode} disabled={busy} className="gap-1.5">
                  {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Verify
                </Button>
              </div>
            </DialogFooter>
          </div>
        )}

        {/* ---------------- step 3 ---------------- */}
        {step === "form" && profile && (
          <div className="space-y-5">
            {existingBanner}
            {!profile.exists && (
              <div className="flex items-start gap-2 rounded-lg border border-border/60 bg-secondary/30 p-3 text-xs text-muted-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p>
                  <span className="font-medium text-foreground">{profile.email}</span> is verified. Fill in your
                  details to create your account and pay. Your login is activated by our team after payment.
                </p>
              </div>
            )}

            {/* details */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Name *">
                <Input value={details.name} onChange={setField("name")} />
              </Field>
              <Field label="Firm / company">
                <Input value={details.firm ?? ""} onChange={setField("firm")} />
              </Field>
              <Field label="Mobile *">
                <Input inputMode="tel" value={details.mobile} onChange={setField("mobile")} />
              </Field>
              <Field label="Telephone">
                <Input inputMode="tel" value={details.telephone ?? ""} onChange={setField("telephone")} />
              </Field>
              <Field label="GSTIN (for a GST bill)" className="sm:col-span-2">
                <Input
                  value={details.gstin ?? ""}
                  onChange={(e) => setDetails((d: any) => ({ ...d, gstin: e.target.value.toUpperCase() }))}
                  maxLength={15}
                  placeholder="Optional"
                />
              </Field>
              <Field label="Address *" className="sm:col-span-2">
                <Input value={details.address} onChange={setField("address")} />
              </Field>
              <Field label="City / district *">
                <Input value={details.city} onChange={setField("city")} />
              </Field>
              <Field label="PIN code *">
                <Input inputMode="numeric" maxLength={6} value={details.pin_code} onChange={setField("pin_code")} />
              </Field>
              <Field label="State *" className="sm:col-span-2">
                <select
                  value={details.state}
                  onChange={setField("state")}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Select state</option>
                  {INDIAN_STATES.map((s: string) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
              {!profile.exists && (
                <Field label="Choose a password * (min 8 characters)" className="sm:col-span-2">
                  <Input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </Field>
              )}
            </div>
            {profile.exists && (
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <Checkbox checked={updateProfile} onCheckedChange={(v) => setUpdateProfile(v === true)} />
                Also update my saved profile with these details
              </label>
            )}

            <Separator />

            {/* salesman */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Salesman (optional)">
                <Select value={salesmanId} onValueChange={onSalesmanChange} disabled={Boolean(appliedCoupon)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No salesman — standard price</SelectItem>
                    {(salesmen.data ?? []).map((s: { id: Key | null | undefined; name: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; }) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              {hasSalesman && (
                <Field label="Price before GST (₹)">
                  <Input
                    type="number"
                    min={0}
                    value={overridePrice}
                    onChange={(e) => setOverridePrice(e.target.value)}
                  />
                </Field>
              )}
              {hasSalesman && priceEdited && (
                <Field label="Reason for special price *" className="sm:col-span-2">
                  <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Existing client discount" />
                </Field>
              )}
            </div>
            {hasSalesman && q && (
              <p className="-mt-2 text-[11px] text-muted-foreground">
                Lowest allowed price: {formatMoney(q.min_allowed_price)}. {MAX_SALESMAN_DISCOUNT_NOTE}
              </p>
            )}
            {appliedCoupon && <p className="-mt-2 text-[11px] text-muted-foreground">Remove the coupon to choose a salesman price.</p>}

            {/* coupon */}
            <div>
              <Label className="mb-1.5 block text-xs">Coupon code</Label>
              {appliedCoupon && !quoteError ? (
                <div className="flex items-center justify-between rounded-lg border border-success/40 bg-success/10 px-3 py-2 text-sm">
                  <span className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-success" /> {appliedCoupon} applied
                  </span>
                  <Button variant="ghost" size="sm" onClick={removeCoupon}>
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                    placeholder="Have a coupon?"
                    disabled={priceEdited}
                  />
                  <Button variant="outline" onClick={applyCoupon} disabled={!couponInput.trim() || priceEdited}>
                    Apply
                  </Button>
                </div>
              )}
              {appliedCoupon && quoteError && (
                <button type="button" className="mt-1 text-[11px] text-primary underline" onClick={removeCoupon}>
                  Clear coupon
                </button>
              )}
            </div>

            {/* summary */}
            <div className="space-y-2 rounded-xl border border-border/60 bg-secondary/30 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Order summary</p>
              {!details.state ? (
                <p className="text-xs text-muted-foreground">Select your state to see GST and the final amount.</p>
              ) : quoteError ? (
                <div className="flex items-start gap-2 text-xs text-destructive">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{quoteError}</p>
                </div>
              ) : !q ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Calculating…
                </div>
              ) : (
                <>
                  <Row label={`${productsLabel(q.products)} · ${termLabel(q.term_years)}`} value={formatMoney(q.list_price)} />
                  {q.discount_amount > 0 && (
                    <Row
                      label={q.discount_source === "coupon" ? `Coupon ${q.coupon_code}` : "Special price"}
                      value={`− ${formatMoney(q.discount_amount)}`}
                      muted
                    />
                  )}
                  <Row label="Taxable amount" value={formatMoney(q.base_price)} muted />
                  {intraState ? (
                    <>
                      <Row label={`CGST ${q.cgst_rate}%`} value={formatMoney(q.cgst_amount)} muted />
                      <Row label={`SGST ${q.sgst_rate}%`} value={formatMoney(q.sgst_amount)} muted />
                    </>
                  ) : (
                    <Row label={`IGST ${q.igst_rate}%`} value={formatMoney(q.igst_amount)} muted />
                  )}
                  <Separator />
                  <Row label="Total payable" value={formatMoney(q.payable_amount)} strong />
                </>
              )}
            </div>

            <DialogFooter className="gap-2 sm:justify-between">
              <Button variant="outline" onClick={downloadProforma} disabled={busy || !details.state} className="gap-1.5">
                <Download className="h-4 w-4" /> GST proforma (PDF)
              </Button>
              <Button onClick={pay} disabled={busy || !quoteReady} className="gap-1.5 gradient-primary text-primary-foreground">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                {q ? `Pay ${formatMoney(q.payable_amount)} with Paytm` : "Pay with Paytm"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** A failed blob request carries its JSON error as a Blob — read it back into text. */
async function blobAwareMessage(e: any, fallback: string): Promise<string> {
  const data = e?.response?.data;
  if (data instanceof Blob) {
    try {
      const parsed = JSON.parse(await data.text());
      if (typeof parsed?.detail === "string") return parsed.detail;
    } catch {
      /* fall through */
    }
    return fallback;
  }
  return checkoutErrorMessage(e, fallback);
}
