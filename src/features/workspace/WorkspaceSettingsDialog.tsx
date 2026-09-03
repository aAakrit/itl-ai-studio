/* eslint-disable prettier/prettier */
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Moon, Sun, Monitor } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useMyWorkspaceSettings, useUpdateMyWorkspaceSettings } from "@/hooks";
import { useThemeStore } from "@/store/themeStore";

const THEME_OPTIONS: { value: "light" | "dark" | "system"; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function WorkspaceSettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { data, isLoading } = useMyWorkspaceSettings();
  const update = useUpdateMyWorkspaceSettings();
  const setThemeMode = useThemeStore((s) => s.setMode);
  const currentThemeMode = useThemeStore((s) => s.theme.mode);

  const [showCitations, setShowCitations] = useState(true);
  const [compactMode, setCompactMode] = useState(false);

  useEffect(() => {
    if (!data) return;
    setShowCitations(data.show_citations);
    setCompactMode(data.compact_mode);
  }, [data]);

  const handleSave = () => {
    update.mutate(
      { show_citations: showCitations, compact_mode: compactMode },
      {
        onSuccess: () => {
          toast.success("Settings saved");
          onOpenChange(false);
        },
        onError: () => toast.error("Couldn't save — please try again."),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Workspace settings</DialogTitle>
          <DialogDescription>Personal preferences for how your workspace looks and behaves.</DialogDescription>
        </DialogHeader>

        {isLoading && !data ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <Label className="mb-2 block text-sm">Appearance</Label>
              <div className="grid grid-cols-3 gap-2">
                {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setThemeMode(value)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs font-medium transition-colors",
                      currentThemeMode === value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border/60 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 p-3">
              <div>
                <p className="text-sm font-medium">Show citations by default</p>
                <p className="text-xs text-muted-foreground">Expand source citations automatically in new answers.</p>
              </div>
              <Switch checked={showCitations} onCheckedChange={setShowCitations} />
            </div>

            <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 p-3">
              <div>
                <p className="text-sm font-medium">Compact mode</p>
                <p className="text-xs text-muted-foreground">Tighter spacing for chat messages and the sidebar.</p>
              </div>
              <Switch checked={compactMode} onCheckedChange={setCompactMode} />
            </div>

            {data && !data.allow_conversation_export && (
              <p className="text-xs text-muted-foreground">
                Conversation export is currently turned off by your administrator.
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={update.isPending} className="gap-1.5">
            {update.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
