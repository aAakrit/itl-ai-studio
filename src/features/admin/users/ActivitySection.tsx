/* eslint-disable prettier/prettier */
import { useState } from "react";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdminUserHistory } from "@/hooks";
import type { AdminAuditEvent } from "@/types/admin";
import { EMPTY, formatDateTime, titleCase } from "./admin-user-utils";

function ValueBlock({
  label,
  value,
}: {
  label: string;
  value?: Record<string, unknown> | null;
}) {
  const entries = value ? Object.entries(value) : [];
  return (
    <div className="rounded-md border border-border/60 p-2.5">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {entries.length === 0 ? (
        <p className="text-xs text-muted-foreground">No data</p>
      ) : (
        <dl className="space-y-1">
          {entries.map(([k, v]) => (
            <div key={k} className="flex gap-2 text-xs">
              <dt className="min-w-24 text-muted-foreground">{titleCase(k)}</dt>
              <dd className="break-all">
                {v === null || v === undefined || v === "" ? EMPTY : String(v)}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

/** Audit trail for user-targeted admin actions (GET /admin/users/{id}/history). */
export function ActivitySection({ userId }: { userId: number }) {
  const [page, setPage] = useState(1);
  const limit = 20;
  const { data, isLoading } = useAdminUserHistory(userId, { page, limit });
  const [expanded, setExpanded] = useState<number | null>(null);

  const items = (data?.items ?? []) as AdminAuditEvent[];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  if (isLoading && !data) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
        No activity recorded for this account yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {items.map((event, i) => {
          const key = event.id ?? i;
          const isOpen = expanded === key;
          const hasDiff = Boolean(event.previous_value || event.new_value);
          return (
            <li key={key} className="rounded-lg border border-border/60 p-3">
              <div className="flex items-start gap-2">
                {hasDiff ? (
                  <button
                    className="mt-0.5 text-muted-foreground hover:text-foreground"
                    onClick={() => setExpanded(isOpen ? null : key)}
                    aria-label={isOpen ? "Collapse details" : "Expand details"}
                  >
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                ) : (
                  <span className="w-4" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-[11px]">
                      {event.action}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(event.timestamp)}
                    </span>
                    {event.performed_by && (
                      <span className="text-xs text-muted-foreground">
                        by {event.performed_by}
                      </span>
                    )}
                  </div>
                  {event.description && <p className="mt-1 text-sm">{event.description}</p>}
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Page {page} of {totalPages} · {total} events
          </span>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
