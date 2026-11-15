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

/** Which AI the customer is connecting, from the MCP server that sent them here. */
function connectorFromReturnUrl(returnUrl: string | null): { name: string; scope: string } {
  let host = "";
  try {
    host = returnUrl ? new URL(returnUrl).hostname : "";
  } catch {
    /* not a URL — treated as GST below */
  }
  return host.startsWith("mcp-it.")
    ? { name: "Income Tax AI", scope: "Income Tax" }
    : { name: "GST AI", scope: "GST" };
}

/**
 * Consent page for connecting an AI connector (GST AI or Income Tax AI).
 *
 * The MCP server opens /ai-connect/allow?txn=...&return_url=...  The return_url's host says
 * which connector it is, and the server sends the customer back to that same MCP server.
 * The customer must be signed in and press Allow themselves — it never auto-approves.
 *
 * txn / return_url are read from the raw query string on purpose: the router's search
 * parser would coerce a numeric-looking txn into a number.
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

  // Preserve the complete consent URL during login.
  useEffect(() => {
    if (mounted && !token) {
      const back = window.location.pathname + window.location.search;
      window.location.replace(`/login?redirect=${encodeURIComponent(back)}`);
    }
  }, [mounted, token]);

  const connector = connectorFromReturnUrl(params.returnUrl);

  const submit = (decision: "allow" | "cancel") => {
    setError(null);
    decide.mutate(
      { txn: params.txn, return_url: params.returnUrl, decision },
      {
        onSuccess: (redirect) => {
          window.location.assign(redirect);
        },
        onError: (e) => {
          const message = apiErrorMessage(
            e,
            `Unable to complete the ${connector.name} connection. Please try connecting again from your AI application.`,
          );
          setError(message);
          toast.error(message);
        },
      },
    );
  };

  if (!mounted || !token) {
    return (
      <AuthLayout title={`Connect ${connector.name}`} subtitle="Checking your sign-in...">
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </AuthLayout>
    );
  }

  if (!params.txn) {
    return (
      <AuthLayout
        title="Invalid connection link"
        subtitle="Please start the connection again from your AI application."
        footer={
          <Link to="/profile" className="font-semibold text-primary hover:underline">
            Go to my account
          </Link>
        }
      >
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/8 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          This connection link is missing its transaction reference.
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={`Connect ${connector.name}`}
      subtitle={`Allow ${connector.name} to access your ${connector.scope} subscription through your AI application?`}
    >
      <div className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/8 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
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
          By allowing this connection, {connector.name} will be able to access {connector.scope}-related information
          and services available under your Income Tax Library subscription, subject to your plan permissions and
          applicable usage limits. You can disconnect this integration from your AI application at any time.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-11 rounded-xl" disabled={decide.isPending} onClick={() => submit("cancel")}>
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
