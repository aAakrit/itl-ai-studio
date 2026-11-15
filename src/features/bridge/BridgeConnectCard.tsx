/* eslint-disable prettier/prettier */
import { Link } from "@tanstack/react-router";
import { Check, CheckCircle2, Copy, ExternalLink, Plug } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMyBridgeStatus } from "@/hooks";
import { formatDate } from "@/features/admin/users/admin-user-utils";
import type { BridgeConnectorStatus } from "@/types/bridge";
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

const BLURB: Record<string, string> = {
  gst: "Use GST law, notices and judgements inside Claude, ChatGPT and Gemini.",
  it: "Use Income Tax law, notices and judgements inside Claude, ChatGPT and Gemini.",
};

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Link copied");
  } catch {
    toast.error("Couldn't copy the link — please copy it manually.");
  }
}

/**
 * "ITL Bridge AI" section of the account page.
 *
 * Shown ONLY to customers with an active subscription that includes ITL Bridge AI
 * (the server returns has_access = false otherwise). One block per AI connector —
 * GST AI and Income Tax AI — each marked "Connected" once the customer has pressed
 * Allow for it.
 */
export function BridgeConnectCard() {
  const { data, isLoading } = useMyBridgeStatus();

  // Not configured, no active Bridge subscription, still loading, or unavailable: show nothing.
  if (isLoading || !data || !data.enabled || !data.has_access || data.connectors.length === 0) return null;

  return (
    <Card className="mt-6 p-6 shadow-soft">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/8 text-primary">
          <Plug className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold">ITL Bridge AI</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Connect your AI assistant to the Income Tax Library. Your plan covers both connectors below.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-8">
        {data.connectors.map((c) => (
          <ConnectorBlock key={c.key} connector={c} />
        ))}
      </div>

      <p className="mt-6 text-[11px] text-muted-foreground">
        Connect once on a computer — it then works in the same app on your phone. One plan works in all three apps
        and the daily limit is shared. To disconnect, remove the connector inside your AI app.
      </p>
    </Card>
  );
}

function ConnectorBlock({ connector }: { connector: BridgeConnectorStatus }) {
  if (connector.disabled) {
    return (
      <section>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold">{connector.label}</h3>
          <Badge className="bg-muted text-muted-foreground hover:bg-muted">Disabled</Badge>
        </div>
        <p className="mt-2 rounded-xl border border-border/60 bg-card p-4 text-sm text-muted-foreground">
          {connector.label} has been disabled on your account. Please contact support if you need it turned on.
        </p>
      </section>
    );
  }

  const { status, links } = connector;
  const sub = status?.subscription;
  const usage = status?.usage_today;
  // A plan whose end date has passed is still "active" in the record — show it as expired.
  const badgeStatus = status?.active ? "active" : sub?.status === "active" ? "expired" : sub?.status;
  const needsRenewal = Boolean(status && status.exists && (!status.active || (status.days_left ?? 999) < 15));

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold">{connector.label}</h3>
        {connector.connected ? (
          <Badge className="gap-1 bg-success/10 text-success hover:bg-success/10">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Connected{connector.connected_at ? ` · ${formatDate(connector.connected_at)}` : ""}
          </Badge>
        ) : (
          <Badge className="bg-muted text-muted-foreground hover:bg-muted">Not connected</Badge>
        )}
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">{BLURB[connector.key]}</p>

      {/* Plan status */}
      <div className="mt-3 rounded-xl border border-border/60 bg-card p-4">
        {connector.error ? (
          <p className="text-sm text-muted-foreground">
            {connector.label} details are unavailable right now. Please try again in a moment.
          </p>
        ) : status?.exists && sub ? (
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
            Your plan is being set up for {connector.label}. This usually takes a minute — refresh shortly.
          </p>
        )}

        {needsRenewal && (
          <Button asChild className="mt-4 h-10 rounded-xl gradient-primary text-primary-foreground shadow-soft">
            <Link to="/pricing">Renew</Link>
          </Button>
        )}
      </div>

      {/* Connect buttons */}
      <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-primary">
        {connector.connected ? "Connect another AI app" : "Connect your AI"}
      </p>
      <div className="mt-3 grid gap-4 md:grid-cols-3">
        {APPS.map((app) => {
          const href = links?.[app.key];
          return (
            <div key={app.key} className="flex flex-col rounded-xl border border-border/60 p-4">
              <Button asChild={Boolean(href)} disabled={!href} variant="outline" className="h-10 w-full rounded-xl">
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
    </section>
  );
}
