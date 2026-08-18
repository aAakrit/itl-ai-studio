/* eslint-disable prettier/prettier */
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import type { AIUsageSummary } from "@/types/admin";
import { EMPTY, formatDateTime, formatNumber, titleCase } from "./admin-user-utils";

function UsageBar({
  label,
  used,
  limit,
  remaining,
}: {
  label: string;
  used?: number | null;
  limit?: number | null;
  remaining?: number | null;
}) {
  const configured = limit !== null && limit !== undefined;
  const pct = configured && limit > 0 ? Math.min(100, ((used ?? 0) / limit) * 100) : 0;

  return (
    <div className="rounded-lg border border-border/60 p-3">
      <div className="flex items-baseline justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="text-sm font-semibold">
          {configured ? `${formatNumber(used ?? 0)} / ${formatNumber(limit)}` : "Not configured"}
        </p>
      </div>
      {configured && (
        <>
          <Progress value={pct} className="mt-2 h-1.5" />
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            {remaining === null || remaining === undefined
              ? EMPTY
              : `${formatNumber(remaining)} remaining`}
          </p>
        </>
      )}
    </div>
  );
}

/**
 * AI usage panel. The backend has no admin AI-limit endpoints yet, so the
 * "Edit limits" / "Reset usage" affordances are rendered disabled — the layout
 * is already in place for when those endpoints land.
 */
export function AiUsagePanel({ usage }: { usage?: AIUsageSummary | null }) {
  const notConfigured = !usage || usage.daily_limit === null || usage.daily_limit === undefined;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">AI usage</p>
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="outline" disabled title="Available in a future release">
            Edit limits
          </Button>
          <Button size="sm" variant="outline" disabled title="Available in a future release">
            Reset usage
          </Button>
        </div>
      </div>

      {notConfigured && (
        <p className="rounded-lg border border-dashed border-border/60 p-4 text-center text-sm text-muted-foreground">
          No AI usage limits are configured for this user.
        </p>
      )}

      {usage && !notConfigured && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <UsageBar
              label="Daily"
              used={usage.daily_used}
              limit={usage.daily_limit}
              remaining={usage.daily_remaining}
            />
            <UsageBar
              label="Monthly"
              used={usage.monthly_used}
              limit={usage.monthly_limit}
              remaining={usage.monthly_remaining}
            />
            <UsageBar
              label="Yearly"
              used={usage.yearly_used}
              limit={usage.yearly_limit}
              remaining={usage.yearly_remaining}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <Stat label="Token balance" value={formatNumber(usage.token_balance)} />
            <Stat label="Tokens used" value={formatNumber(usage.tokens_used)} />
            <Stat label="Reset frequency" value={titleCase(usage.reset_frequency)} />
            <Stat label="Last reset" value={formatDateTime(usage.last_reset_at)} />
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
