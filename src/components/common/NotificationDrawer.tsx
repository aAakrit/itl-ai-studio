/* eslint-disable prettier/prettier */
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { CheckCheck, UserPlus, Wallet, CalendarClock, Bell, Loader2 } from "lucide-react";
import { useNotificationStore } from "@/store/notificationStore";
import { useAdminNotifications, useMarkAllNotificationsRead, useMarkNotificationRead } from "@/hooks";
import { useNavigate } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import type { AdminNotificationType } from "@/types/admin";

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

export function NotificationDrawer() {
  const open = useNotificationStore((s) => s.drawerOpen);
  const setOpen = useNotificationStore((s) => s.setDrawerOpen);
  const nav = useNavigate();

  const { data, isLoading } = useAdminNotifications({ page: 1, limit: 30 });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const items = data?.items ?? [];

  const handleClick = (n: (typeof items)[number]) => {
    if (!n.is_read) markRead.mutate(n.id);
    setOpen(false);
    if (n.target_type === "user" && n.target_id) {
      nav({ to: "/admin/users" });
    } else if (n.target_type === "payment" || n.target_type === "subscription") {
      nav({ to: "/admin/subscriptions" });
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader className="flex-row items-center justify-between space-y-0">
          <SheetTitle>Notifications</SheetTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending || !items.some((n) => !n.is_read)}
            className="gap-1.5 text-xs"
          >
            <CheckCheck className="h-4 w-4" /> Mark all read
          </Button>
        </SheetHeader>
        <ul className="mt-4 space-y-2">
          {isLoading && (
            <li className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </li>
          )}
          {!isLoading && items.length === 0 && (
            <li className="rounded-xl border border-border/60 bg-card p-6 text-center text-sm text-muted-foreground">
              You're all caught up.
            </li>
          )}
          {items.map((n) => (
            <li
              key={n.id}
              onClick={() => handleClick(n)}
              className={cn(
                "cursor-pointer rounded-xl border border-border/60 bg-card p-3 transition-colors hover:bg-secondary/40",
                !n.is_read && "border-l-4 border-l-primary",
              )}
            >
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5">{iconFor(n.type)}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{n.title}</p>
                    <span className="whitespace-nowrap text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  {n.body && <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </SheetContent>
    </Sheet>
  );
}
