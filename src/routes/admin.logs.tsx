/* eslint-disable prettier/prettier */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MessageSquare, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableSkeleton } from "@/features/admin/AdminSkeletons";
import { useAdminConversation, useAdminConversations } from "@/hooks";
import type { AdminConversationSummary } from "@/types/admin";
import { formatDateTime, titleCase } from "@/features/admin/users/admin-user-utils";
import { ConversationDetailDialog } from "@/features/admin/users/ConversationDetailDialog";

export const Route = createFileRoute("/admin/logs")({
  component: AdminLogsPage,
  head: () => ({ meta: [{ title: "Logs — Admin" }] }),
});

const MODULE_OPTIONS = [
  { value: "all", label: "All modules" },
  { value: "income-tax", label: "Income Tax" },
  { value: "gst", label: "GST" },
];

function AdminLogsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [module, setModule] = useState("all");
  const [openId, setOpenId] = useState<number | null>(null);

  const { data, isLoading } = useAdminConversations({
    page,
    limit: 25,
    search: search || undefined,
    module: module === "all" ? undefined : module,
  });
  const { data: detail, isLoading: detailLoading } = useAdminConversation(openId);

  const items = (data?.items ?? []) as AdminConversationSummary[];
  const total = data?.total ?? 0;
  const limit = data?.limit ?? 25;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">Logs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every AI conversation across all users — filter by module or search, then view the full exchange.
        </p>
      </div>

      <Card className="p-5 shadow-soft">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by title, user name or email..."
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              className="h-10 pl-9"
            />
          </div>
          <Select
            value={module}
            onValueChange={(v) => {
              setPage(1);
              setModule(v);
            }}
          >
            <SelectTrigger className="w-[170px]">
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

        {isLoading && !data ? (
          <TableSkeleton rows={8} cols={5} />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Conversation</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Tool</TableHead>
                  <TableHead>Last activity</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-14 text-center text-sm text-muted-foreground">
                      No conversations match these filters.
                    </TableCell>
                  </TableRow>
                )}
                {items.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <p className="max-w-[260px] truncate text-sm font-medium">{c.title}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{c.user_name}</p>
                      <p className="text-[11px] text-muted-foreground">{c.user_email}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{titleCase(c.module)}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{titleCase(c.tool)}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatDateTime(c.last_message_at ?? c.updated_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => setOpenId(c.id)}>
                        View more
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Page {page} of {totalPages} · {total} conversations
          </span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      </Card>

      <ConversationDetailDialog
        open={openId !== null}
        onOpenChange={(open) => !open && setOpenId(null)}
        data={detail}
        isLoading={detailLoading}
      />
    </>
  );
}
