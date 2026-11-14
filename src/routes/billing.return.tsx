/* eslint-disable prettier/prettier */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Download, Loader2, RefreshCcw, XCircle } from "lucide-react";
import { toast } from "sonner";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { checkoutService } from "@/services/checkout.service";
import {
  checkoutPublicService as publicCheckout,
  checkoutToken,
  downloadBlob,
} from "@/services/checkout-public.service";
import { useAuthStore } from "@/store/authStore";

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

  // Customers who paid from the pricing dialog may not be able to log in yet (their account
  // awaits approval), so they carry a checkout token. Logged-in customers use their session.
  const hasCheckoutToken = Boolean(checkoutToken.get());
  const loggedIn = Boolean(useAuthStore((s) => s.token));
  const canCheck = hasCheckoutToken || loggedIn;

  const fetchStatus = (id: string) => (hasCheckoutToken ? publicCheckout.status(id) : checkoutService.status(id));
  const doRecheck = (id: string) => (hasCheckoutToken ? publicCheckout.recheck(id) : checkoutService.recheck(id));

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["payments", "status", orderId, hasCheckoutToken],
    queryFn: () => fetchStatus(orderId!),
    enabled: Boolean(orderId) && canCheck,
    retry: false,
  });
  const recheck = useMutation({ mutationFn: (id: string) => doRecheck(id) });
  const [recheckedOnce, setRecheckedOnce] = useState(false);
  const [downloading, setDownloading] = useState<"bill" | "receipt" | null>(null);

  const status = data?.status ?? redirectStatus;

  // If we land here still "pending" (Paytm's async callback can lag behind
  // the browser redirect), force one fresh status pull.
  useEffect(() => {
    if (!orderId || !canCheck || recheckedOnce) return;
    if (status === "pending" || status === "error") {
      setRecheckedOnce(true);
      recheck.mutate(orderId, { onSettled: () => refetch() });
    }
  }, [orderId, canCheck, status, recheckedOnce, recheck, refetch]);

  const download = async (kind: "bill" | "receipt") => {
    if (!orderId) return;
    setDownloading(kind);
    try {
      const blob = kind === "bill" ? await publicCheckout.bill(orderId) : await publicCheckout.receipt(orderId);
      downloadBlob(blob, kind === "bill" ? "GST-Bill.pdf" : "Receipt.pdf");
    } catch {
      toast.error("Couldn't download it right now — a copy has also been emailed to you.");
    } finally {
      setDownloading(null);
    }
  };

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
                {data?.plan_name ? `Thank you — we've received your payment for ${data.plan_name}.` : "Thank you — we've received your payment."}{" "}
                Our team will verify your account and activate your login shortly. Your GST bill and receipt have
                been emailed to you.
              </p>
              {hasCheckoutToken && (
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <Button variant="outline" className="gap-1.5" disabled={downloading !== null} onClick={() => download("bill")}>
                    {downloading === "bill" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} GST bill
                  </Button>
                  <Button variant="outline" className="gap-1.5" disabled={downloading !== null} onClick={() => download("receipt")}>
                    {downloading === "receipt" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Receipt
                  </Button>
                </div>
              )}
              <Button asChild className="mt-4 h-11 w-full rounded-xl gradient-primary text-primary-foreground">
                <Link to={loggedIn ? "/workspace" : "/login"}>{loggedIn ? "Go to workspace" : "Go to login"}</Link>
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
                <Link to="/pricing">Try again</Link>
              </Button>
            </>
          ) : (
            <>
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-muted-foreground" />
              <h1 className="mt-4 font-display text-xl font-bold">Still processing</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {canCheck
                  ? "Paytm hasn't confirmed this one yet. It'll usually resolve within a minute."
                  : "Paytm hasn't confirmed this one yet. We'll email you as soon as it does."}
              </p>
              {canCheck && (
                <Button
                  variant="outline"
                  className="mt-6 h-11 w-full rounded-xl gap-1.5"
                  disabled={recheck.isPending}
                  onClick={() => orderId && recheck.mutate(orderId, { onSettled: () => refetch() })}
                >
                  <RefreshCcw className="h-4 w-4" /> Check again
                </Button>
              )}
            </>
          )}
        </Card>
      </section>
    </PublicLayout>
  );
}
