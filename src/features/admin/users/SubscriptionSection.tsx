/* eslint-disable prettier/prettier */
import { useState } from "react";
import { CalendarPlus, CircleSlash, Pencil, PlayCircle, PauseCircle, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SubscriptionSummary } from "@/types/admin";
import {
  CreateSubscriptionDialog,
  EditSubscriptionDialog,
  ExtendSubscriptionDialog,
  SubscriptionActionDialog,
  type SubscriptionAction,
} from "./SubscriptionDialogs";
import {
  EMPTY,
  formatDate,
  formatMoney,
  formatNumber,
  subscriptionStatusClass,
  subscriptionStatusLabel,
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

export function SubscriptionSection({
  userId,
  userName,
  subscription,
  history,
}: {
  userId: number;
  userName?: string | null;
  subscription?: SubscriptionSummary | null;
  history?: SubscriptionSummary[] | null;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [extendOpen, setExtendOpen] = useState(false);
  const [action, setAction] = useState<SubscriptionAction | null>(null);

  const current = subscription?.id ? subscription : null;
  const rows = history ?? [];
  const status = (current?.status ?? "").toLowerCase();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Current subscription</p>
        <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> New subscription
        </Button>
      </div>

      {!current ? (
        <p className="rounded-lg border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
          No Subscription
        </p>
      ) : (
        <div className="rounded-lg border border-border/60 p-4">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <p className="text-base font-semibold">{current.plan_name ?? EMPTY}</p>
            <Badge className={subscriptionStatusClass(current.status)}>
              {subscriptionStatusLabel(current.status)}
            </Badge>
            <Badge variant="outline">{titleCase(current.billing_cycle)}</Badge>
            <Badge variant="outline">{titleCase(current.source)}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
            <Field label="Plan ID" value={current.plan_id ?? EMPTY} />
            <Field label="Base price" value={formatMoney(current.base_price)} />
            <Field
              label="GST rate"
              value={current.gst_rate === null || current.gst_rate === undefined ? EMPTY : `${current.gst_rate}%`}
            />
            <Field label="GST amount" value={formatMoney(current.gst_amount)} />
            <Field label="Payable amount" value={formatMoney(current.payable_amount)} />
            <Field label="Start date" value={formatDate(current.start_date)} />
            <Field label="Expiry date" value={formatDate(current.expiry_date)} />
            <Field
              label="Remaining days"
              value={
                current.remaining_days === null || current.remaining_days === undefined
                  ? EMPTY
                  : `${formatNumber(current.remaining_days)} days`
              }
            />
            <Field label="Renewal date" value={formatDate(current.renewal_date)} />
            <Field label="Auto renew" value={current.auto_renew ? "Yes" : "No"} />
            <div className="col-span-2 sm:col-span-4">
              <Field label="Notes" value={current.notes || EMPTY} />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5 border-t border-border/60 pt-4">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setEditOpen(true)}>
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => setExtendOpen(true)}
            >
              <CalendarPlus className="h-3.5 w-3.5" /> Extend
            </Button>
            {status !== "active" && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => setAction("activate")}
              >
                <PlayCircle className="h-3.5 w-3.5" /> Activate
              </Button>
            )}
            {status === "active" && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => setAction("suspend")}
              >
                <PauseCircle className="h-3.5 w-3.5" /> Suspend
              </Button>
            )}
            {status !== "cancelled" && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-destructive"
                onClick={() => setAction("cancel")}
              >
                <CircleSlash className="h-3.5 w-3.5" /> Cancel
              </Button>
            )}
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-sm font-semibold">Subscription history</p>
        {rows.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border/60 p-4 text-center text-sm text-muted-foreground">
            No subscription history for this user.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Cycle</TableHead>
                  <TableHead className="text-right">Base</TableHead>
                  <TableHead className="text-right">GST</TableHead>
                  <TableHead className="text-right">Payable</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((s, i) => (
                  <TableRow key={s.id ?? `history-${i}`}>
                    <TableCell className="whitespace-nowrap text-sm font-medium">
                      {s.plan_name ?? EMPTY}
                      {current && s.id === current.id && (
                        <Badge variant="outline" className="ml-2 text-[10px]">
                          Current
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={subscriptionStatusClass(s.status)}>
                        {subscriptionStatusLabel(s.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{titleCase(s.source)}</TableCell>
                    <TableCell className="text-sm">{titleCase(s.billing_cycle)}</TableCell>
                    <TableCell className="text-right text-sm">{formatMoney(s.base_price)}</TableCell>
                    <TableCell className="text-right text-sm">{formatMoney(s.gst_amount)}</TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {formatMoney(s.payable_amount)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatDate(s.start_date)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatDate(s.expiry_date)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatDate(s.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {createOpen && (
        <CreateSubscriptionDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          userId={userId}
          userName={userName}
        />
      )}
      {current && editOpen && (
        <EditSubscriptionDialog
          key={`edit-${current.id}`}
          open={editOpen}
          onOpenChange={setEditOpen}
          subscription={current}
        />
      )}
      {current && extendOpen && (
        <ExtendSubscriptionDialog
          key={`extend-${current.id}`}
          open={extendOpen}
          onOpenChange={setExtendOpen}
          subscription={current}
        />
      )}
      {current && action && (
        <SubscriptionActionDialog
          key={`action-${action}-${current.id}`}
          action={action}
          onOpenChange={(open) => !open && setAction(null)}
          subscription={current}
        />
      )}
    </div>
  );
}
