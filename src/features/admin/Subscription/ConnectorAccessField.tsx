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

  return (
    <div className="space-y-1.5">
      <Label>AI connectors (ITL Bridge AI)</Label>
      <div className="space-y-2 rounded-lg border border-border/60 p-3">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          (data ?? []).map((c) => (
            <div key={c.key} className="flex items-center justify-between">
              <span className="text-sm">{c.label}</span>
              <Switch
                checked={c.enabled}
                disabled={toggle.isPending}
                onCheckedChange={(enabled) => toggle.mutate({ connector: c.key, enabled })}
                aria-label={c.label}
              />
            </div>
          ))
        )}
        <p className="text-[11px] text-muted-foreground">Changes apply immediately. Both are on by default.</p>
      </div>
    </div>
  );
}
