/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, Loader2, ShieldCheck } from "lucide-react";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { usePricing, useInitiatePayment } from "@/hooks";
import { useCurrentUser } from "@/hooks/useAuth";
import { checkoutService } from "@/services/checkout.service";

export const Route = createFileRoute("/billing")({
  component: Billing,
  head: () => ({ meta: [{ title: "Billing — ITL AI" }] }),
});

type Cycle = "monthly" | "yearly";

/**
 * Paytm JS Checkout — the current recommended integration
 * (paytmpayments.com/docs/jscheckout-invoke-payment). Loads Paytm's SDK
 * script and renders an iframe on this page; NOT a redirect to a
 * Paytm-hosted page. On completion, Paytm's own default behavior (we
 * don't set redirect:false) navigates the browser to our callbackUrl,
 * which the backend then redirects to /billing/return — no extra wiring
 * needed here for that part.
 */
/**
 * In-page mode only: while the checkout window is open, ask our server (which asks
 * Paytm) about the order every few seconds. Paytm's in-page event does not always
 * arrive — e.g. after a UPI QR payment — and without this a paid order would never
 * be noticed. Resolves nothing; calls onPaid once the order is confirmed.
 */
function watchOrder(orderId: string, onPaid: () => void): () => void {
  let stopped = false;
  const startedAt = Date.now();
  let timer = 0;

  const tick = async () => {
    if (stopped || Date.now() - startedAt > 12 * 60 * 1000) return;
    try {
      const payment = await checkoutService.recheck(orderId);
      if (payment.status === "success") {
        stopped = true;
        onPaid();
        return;
      }
    } catch {
      // Paytm's status check can be briefly unavailable — just try again.
    }
    if (!stopped) timer = window.setTimeout(tick, 6000);
  };

  timer = window.setTimeout(tick, 6000);
  return () => {
    stopped = true;
    window.clearTimeout(timer);
  };
}

function loadPaytmCheckoutScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const marker = "data-paytm-checkout";
    const existing = document.querySelector(`script[${marker}]`);
    if (existing?.getAttribute("src") === src && (window as any).Paytm?.CheckoutJS) {
      resolve();
      return;
    }
    existing?.remove();

    const script = document.createElement("script");
    script.type = "application/javascript";
    script.src = src;
    script.crossOrigin = "anonymous";
    script.setAttribute(marker, "true");
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Couldn't load Paytm's checkout script."));
    document.head.appendChild(script);
  });
}

async function launchPaytmCheckout(params: {
  scriptUrl: string;
  orderId: string;
  txnToken: string;
  amount: string;
  /** false = in-page mode (no callbackUrl): Paytm reports the result to the page instead of redirecting. */
  useCallback: boolean;
}): Promise<void> {
  await loadPaytmCheckoutScript(params.scriptUrl);

  const Paytm = (window as any).Paytm;
  if (!Paytm?.CheckoutJS) {
    throw new Error("Paytm checkout didn't load correctly — please try again.");
  }

  const goToReturnPage = (status: string) =>
    window.location.assign(`/billing/return?order_id=${encodeURIComponent(params.orderId)}&status=${status}`);

  return new Promise((resolve, reject) => {
    let stopWatching = () => {};

    Paytm.CheckoutJS.onLoad(() => {
      Paytm.CheckoutJS.init({
        root: "",
        flow: "DEFAULT",
        data: {
          orderId: params.orderId,
          token: params.txnToken,
          tokenType: "TXN_TOKEN",
          amount: params.amount,
        },
        // In-page mode (the way the previous ITL site worked): no browser
        // redirect — Paytm calls transactionStatus below when the payment ends.
        ...(params.useCallback ? {} : { merchant: { redirect: false } }),
        handler: {
          notifyMerchant: (eventName: string) => {
            // With a callbackUrl the browser navigates away on a completed
            // payment — this only fires for in-page events beforehand,
            // most usefully when the person closes the checkout modal.
            if (eventName === "APP_CLOSED") {
              stopWatching();
              if (params.useCallback) {
                reject(new Error("Checkout closed."));
                return;
              }
              // In-page mode: the window may have been closed right AFTER paying.
              // Ask the server (Paytm) once before treating it as cancelled.
              checkoutService
                .recheck(params.orderId)
                .then((payment) => {
                  if (payment.status === "success") goToReturnPage("success");
                  else reject(new Error("Checkout closed."));
                })
                .catch(() => reject(new Error("Checkout closed.")));
            }
          },
          ...(params.useCallback
            ? {}
            : {
                transactionStatus: () => {
                  stopWatching();
                  try {
                    Paytm.CheckoutJS.close();
                  } catch {
                    /* already closed */
                  }
                  // The return page confirms the result with Paytm's Transaction Status
                  // API (server-to-server) — what the page is told here is never trusted.
                  goToReturnPage("pending");
                },
              }),
        },
      })
        .then(() => {
          Paytm.CheckoutJS.invoke();
          if (!params.useCallback) {
            stopWatching = watchOrder(params.orderId, () => {
              try {
                Paytm.CheckoutJS.close();
              } catch {
                /* already closed */
              }
              goToReturnPage("success");
            });
          }
          resolve();
        })
        .catch(reject);
    });
  });
}

function Billing() {
  const user = useCurrentUser();
  const { data } = usePricing();
  const [cycle, setCycle] = useState<Cycle>("yearly");
  const [payingPlanId, setPayingPlanId] = useState<string | null>(null);
  const initiate = useInitiatePayment();

  // Coming back to this page after paying (browser closed, tab lost, no redirect):
  // ask Paytm about this customer's pending payments — a paid one activates the plan.
  useEffect(() => {
    if (!user) return;
    checkoutService
      .recheckPending()
      .then((result) => {
        if (result.confirmed.length > 0) {
          toast.success("Your payment was confirmed — your plan is now active.");
          window.location.assign(`/billing/return?order_id=${encodeURIComponent(result.confirmed[0])}&status=success`);
        }
      })
      .catch(() => {
        /* best effort — the server also checks in the background */
      });
  }, [user?.id]);

  const plans = (data?.plans ?? []) as any[];

  const handleSubscribe = (planId: string) => {
    setPayingPlanId(planId);
    initiate.mutate(
      { plan_id: planId, billing_cycle: cycle },
      {
        onSuccess: (res) => {
          launchPaytmCheckout({
            scriptUrl: res.paytm_params.scriptUrl,
            orderId: res.paytm_params.orderId,
            txnToken: res.paytm_params.txnToken,
            amount: String(res.amount),
            useCallback: res.paytm_params.useCallback !== false,
          }).catch((e: any) => {
            setPayingPlanId(null);
            // A closed/cancelled checkout isn't an error worth alarming over.
            if (e?.message !== "Checkout closed.") {
              toast.error(e?.message ?? "Couldn't open checkout — please try again.");
            }
          });
        },
        onError: (e: any) => {
          setPayingPlanId(null);
          const detail = e?.response?.data?.detail;
          const message = typeof detail === "string" ? detail : detail?.message;
          toast.error(message ?? "Couldn't start checkout — please try again.");
        },
      },
    );
  };

  return (
    <PublicLayout>
      <section className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Billing</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">Subscribe</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {user?.plan ? (
            <>
              You're currently on <span className="font-medium text-foreground">{user.plan}</span>. Pick a plan
              below to switch or renew.
            </>
          ) : (
            "Pick a plan to get started."
          )}
        </p>

        <div className="mt-6 inline-flex items-center gap-1 rounded-full border border-border/60 bg-card p-1 shadow-soft">
          {(["monthly", "yearly"] as Cycle[]).map((c) => (
            <button
              key={c}
              onClick={() => setCycle(c)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors",
                cycle === c ? "gradient-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {plans.map((p) => {
            const price = cycle === "yearly" && p.yearlyPrice != null ? p.yearlyPrice : p.price;
            const isPaying = initiate.isPending && payingPlanId === p.id;
            return (
              <Card
                key={p.id}
                className={cn(
                  "relative p-6 shadow-soft",
                  p.featured && "border-primary/40 ring-1 ring-primary/20",
                )}
              >
                {p.featured && (
                  <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 gradient-primary text-primary-foreground">
                    {p.badge ?? "Most popular"}
                  </Badge>
                )}
                <h3 className="font-display text-lg font-semibold">{p.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-display text-3xl font-bold">
                    {p.currency}
                    {Number(price).toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {price === 0 ? "" : cycle === "yearly" ? "/ year" : "/ month"}
                  </span>
                </div>
                {price > 0 && (
                  <p className="mt-1 text-[11px] text-muted-foreground">+ 18% GST at checkout</p>
                )}
                <ul className="mt-4 space-y-1.5">
                  {(p.features ?? []).slice(0, 4).map((f: string) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={cn("mt-5 h-10 w-full rounded-xl", p.featured && "gradient-primary text-primary-foreground")}
                  variant={p.featured ? "default" : "outline"}
                  disabled={price === 0 || initiate.isPending}
                  onClick={() => handleSubscribe(p.id)}
                >
                  {isPaying ? (
                    <>
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Opening checkout…
                    </>
                  ) : price === 0 ? (
                    "Included free"
                  ) : (
                    "Subscribe with Paytm"
                  )}
                </Button>
              </Card>
            );
          })}
        </div>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" /> Payments are handled by Paytm — card and bank details never touch
          our servers.
        </p>
      </section>
    </PublicLayout>
  );
}
