/* eslint-disable prettier/prettier */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { adminConnectorAccessService } from "@/services/bridge.service";
import { apiErrorMessage } from "@/features/admin/users/admin-user-utils";

/**
 * Which AI connectors (GST AI / Income Tax AI) a customer with ITL Bridge AI may use.
 * Both are ON by default; switching one OFF suspends it on that MCP server straight away.
 * Applies immediately — it is not part of the dialog's Save button.
 */
export function ConnectorAccessField({ userId }: { userId: number }) {
  const qc = useQueryClient();
  const key = ["admin", "bridge", "access", userId];
  const { data, isLoading } = useQuery({ queryKey: key, queryFn: () => adminConnectorAccessService.get(userId) });
  const toggle = useMutation({
    mutationFn: ({ connector, enabled }: { connector: string; enabled: boolean }) =>
      adminConnectorAccessService.set(userId, connector, enabled),
    onSuccess: (res) => {
      qc.setQueryData(key, res.connectors);
      qc.invalidateQueries({ queryKey: ["bridge", "status"] });
      if (!res.synced) toast.warning("Saved, but the AI server couldn't be updated right now. Use Resync on the Bridge page.");
      else toast.success("Connector access updated");
    },
    onError: (e) => toast.error(apiErrorMessage(e, "Couldn't update connector access.")),
  });

  const hints: Record<string, string> = {
    gst: "GST law, notices and judgements in Claude, ChatGPT and Gemini.",
    it: "Income Tax law, notices and judgements in Claude, ChatGPT and Gemini.",
  };

  return (
    <div className="space-y-2">
      <div>
        <Label>AI connectors (ITL Bridge AI)</Label>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Both are on by default. Switching one off suspends it for this customer immediately — no need to press Save.
        </p>
      </div>
      <div className="divide-y divide-border/60 overflow-hidden rounded-lg border border-border/60">
        {isLoading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : (
          (data ?? []).map((c) => (
            <div key={c.key} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">{c.label}</p>
                <p className="text-xs text-muted-foreground">{hints[c.key]}</p>
              </div>
              <Switch
                checked={c.enabled}
                disabled={toggle.isPending}
                onCheckedChange={(enabled) => toggle.mutate({ connector: c.key, enabled })}
                aria-label={c.label}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
