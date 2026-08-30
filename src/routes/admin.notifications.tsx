/* eslint-disable prettier/prettier */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCheck, UserPlus, Wallet, CalendarClock, Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useAdminNotifications, useMarkAllNotificationsRead, useMarkNotificationRead } from "@/hooks";
import type { AdminNotification, AdminNotificationType } from "@/types/admin";

export const Route = createFileRoute("/admin/notifications")({
  component: AdminNotificationsPage,
  head: () => ({ meta: [{ title: "Notifications — Admin" }] }),
});

const iconFor = (type: AdminNotificationType) => {
  switch (type) {
    case "user_pending_approval":
      return <UserPlus className="h-4 w-4 text-primary" />;
    case "payment_completed":
      return <Wallet className="h-4 w-4 text-success" />;
    case "subscription_expiring":
      return <CalendarClock className="h-4 w-4 text-warning" />;
    default:
      return <Bell className="h-4 w-4 text-muted-foreground" />;
  }
};

const TYPE_LABEL: Record<AdminNotificationType, string> = {
  user_pending_approval: "New user",
  payment_completed: "Payment",
  subscription_expiring: "Expiring soon",
};

function AdminNotificationsPage() {
  const nav = useNavigate();
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const { data, isLoading } = useAdminNotifications({ page, limit: 20, unread_only: unreadOnly });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const limit = data?.limit ?? 20;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const unreadCount = data?.unread_count ?? 0;

  const handleClick = (n: AdminNotification) => {
    if (!n.is_read) markRead.mutate(n.id);
    if (n.target_type === "user") nav({ to: "/admin/users" });
    else if (n.target_type === "payment" || n.target_type === "subscription") nav({ to: "/admin/subscriptions" });
  };

  return (
    <>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            New users awaiting approval, completed payments, and subscriptions expiring within 7 days.
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-1.5"
          disabled={markAllRead.isPending || unreadCount === 0}
          onClick={() => markAllRead.mutate()}
        >
          <CheckCheck className="h-4 w-4" /> Mark all read
        </Button>
      </div>

      <Card className="p-5 shadow-soft">
        <Tabs
          value={unreadOnly ? "unread" : "all"}
          onValueChange={(v) => {
            setPage(1);
            setUnreadOnly(v === "unread");
          }}
          className="mb-4"
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">
              Unread{unreadCount > 0 ? ` (${unreadCount})` : ""}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading && !data ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-secondary/40" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            {unreadOnly ? "No unread notifications." : "No notifications yet."}
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((n) => (
              <li
                key={n.id}
                onClick={() => handleClick(n)}
                className={cn(
                  "cursor-pointer rounded-xl border border-border/60 bg-card p-3.5 transition-colors hover:bg-secondary/40",
                  !n.is_read && "border-l-4 border-l-primary",
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{iconFor(n.type)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{n.title}</p>
                        <Badge variant="outline" className="text-[10px]">
                          {TYPE_LABEL[n.type]}
                        </Badge>
                      </div>
                      <span className="whitespace-nowrap text-[11px] text-muted-foreground">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    {n.body && <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Page {page} of {totalPages} · {total} notifications
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
    </>
  );
}
