/* eslint-disable prettier/prettier */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Ban, Loader2, MoreHorizontal, Pencil, PlayCircle, RefreshCw, RotateCcw, Search, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MetricCardsSkeleton, TableSkeleton } from "@/features/admin/AdminSkeletons";
import {
  useAdminBridgeCustomers,
  useAdminBridgePlans,
  useAdminBridgeStats,
  useResyncBridge,
  useSetBridgeCustomerLimits,
} from "@/hooks";
import { EMPTY, apiErrorMessage, formatDate } from "@/features/admin/users/admin-user-utils";
import {
  BridgeCustomerActionDialog,
  EditCustomerLimitsDialog,
  EditPlanLimitsDialog,
  type BridgeCustomerAction,
} from "@/features/admin/bridge/BridgeDialogs";
import { bridgePlanLabel, bridgeStatusClass, bridgeStatusLabel, limitLabel } from "@/features/bridge/bridge-utils";
import { BridgePlanLimits, BridgeCustomer } from "@/types/bridge";


export const Route = createFileRoute("/admin/bridge")({
  component: AdminBridgePage,
  head: () => ({ meta: [{ title: "ITL Bridge AI — Admin" }] }),
});

const STAT_CARDS: { key: string; label: string }[] = [
  { key: "active", label: "Active customers" },
  { key: "expired", label: "Expired" },
  { key: "revoked_or_suspended", label: "Revoked / suspended" },
  { key: "users_today", label: "Users today" },
  { key: "searches_today", label: "Searches today" },
  { key: "documents_today", label: "Documents today" },
];

function AdminBridgePage() {
  const resync = useResyncBridge();

  const runResync = () =>
    resync.mutate(undefined, {
      onSuccess: (r) =>
        toast.success(`Re-sync done — ${r.sent} sent${r.failed ? `, ${r.failed} failed` : ""}${r.skipped ? `, ${r.skipped} not on a Bridge plan` : ""}`),
      onError: (e) => toast.error(apiErrorMessage(e, "Couldn't re-sync subscriptions.")),
    });

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">ITL Bridge AI</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Plan limits, customer limits and today's activity. Every change applies on the customer's next question.
          </p>
        </div>
        <Button variant="outline" className="gap-1.5" onClick={runResync} disabled={resync.isPending}>
          {resync.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Re-sync subscriptions
        </Button>
      </div>

      <StatsRow />
      <PlansCard />
      <CustomersCard />
    </>
  );
}

/* ------------------------------------------------------------------ */

function StatsRow() {
  const { data, isLoading, isError } = useAdminBridgeStats();

  if (isLoading && !data) return <MetricCardsSkeleton count={6} />;
  if (isError || !data) {
    return (
      <Card className="p-5 text-sm text-muted-foreground shadow-soft">
        Couldn't load ITL Bridge AI numbers. Check that the Bridge keys are set on the server.
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
      {STAT_CARDS.map((c, i) => (
        <motion.div key={c.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
          <Card className="p-5 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{c.label}</p>
            <p className="mt-3 font-display text-3xl font-bold tracking-tight">
              {(data[c.key] ?? 0).toLocaleString("en-IN")}
            </p>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function PlansCard() {
  const { data: plans, isLoading } = useAdminBridgePlans();
  const [editing, setEditing] = useState<BridgePlanLimits | null>(null);

  return (
    <Card className="mt-6 p-5 shadow-soft">
      <div className="mb-4">
        <h2 className="font-display text-lg font-semibold">Plan limits</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">Daily limits for everyone on a plan. Reset at midnight IST.</p>
      </div>

      {isLoading && !plans ? (
        <TableSkeleton rows={4} cols={4} />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead className="text-right">Searches / day</TableHead>
                <TableHead className="text-right">Documents / day</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(plans ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    No plans found.
                  </TableCell>
                </TableRow>
              )}
              {(plans ?? []).map((p) => (
                <TableRow key={p.plan}>
                  <TableCell>
                    <p className="text-sm font-medium">{bridgePlanLabel(p.plan)}</p>
                    <p className="text-[11px] text-muted-foreground">{p.plan}</p>
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium">{limitLabel(p.daily_limit)}</TableCell>
                  <TableCell className="text-right text-sm font-medium">{limitLabel(p.daily_doc_limit)}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatDate(p.updated_at)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setEditing(p)}>
                      <Pencil className="h-3.5 w-3.5" /> Edit limits
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {editing && (
        <EditPlanLimitsDialog
          key={`plan-${editing.plan}`}
          plan={editing}
          onOpenChange={(open) => !open && setEditing(null)}
        />
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ */

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "revoked", label: "Revoked" },
  { value: "expired", label: "Expired" },
];

function UsageCell({ used, limit, source }: { used?: number | null; limit?: number | null; source?: "plan" | "user" }) {
  return (
    <div className="flex items-center gap-1.5 whitespace-nowrap">
      <span className="text-sm font-medium">
        {used ?? 0} / {limitLabel(limit)}
      </span>
      {source === "user" && (
        <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
          custom
        </Badge>
      )}
    </div>
  );
}

function CustomersCard() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const { data, isLoading, isError } = useAdminBridgeCustomers({
    page,
    limit: 20,
    q: search || undefined,
    status: status === "all" ? undefined : status,
  });
  const resetLimits = useSetBridgeCustomerLimits();

  const [editing, setEditing] = useState<BridgeCustomer | null>(null);
  const [actioning, setActioning] = useState<{ customer: BridgeCustomer; action: BridgeCustomerAction } | null>(null);

  const items = (data?.items ?? []) as BridgeCustomer[];
  const total = data?.total ?? 0;
  const limit = data?.limit ?? 20;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const resetToPlan = (c: BridgeCustomer) =>
    resetLimits.mutate(
      { userId: c.user_id, limits: { daily_limit: null, daily_doc_limit: null } },
      {
        onSuccess: () => toast.success("Customer is back on plan limits"),
        onError: (e) => toast.error(apiErrorMessage(e, "Couldn't reset the customer's limits.")),
      },
    );

  return (
    <Card className="mt-6 p-5 shadow-soft">
      <div className="mb-4">
        <h2 className="font-display text-lg font-semibold">Customers</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">Today's usage against each customer's limit.</p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email or user ID..."
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
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading && !data ? (
        <TableSkeleton rows={8} cols={6} />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Valid till</TableHead>
                <TableHead>Searches today</TableHead>
                <TableHead>Documents today</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(isError || items.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="py-14 text-center text-sm text-muted-foreground">
                    {isError ? "Couldn't load customers." : "No customers match these filters."}
                  </TableCell>
                </TableRow>
              )}
              {items.map((c) => {
                const st = (c.status ?? "").toLowerCase();
                const custom = c.search_limit_source === "user" || c.document_limit_source === "user";
                return (
                  <TableRow key={c.user_id}>
                    <TableCell>
                      <p className="truncate text-sm font-medium">{c.name || c.user_id}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{c.email ?? EMPTY}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{bridgePlanLabel(c.plan)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={bridgeStatusClass(c.status)}>{bridgeStatusLabel(c.status)}</Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs font-medium">{formatDate(c.expires_at)}</TableCell>
                    <TableCell>
                      <UsageCell used={c.searches_today} limit={c.search_limit} source={c.search_limit_source} />
                    </TableCell>
                    <TableCell>
                      <UsageCell used={c.documents_today} limit={c.document_limit} source={c.document_limit_source} />
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditing(c)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit limits
                          </DropdownMenuItem>
                          {custom && (
                            <DropdownMenuItem onClick={() => resetToPlan(c)}>
                              <RotateCcw className="mr-2 h-4 w-4" /> Reset to plan
                            </DropdownMenuItem>
                          )}
                          {st === "active" ? (
                            <DropdownMenuItem onClick={() => setActioning({ customer: c, action: "suspend" })}>
                              <Ban className="mr-2 h-4 w-4 text-warning" /> Suspend
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => setActioning({ customer: c, action: "activate" })}>
                              <PlayCircle className="mr-2 h-4 w-4 text-success" /> Activate
                            </DropdownMenuItem>
                          )}
                          {st !== "revoked" && (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setActioning({ customer: c, action: "revoke" })}
                            >
                              <ShieldOff className="mr-2 h-4 w-4" /> Revoke
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
          Page {page} of {totalPages} · {total} customers
        </span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      </div>

      {editing && (
        <EditCustomerLimitsDialog
          key={`limits-${editing.user_id}`}
          customer={editing}
          onOpenChange={(open) => !open && setEditing(null)}
        />
      )}
      {actioning && (
        <BridgeCustomerActionDialog
          key={`action-${actioning.action}-${actioning.customer.user_id}`}
          customer={actioning.customer}
          action={actioning.action}
          onOpenChange={(open) => !open && setActioning(null)}
        />
      )}
    </Card>
  );
}
