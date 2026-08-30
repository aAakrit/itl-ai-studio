/* eslint-disable prettier/prettier */
import { Loader2, User, Bot } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AdminConversationDetail, AdminConversationMessage } from "@/types/admin";
import { formatDateTime, titleCase } from "./admin-user-utils";

/** Full message history for one conversation — used from both the
 * per-user AI Conversations tab and the global Admin > Logs page. */
export function ConversationDetailDialog({
  open,
  onOpenChange,
  data,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: AdminConversationDetail;
  isLoading: boolean;
}) {
  const messages = (data?.messages ?? []) as AdminConversationMessage[];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="truncate">{data?.title ?? "Conversation"}</DialogTitle>
          <DialogDescription>
            {data && (
              <span className="flex flex-wrap items-center gap-1.5">
                <span>{data.user_name}</span>
                <span>·</span>
                <Badge variant="outline" className="text-[10px]">{titleCase(data.module)}</Badge>
                <Badge variant="outline" className="text-[10px]">{titleCase(data.tool)}</Badge>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-border/60 bg-secondary/20 p-4">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No messages in this conversation.</p>
          ) : (
            <div className="space-y-4">
              {messages.map((m, i) => {
                const isUser = m.role === "user";
                return (
                  <div key={m.id ?? i} className={cn("flex gap-2.5", isUser ? "flex-row-reverse" : "flex-row")}>
                    <div
                      className={cn(
                        "mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full",
                        isUser ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground",
                      )}
                    >
                      {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                    </div>
                    <div className={cn("max-w-[80%] rounded-xl border border-border/60 bg-card p-3", isUser && "bg-primary/5")}>
                      <p className="whitespace-pre-wrap break-words text-sm">{m.content}</p>
                      <p className="mt-1.5 text-[10px] text-muted-foreground">{formatDateTime(m.created_at)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
