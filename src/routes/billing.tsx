/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Check, Loader2, ShieldCheck } from "lucide-react";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { usePricing, useInitiatePayment } from "@/hooks";
import { useCurrentUser } from "@/hooks/useAuth";

export const Route = createFileRoute("/billing")({
  component: Billing,
  head: () => ({ meta: [{ title: "Billing — ITL AI" }] }),
});

type Cycle = "monthly" | "yearly";

/**
 * Submits a real HTML form POST to Paytm's hosted checkout page — this is
 * the classic redirect flow (mid/orderId/txnToken as form fields), which
 * Paytm then owns until it POSTs back to our callback URL and we redirect
 * to /billing/return.
 */
function redirectToPaytm(checkoutUrl: string, fields: Record<string, string>) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = checkoutUrl;

  Object.entries(fields).forEach(([name, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
}

function Billing() {
  const user = useCurrentUser();
  const { data } = usePricing();
  const [cycle, setCycle] = useState<Cycle>("yearly");
  const [payingPlanId, setPayingPlanId] = useState<string | null>(null);
  const initiate = useInitiatePayment();

  const plans = (data?.plans ?? []) as any[];

  const handleSubscribe = (planId: string) => {
    setPayingPlanId(planId);
    initiate.mutate(
      { plan_id: planId, billing_cycle: cycle },
      {
        onSuccess: (res) => {
          redirectToPaytm(res.paytm_params.checkoutUrl, {
            mid: res.paytm_params.mid ?? "",
            orderId: res.paytm_params.orderId,
            txnToken: res.paytm_params.txnToken,
          });
          // Browser is about to navigate away to Paytm — no further state
          // updates needed here.
        },
        onError: (e: any) => {
          setPayingPlanId(null);
          toast.error(e?.response?.data?.detail ?? "Couldn't start checkout — please try again.");
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
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Redirecting to Paytm…
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
