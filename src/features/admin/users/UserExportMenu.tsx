/* eslint-disable prettier/prettier */
import { useState } from "react";
import { Download, FileSpreadsheet, FileText, Loader2, Table2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useExportUsers } from "@/hooks";

type Format = "xlsx" | "docx" | "pdf";
type Detail = "short" | "full";

const FORMATS: { value: Format; label: string; icon: typeof FileSpreadsheet }[] = [
  { value: "xlsx", label: "Excel (.xlsx)", icon: FileSpreadsheet },
  { value: "docx", label: "Word (.docx)", icon: FileText },
  { value: "pdf", label: "PDF (.pdf)", icon: Table2 },
];

/** "Export" dropdown for a set of selected user ids — offers all three
 * formats, each in a short (table columns only) and full (every field)
 * variant. */
export function UserExportMenu({ userIds }: { userIds: number[] }) {
  const exportMutation = useExportUsers();
  const [pending, setPending] = useState<string | null>(null);

  const run = (format: Format, detail: Detail) => {
    const key = `${format}-${detail}`;
    setPending(key);
    exportMutation.mutate(
      { user_ids: userIds, format, detail },
      {
        onSuccess: () => toast.success(`Exported ${userIds.length} user${userIds.length === 1 ? "" : "s"}`),
        onError: () => toast.error("Export failed — please try again."),
        onSettled: () => setPending(null),
      },
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5" disabled={userIds.length === 0}>
          {exportMutation.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-[11px] uppercase tracking-wide text-muted-foreground">
          Short file — table columns only
        </DropdownMenuLabel>
        {FORMATS.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem key={`short-${value}`} onClick={() => run(value, "short")} disabled={Boolean(pending)}>
            <Icon className="mr-2 h-4 w-4" /> {label}
            {pending === `${value}-short` && <Loader2 className="ml-auto h-3.5 w-3.5 animate-spin" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-[11px] uppercase tracking-wide text-muted-foreground">
          Full file — every field on the user
        </DropdownMenuLabel>
        {FORMATS.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem key={`full-${value}`} onClick={() => run(value, "full")} disabled={Boolean(pending)}>
            <Icon className="mr-2 h-4 w-4" /> {label}
            {pending === `${value}-full` && <Loader2 className="ml-auto h-3.5 w-3.5 animate-spin" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
