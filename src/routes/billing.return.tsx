/* eslint-disable prettier/prettier */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, XCircle, RefreshCcw } from "lucide-react";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePaymentStatus, useRecheckPayment } from "@/hooks";

export const Route = createFileRoute("/billing/return")({
  component: BillingReturn,
  head: () => ({ meta: [{ title: "Payment status — ITL AI" }] }),
});

function useQueryParams() {
  return useMemo(() => {
    if (typeof window === "undefined") return new URLSearchParams();
    return new URLSearchParams(window.location.search);
  }, []);
}

function BillingReturn() {
  const params = useQueryParams();
  const orderId = params.get("order_id");
  const redirectStatus = params.get("status"); // status the callback redirect already knows

  const { data, isLoading, refetch } = usePaymentStatus(orderId);
  const recheck = useRecheckPayment();
  const [recheckedOnce, setRecheckedOnce] = useState(false);

  const status = data?.status ?? redirectStatus;

  // If we land here still "pending" (Paytm's async callback can lag behind
  // the browser redirect), force one fresh status pull.
  useEffect(() => {
    if (!orderId || recheckedOnce) return;
    if (status === "pending" || status === "error") {
      setRecheckedOnce(true);
      recheck.mutate(orderId, { onSettled: () => refetch() });
    }
  }, [orderId, status, recheckedOnce, recheck, refetch]);

  return (
    <PublicLayout>
      <section className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 py-16 text-center">
        <Card className="w-full p-8 shadow-soft">
          {!orderId ? (
            <>
              <XCircle className="mx-auto h-12 w-12 text-destructive" />
              <h1 className="mt-4 font-display text-xl font-bold">Missing order reference</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                We couldn't tell which payment this was for. If money was deducted, it'll still show up on your
                account shortly — otherwise please try again.
              </p>
            </>
          ) : isLoading || recheck.isPending ? (
            <>
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
              <h1 className="mt-4 font-display text-xl font-bold">Confirming your payment…</h1>
              <p className="mt-1 text-sm text-muted-foreground">This usually takes a few seconds.</p>
            </>
          ) : status === "success" ? (
            <>
              <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
              <h1 className="mt-4 font-display text-xl font-bold">Payment successful</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {data?.plan_name ? `You're now on ${data.plan_name}.` : "Your subscription is now active."}
              </p>
              <Button asChild className="mt-6 h-11 w-full rounded-xl gradient-primary text-primary-foreground">
                <Link to="/workspace">Go to workspace</Link>
              </Button>
            </>
          ) : status === "failed" ? (
            <>
              <XCircle className="mx-auto h-12 w-12 text-destructive" />
              <h1 className="mt-4 font-display text-xl font-bold">Payment failed</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Paytm didn't complete this transaction. No subscription was activated — you haven't been charged.
              </p>
              <Button asChild className="mt-6 h-11 w-full rounded-xl">
                <Link to="/billing">Try again</Link>
              </Button>
            </>
          ) : (
            <>
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-muted-foreground" />
              <h1 className="mt-4 font-display text-xl font-bold">Still processing</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Paytm hasn't confirmed this one yet. It'll usually resolve within a minute.
              </p>
              <Button
                variant="outline"
                className="mt-6 h-11 w-full rounded-xl gap-1.5"
                disabled={recheck.isPending}
                onClick={() => orderId && recheck.mutate(orderId, { onSettled: () => refetch() })}
              >
                <RefreshCcw className="h-4 w-4" /> Check again
              </Button>
            </>
          )}
        </Card>
      </section>
    </PublicLayout>
  );
}
