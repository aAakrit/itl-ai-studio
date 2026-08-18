/* eslint-disable prettier/prettier */
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PaymentSummary } from "@/types/admin";
import {
  EMPTY,
  formatDateTime,
  formatMoney,
  paymentStatusClass,
  paymentStatusLabel,
  paymentTypeLabel,
  titleCase,
} from "./admin-user-utils";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm">{value}</p>
    </div>
  );
}

/**
 * Latest-payment summary. The backend exposes only the most recent payment on
 * the user detail response — there is no payment-history endpoint yet, so the
 * history area shows an honest empty state and invoice/receipt actions stay
 * disabled until real numbers exist.
 */
export function PaymentSection({ payment }: { payment?: PaymentSummary | null }) {
  const hasPayment = Boolean(payment?.id);

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-sm font-semibold">Latest payment</p>
        {!hasPayment || !payment ? (
          <p className="rounded-lg border border-dashed border-border/60 p-4 text-center text-sm text-muted-foreground">
            No payment recorded for this user.
          </p>
        ) : (
          <div className="rounded-lg border border-border/60 p-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge className={paymentStatusClass(payment.status)}>
                {paymentStatusLabel(payment.status)}
              </Badge>
              <Badge variant="outline">{paymentTypeLabel(payment.type)}</Badge>
              <span className="ml-auto text-base font-semibold">
                {formatMoney(payment.amount, payment.currency ?? "INR")}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
              <Field label="Gateway" value={titleCase(payment.gateway)} />
              <Field label="Order ID" value={payment.order_id ?? EMPTY} />
              <Field label="Paid at" value={formatDateTime(payment.paid_at)} />
              <Field label="Invoice number" value={payment.invoice_number ?? "Not available"} />
              <Field label="Receipt number" value={payment.receipt_number ?? "Not available"} />
              <Field label="Currency" value={payment.currency ?? EMPTY} />
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              <Button
                size="sm"
                variant="outline"
                disabled={!payment.invoice_number}
                title={payment.invoice_number ? undefined : "No invoice available yet"}
              >
                View invoice
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={!payment.receipt_number}
                title={payment.receipt_number ? undefined : "No receipt available yet"}
              >
                View receipt
              </Button>
            </div>
          </div>
        )}
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold">Payment history</p>
        <p className="rounded-lg border border-dashed border-border/60 p-4 text-center text-sm text-muted-foreground">
          Full payment history isn't exposed by the backend yet. Only the latest payment is
          available for now.
        </p>
      </div>
    </div>
  );
}
