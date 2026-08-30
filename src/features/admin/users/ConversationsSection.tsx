/* eslint-disable prettier/prettier */
import { useState } from "react";
import { Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdminUserConversation, useAdminUserConversations } from "@/hooks";
import type { AdminConversationSummary } from "@/types/admin";
import { formatDateTime, titleCase } from "./admin-user-utils";
import { ConversationDetailDialog } from "./ConversationDetailDialog";

export function ConversationsSection({ userId }: { userId: number }) {
  const [page, setPage] = useState(1);
  const limit = 20;
  const { data, isLoading } = useAdminUserConversations(userId, { page, limit });
  const [openId, setOpenId] = useState<number | null>(null);
  const { data: detail, isLoading: detailLoading } = useAdminUserConversation(userId, openId);

  const items = (data?.items ?? []) as AdminConversationSummary[];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  if (isLoading && !data) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
        No AI conversations for this account yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {items.map((c) => (
          <li key={c.id} className="flex items-start justify-between gap-3 rounded-lg border border-border/60 p-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="truncate text-sm font-medium">{c.title}</p>
                <Badge variant="outline" className="text-[10px]">{titleCase(c.module)}</Badge>
                <Badge variant="outline" className="text-[10px]">{titleCase(c.tool)}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDateTime(c.last_message_at ?? c.updated_at)}
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setOpenId(c.id)}>
              View more
            </Button>
          </li>
        ))}
      </ul>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Page {page} of {totalPages} · {total} conversations
          </span>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      <ConversationDetailDialog
        open={openId !== null}
        onOpenChange={(open) => !open && setOpenId(null)}
        data={detail}
        isLoading={detailLoading}
      />
    </div>
  );
}
