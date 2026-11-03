/* eslint-disable prettier/prettier */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertCircle, Loader2, Plug } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "@/layouts/AuthLayout";
import { Button } from "@/components/ui/button";
import { useBridgeDecision } from "@/hooks";
import { useCurrentUser, useToken } from "@/hooks/useAuth";
import { apiErrorMessage } from "@/features/admin/users/admin-user-utils";

export const Route = createFileRoute("/ai-connect/allow")({
  component: AllowPage,
  head: () => ({ meta: [{ title: "Connect ITL Bridge AI — ITL AI" }] }),
});

/**
 * The popup a customer sees when connecting their AI app. The MCP server
 * opens it as /ai-connect/allow?txn=...&return_url=...  The user must be
 * signed in (they come straight back here after login with the query string
 * intact) and must press Allow themselves — it never auto-approves.
 *
 * txn / return_url are read from the raw query string on purpose: the
 * router's search parser would coerce a numeric-looking txn into a number.
 */
function AllowPage() {
  const token = useToken();
  const user = useCurrentUser();
  const decide = useBridgeDecision();
  const [mounted, setMounted] = useState(false);
  const [params, setParams] = useState<{ txn: string; returnUrl: string | null }>({ txn: "", returnUrl: null });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setParams({ txn: q.get("txn") ?? "", returnUrl: q.get("return_url") });
    setMounted(true);
  }, []);

  // Not signed in: go to login and come back to this exact URL, query string included.
  useEffect(() => {
    if (mounted && !token) {
      const back = window.location.pathname + window.location.search;
      window.location.replace(`/login?redirect=${encodeURIComponent(back)}`);
    }
  }, [mounted, token]);

  const submit = (decision: "allow" | "cancel") => {
    setError(null);
    decide.mutate(
      { txn: params.txn, return_url: params.returnUrl, decision },
      {
        onSuccess: (redirect) => window.location.assign(redirect),
        onError: (e) => {
          const message = apiErrorMessage(e, "Couldn't complete this request. Please click Connect again in your AI app.");
          setError(message);
          toast.error(message);
        },
      },
    );
  };

  if (!mounted || !token) {
    return (
      <AuthLayout title="Connect ITL Bridge AI" subtitle="Checking your sign-in…">
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </AuthLayout>
    );
  }

  if (!params.txn) {
    return (
      <AuthLayout
        title="Invalid link"
        subtitle="Please click Connect again in your AI app."
        footer={
          <Link to="/profile" className="font-semibold text-primary hover:underline">
            Go to my account
          </Link>
        }
      >
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/8 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" /> This connect link is missing its reference.
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Connect ITL Bridge AI"
      subtitle="Allow ITL Bridge AI to use your Income Tax Library subscription in your AI app?"
    >
      <div className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/8 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}
        <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-soft">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/8 text-primary">
            <Plug className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{user?.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Your AI app will be able to search the ITL database on your behalf, within your plan's daily limits. You can
          disconnect any time from your AI app.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-11 rounded-xl"
            disabled={decide.isPending}
            onClick={() => submit("cancel")}
          >
            Cancel
          </Button>
          <Button
            className="h-11 rounded-xl gradient-primary text-primary-foreground shadow-soft"
            disabled={decide.isPending}
            onClick={() => submit("allow")}
          >
            {decide.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Allow"}
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
}
