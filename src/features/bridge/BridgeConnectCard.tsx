/* eslint-disable prettier/prettier */
import { Link } from "@tanstack/react-router";
import { Check, Copy, ExternalLink, Plug } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyBridgeStatus } from "@/hooks";
import { formatDate } from "@/features/admin/users/admin-user-utils";
import { bridgePlanLabel, bridgeStatusClass, bridgeStatusLabel, limitLabel } from "./bridge-utils";

const APPS = [
  {
    key: "claude" as const,
    name: "Claude",
    needs: "Needs Claude Pro, Max, Team or Enterprise.",
    steps: "Click Connect Claude, then Add, then Allow.",
    copy: false,
  },
  {
    key: "chatgpt" as const,
    name: "ChatGPT",
    needs: "Needs a ChatGPT paid plan.",
    steps: "Copy the link, then in ChatGPT create the connector with OAuth, paste the link, click Create, then Allow.",
    copy: true,
  },
  {
    key: "gemini" as const,
    name: "Gemini",
    needs: "Personal Gmail accounts only.",
    steps: "Copy the link, then in Gemini go to Settings > Connected Apps > Add a custom app, paste the link and Allow.",
    copy: true,
  },
];

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Link copied");
  } catch {
    toast.error("Couldn't copy the link — please copy it manually.");
  }
}

/** "ITL Bridge AI" section of the account page. */
export function BridgeConnectCard() {
  const { data, isLoading, isError } = useMyBridgeStatus();

  // Not configured on this deployment — keep the account page exactly as it was.
  if (data && !data.enabled) return null;

  const status = data?.status;
  const sub = status?.subscription;
  const usage = status?.usage_today;
  const links = data?.links;
  // A plan whose end date has passed is still "active" in the record — show it as expired.
  const badgeStatus = status?.active ? "active" : sub?.status === "active" ? "expired" : sub?.status;
  const needsRenewal = Boolean(status && (!status.active || (status.days_left ?? 999) < 15));

  return (
    <Card className="mt-6 p-6 shadow-soft">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/8 text-primary">
          <Plug className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold">ITL Bridge AI</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Use the Income Tax Library database inside Claude, ChatGPT and Gemini.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-6 space-y-3">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-5 w-64" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : isError || !data ? (
        <p className="mt-6 text-sm text-muted-foreground">
          ITL Bridge AI details are unavailable right now. Please try again in a moment.
        </p>
      ) : (
        <>
          {/* Plan status */}
          <div className="mt-6 rounded-xl border border-border/60 bg-card p-4">
            {status?.exists && sub ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Plan</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">{bridgePlanLabel(sub.plan)}</span>
                    <Badge className={bridgeStatusClass(badgeStatus)}>{bridgeStatusLabel(badgeStatus)}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Valid till {formatDate(sub.expires_at)}
                    {status.active && status.days_left != null && ` · ${status.days_left} days left`}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Today</p>
                  <p className="mt-1 text-sm font-semibold">
                    {usage?.searches ?? 0} of {limitLabel(usage?.search_limit)} searches
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {usage?.documents ?? 0} of {limitLabel(usage?.document_limit)} full documents
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No ITL Bridge AI plan is linked to this account yet.
              </p>
            )}

            {(needsRenewal || !status?.exists) && (
              <Button asChild className="mt-4 h-10 rounded-xl gradient-primary text-primary-foreground shadow-soft">
                <Link to="/billing">{status?.exists ? "Renew" : "Get a plan"}</Link>
              </Button>
            )}
          </div>

          {/* Connect buttons */}
          <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-primary">Connect your AI</p>
          <div className="mt-3 grid gap-4 md:grid-cols-3">
            {APPS.map((app) => {
              const href = links?.[app.key];
              return (
                <div key={app.key} className="flex flex-col rounded-xl border border-border/60 p-4">
                  <Button
                    asChild={Boolean(href)}
                    disabled={!href}
                    variant="outline"
                    className="h-10 w-full rounded-xl"
                  >
                    {href ? (
                      <a href={href} target="_blank" rel="noopener noreferrer">
                        Connect {app.name} <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <span>Connect {app.name}</span>
                    )}
                  </Button>
                  {app.copy && links?.mcp_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 w-full gap-1.5 text-muted-foreground"
                      onClick={() => copyText(links.mcp_url!)}
                    >
                      <Copy className="h-3.5 w-3.5" /> Copy link
                    </Button>
                  )}
                  <p className="mt-3 flex items-start gap-1.5 text-[11px] font-medium text-foreground">
                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" /> {app.needs}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{app.steps}</p>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Connect once on a computer — it then works in the same app on your phone. One plan works in all three apps
            and the daily limit is shared.
          </p>
        </>
      )}
    </Card>
  );
}

