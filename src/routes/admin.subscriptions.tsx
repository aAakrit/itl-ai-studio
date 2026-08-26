/* eslint-disable prettier/prettier */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Ban,
  CalendarPlus,
  CircleSlash,
  MoreHorizontal,
  Pencil,
  PlayCircle,
  Plus,
  Search,
  Wallet,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableSkeleton } from "@/features/admin/AdminSkeletons";
import { useAdminPayments, useAdminSubscriptions } from "@/hooks";
import type { AdminPayment, SubscriptionSummary } from "@/types/admin";
import {
  EditSubscriptionDialog,
  ExtendSubscriptionDialog,
  SubscriptionActionDialog,
  type SubscriptionAction,
} from "@/features/admin/users/SubscriptionDialogs";

import {
  EMPTY,
  formatDate,
  formatDateTime,
  formatMoney,
  paymentStatusClass,
  paymentStatusLabel,
  paymentTypeLabel,
  subscriptionStatusClass,
  subscriptionStatusLabel,
  titleCase,
} from "@/features/admin/users/admin-user-utils";
import { NewSubscriptionDialog } from "@/features/admin/Subscription/NewSubscriptionDialog";
import { RecordCashPaymentDialog } from "@/features/admin/Subscription/RecordCashPaymentDialog";

export const Route = createFileRoute("/admin/subscriptions")({
  component: AdminSubscriptionsPage,
  head: () => ({ meta: [{ title: "Subscriptions — Admin" }] }),
});

function AdminSubscriptionsPage() {
  return (
    <>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">Subscriptions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage plan entitlements and record payments across every user.
        </p>
      </div>

      <Tabs defaultValue="subscriptions">
        <TabsList className="mb-4">
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>
        <TabsContent value="subscriptions" className="m-0">
          <SubscriptionsTab />
        </TabsContent>
        <TabsContent value="payments" className="m-0">
          <PaymentsTab />
        </TabsContent>
      </Tabs>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Subscriptions tab                                                  */
/* ------------------------------------------------------------------ */

const SUBSCRIPTION_STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "cancelled", label: "Cancelled" },
  { value: "expired", label: "Expired" },
];

function SubscriptionsTab() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const { data, isLoading } = useAdminSubscriptions({
    page,
    limit: 20,
    search: search || undefined,
    status: status === "all" ? undefined : status,
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<SubscriptionSummary | null>(null);
  const [extending, setExtending] = useState<SubscriptionSummary | null>(null);
  const [actioning, setActioning] = useState<{ sub: SubscriptionSummary; action: SubscriptionAction } | null>(
    null,
  );

  const items = (data?.items ?? []) as SubscriptionSummary[];
  const total = data?.total ?? 0;
  const limit = data?.limit ?? 20;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <Card className="p-5 shadow-soft">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by user name or email..."
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            className="h-10 pl-9"
          />
        </div>
        <Select
          value={status}
          onValueChange={(v) => {
            setPage(1);
            setStatus(v);
          }}
        >
          <SelectTrigger className="w-[170px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SUBSCRIPTION_STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          className="ml-auto gap-1.5 gradient-primary text-primary-foreground shadow-soft"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="h-4 w-4" /> New subscription
        </Button>
      </div>

      {isLoading && !data ? (
        <TableSkeleton rows={8} cols={6} />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cycle / Source</TableHead>
                <TableHead className="text-right">Payable</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-14 text-center text-sm text-muted-foreground">
                    No subscriptions match these filters.
                  </TableCell>
                </TableRow>
              )}
              {items.map((s) => {
                const st = (s.status ?? "").toLowerCase();
                return (
                  <TableRow key={s.id}>
                    <TableCell>
                      <p className="truncate text-sm font-medium">{s.user_name ?? `User #${s.user_id ?? "—"}`}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{s.user_email ?? EMPTY}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{s.plan_name ?? EMPTY}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={subscriptionStatusClass(s.status)}>
                        {subscriptionStatusLabel(s.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {titleCase(s.billing_cycle)} · {titleCase(s.source)}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {formatMoney(s.payable_amount)}
                    </TableCell>
                    <TableCell>
                      <p className="whitespace-nowrap text-xs font-medium">{formatDate(s.expiry_date)}</p>
                      {s.remaining_days !== null && s.remaining_days !== undefined && (
                        <p className="text-[11px] text-muted-foreground">{s.remaining_days} days left</p>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditing(s)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setExtending(s)}>
                            <CalendarPlus className="mr-2 h-4 w-4" /> Extend
                          </DropdownMenuItem>
                          {st !== "active" && (
                            <DropdownMenuItem onClick={() => setActioning({ sub: s, action: "activate" })}>
                              <PlayCircle className="mr-2 h-4 w-4 text-success" /> Activate
                            </DropdownMenuItem>
                          )}
                          {st === "active" && (
                            <DropdownMenuItem onClick={() => setActioning({ sub: s, action: "suspend" })}>
                              <Ban className="mr-2 h-4 w-4 text-warning" /> Suspend
                            </DropdownMenuItem>
                          )}
                          {st !== "cancelled" && (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setActioning({ sub: s, action: "cancel" })}
                            >
                              <CircleSlash className="mr-2 h-4 w-4" /> Cancel
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
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
          Page {page} of {totalPages} · {total} subscriptions
        </span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      <NewSubscriptionDialog open={createOpen} onOpenChange={setCreateOpen} />
      {editing && (
        <EditSubscriptionDialog
          key={`edit-${editing.id}`}
          open={Boolean(editing)}
          onOpenChange={(open) => !open && setEditing(null)}
          subscription={editing}
        />
      )}
      {extending && (
        <ExtendSubscriptionDialog
          key={`extend-${extending.id}`}
          open={Boolean(extending)}
          onOpenChange={(open) => !open && setExtending(null)}
          subscription={extending}
        />
      )}
      {actioning && (
        <SubscriptionActionDialog
          key={`action-${actioning.action}-${actioning.sub.id}`}
          action={actioning.action}
          onOpenChange={(open) => !open && setActioning(null)}
          subscription={actioning.sub}
        />
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Payments tab                                                       */
/* ------------------------------------------------------------------ */

const PAYMENT_STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "success", label: "Success" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

const PAYMENT_GATEWAY_OPTIONS = [
  { value: "all", label: "All gateways" },
  { value: "paytm", label: "Paytm" },
  { value: "cash", label: "Cash / Manual" },
  { value: "complimentary", label: "Complimentary" },
];

function PaymentsTab() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [gateway, setGateway] = useState("all");
  const [recordOpen, setRecordOpen] = useState(false);

  const { data, isLoading } = useAdminPayments({
    page,
    limit: 20,
    search: search || undefined,
    status: status === "all" ? undefined : status,
    gateway: gateway === "all" ? undefined : gateway,
  });

  const items = (data?.items ?? []) as AdminPayment[];
  const total = data?.total ?? 0;
  const limit = data?.limit ?? 20;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <Card className="p-5 shadow-soft">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, order or invoice..."
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            className="h-10 pl-9"
          />
        </div>
        <Select
          value={status}
          onValueChange={(v) => {
            setPage(1);
            setStatus(v);
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAYMENT_STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={gateway}
          onValueChange={(v) => {
            setPage(1);
            setGateway(v);
          }}
        >
          <SelectTrigger className="w-[170px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAYMENT_GATEWAY_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          className="ml-auto gap-1.5 gradient-primary text-primary-foreground shadow-soft"
          onClick={() => setRecordOpen(true)}
        >
          <Wallet className="h-4 w-4" /> Record cash payment
        </Button>
      </div>

      {isLoading && !data ? (
        <TableSkeleton rows={8} cols={6} />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Gateway</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Paid at</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-14 text-center text-sm text-muted-foreground">
                    No payments match these filters.
                  </TableCell>
                </TableRow>
              )}
              {items.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <p className="truncate text-sm font-medium">{p.customer_name ?? EMPTY}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{p.customer_email ?? EMPTY}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{p.plan_name}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{paymentTypeLabel(p.gateway)}</TableCell>
                  <TableCell>
                    <Badge className={paymentStatusClass(p.status)}>{paymentStatusLabel(p.status)}</Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    {formatMoney(p.payable_amount, p.currency)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {p.invoice_number ?? EMPTY}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatDateTime(p.paid_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Page {page} of {totalPages} · {total} payments
        </span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      <RecordCashPaymentDialog open={recordOpen} onOpenChange={setRecordOpen} />
    </Card>
  );
}
