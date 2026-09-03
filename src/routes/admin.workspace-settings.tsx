/* eslint-disable prettier/prettier */
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateWorkspaceSettingsAdmin, useWorkspaceSettingsAdmin } from "@/hooks";

export const Route = createFileRoute("/admin/workspace-settings")({
  component: AdminWorkspaceSettingsPage,
  head: () => ({ meta: [{ title: "Workspace Settings — Admin" }] }),
});

const MODULE_OPTIONS = [
  { value: "income-tax", label: "Income Tax" },
  { value: "gst", label: "GST" },
];

function AdminWorkspaceSettingsPage() {
  const { data, isLoading } = useWorkspaceSettingsAdmin();
  const update = useUpdateWorkspaceSettingsAdmin();

  const [allowExport, setAllowExport] = useState(true);
  const [showCitations, setShowCitations] = useState(true);
  const [defaultModule, setDefaultModule] = useState("income-tax");
  const [banner, setBanner] = useState("");
  const [supportEmail, setSupportEmail] = useState("");

  useEffect(() => {
    if (!data) return;
    setAllowExport(data.allow_conversation_export);
    setShowCitations(data.show_citations_by_default);
    setDefaultModule(data.default_module);
    setBanner(data.announcement_banner ?? "");
    setSupportEmail(data.support_email ?? "");
  }, [data]);

  const handleSave = () => {
    update.mutate(
      {
        allow_conversation_export: allowExport,
        show_citations_by_default: showCitations,
        default_module: defaultModule,
        announcement_banner: banner.trim() || null,
        support_email: supportEmail.trim() || null,
      },
      {
        onSuccess: () => toast.success("Workspace settings saved"),
        onError: () => toast.error("Couldn't save — please try again."),
      },
    );
  };

  if (isLoading && !data) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">Workspace Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Defaults applied to every user's workspace. Users can override a few of these (like citations) for
          themselves from their own Settings panel.
        </p>
      </div>

      <div className="space-y-5">
        <Card className="p-5 shadow-soft">
          <h2 className="font-display text-base font-semibold">Defaults</h2>
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 p-3.5">
              <div>
                <p className="text-sm font-medium">Show citations by default</p>
                <p className="text-xs text-muted-foreground">
                  New users start with citations expanded. Users may still change this for themselves.
                </p>
              </div>
              <Switch checked={showCitations} onCheckedChange={setShowCitations} />
            </div>

            <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 p-3.5">
              <div>
                <p className="text-sm font-medium">Allow conversation export</p>
                <p className="text-xs text-muted-foreground">
                  Lets users copy or download their conversations from the Share menu.
                </p>
              </div>
              <Switch checked={allowExport} onCheckedChange={setAllowExport} />
            </div>

            <div>
              <Label className="mb-1.5 block text-sm">Default module for new users</Label>
              <Select value={defaultModule} onValueChange={setDefaultModule}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODULE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        <Card className="p-5 shadow-soft">
          <h2 className="font-display text-base font-semibold">Announcement</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Shown as a banner at the top of every user's workspace. Leave blank to hide it.
          </p>
          <Textarea
            className="mt-3"
            rows={3}
            placeholder="e.g. Scheduled maintenance on Sunday 2–4 AM IST"
            value={banner}
            onChange={(e) => setBanner(e.target.value)}
          />
        </Card>

        <Card className="p-5 shadow-soft">
          <h2 className="font-display text-base font-semibold">Support</h2>
          <div className="mt-3">
            <Label htmlFor="support-email" className="mb-1.5 block text-sm">Support email</Label>
            <Input
              id="support-email"
              type="email"
              placeholder="support@yourcompany.com"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </Card>

        <Button onClick={handleSave} disabled={update.isPending} className="gap-1.5 gradient-primary text-primary-foreground shadow-soft">
          {update.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save changes
        </Button>
      </div>
    </>
  );
}
