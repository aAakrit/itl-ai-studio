/* eslint-disable prettier/prettier */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, ChevronRight, Search, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableSkeleton } from "@/features/admin/AdminSkeletons";
import { useAdminAuditActions, useAdminAuditLogs } from "@/hooks";
import type { AdminAuditLogEntry } from "@/types/admin";
import { EMPTY, formatDateTime, titleCase } from "@/features/admin/users/admin-user-utils";

export const Route = createFileRoute("/admin/audit")({
  component: AdminAuditPage,
  head: () => ({ meta: [{ title: "Audit logs — Admin" }] }),
});

function ValueBlock({ label, value }: { label: string; value?: Record<string, unknown> | null }) {
  const entries = value ? Object.entries(value) : [];
  return (
    <div className="rounded-md border border-border/60 p-2.5">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      {entries.length === 0 ? (
        <p className="text-xs text-muted-foreground">No data</p>
      ) : (
        <dl className="space-y-1">
          {entries.map(([k, v]) => (
            <div key={k} className="flex gap-2 text-xs">
              <dt className="min-w-24 text-muted-foreground">{titleCase(k)}</dt>
              <dd className="break-all">{v === null || v === undefined || v === "" ? EMPTY : String(v)}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

function AdminAuditPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("all");
  const [targetType, setTargetType] = useState("all");
  const [expanded, setExpanded] = useState<number | null>(null);

  const { data: actionsData } = useAdminAuditActions();
  const { data, isLoading } = useAdminAuditLogs({
    page,
    limit: 30,
    search: search || undefined,
    action: action === "all" ? undefined : action,
    target_type: targetType === "all" ? undefined : targetType,
  });

  const items = (data?.items ?? []) as AdminAuditLogEntry[];
  const total = data?.total ?? 0;
  const limit = data?.limit ?? 30;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const actions = actionsData?.actions ?? [];
  const targetTypes = Array.from(new Set(items.map((i) => i.target_type))).sort();

  return (
    <>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">Audit logs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Full history of every admin and staff action — user edits, subscription changes, payments, and more.
        </p>
      </div>

      <Card className="p-5 shadow-soft">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by reason..."
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              className="h-10 pl-9"
            />
          </div>
          <Select
            value={action}
            onValueChange={(v) => {
              setPage(1);
              setAction(v);
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              {actions.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={targetType}
            onValueChange={(v) => {
              setPage(1);
              setTargetType(v);
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All targets" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All targets</SelectItem>
              {targetTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {titleCase(t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading && !data ? (
          <TableSkeleton rows={10} cols={5} />
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground">
            <ShieldAlert className="h-6 w-6" />
            No audit events match these filters.
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((event) => {
              const isOpen = expanded === event.id;
              const hasDiff = Boolean(event.previous_value || event.new_value);
              return (
                <li key={event.id} className="rounded-lg border border-border/60 p-3">
                  <div className="flex items-start gap-2">
                    {hasDiff ? (
                      <button
                        className="mt-0.5 text-muted-foreground hover:text-foreground"
                        onClick={() => setExpanded(isOpen ? null : event.id)}
                        aria-label={isOpen ? "Collapse details" : "Expand details"}
                      >
                        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                    ) : (
                      <span className="w-4" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="text-[11px]">{event.action}</Badge>
                        <Badge className="text-[11px]" variant="secondary">
                          {titleCase(event.target_type)} #{event.target_id}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{formatDateTime(event.created_at)}</span>
                        {event.actor_name && (
                          <span className="text-xs text-muted-foreground">
                            by {event.actor_name} ({event.actor_email})
                          </span>
                        )}
                        {!event.actor_id && (
                          <span className="text-xs text-muted-foreground">system</span>
                        )}
                      </div>
                      {event.reason && <p className="mt-1 text-sm">{event.reason}</p>}
                      {isOpen && (
                        <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
                          <ValueBlock label="Previous value" value={event.previous_value} />
                          <ValueBlock label="New value" value={event.new_value} />
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Page {page} of {totalPages} · {total} events
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
      </Card>
    </>
  );
}
