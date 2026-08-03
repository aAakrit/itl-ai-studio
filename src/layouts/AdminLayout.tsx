/* eslint-disable prettier/prettier */
import { Link, useRouterState } from "@tanstack/react-router";
import { Logo } from "@/components/common/Logo";
import { Icon } from "@/components/common/Icon";
import { cn } from "@/lib/utils";
import { useAdminNav } from "@/hooks";
import { Button } from "@/components/ui/button";
import { Bell, Search } from "lucide-react";
import { useCommandStore } from "@/store/commandStore";
import { useNotificationStore } from "@/store/notificationStore";

import { SidebarNavSkeleton } from "@/features/admin/AdminSkeletons";
import { UserMenu } from "@/components/common/UserMenu";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: nav, isLoading: navLoading } = useAdminNav();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const openPalette = useCommandStore((s) => s.setOpen);
  const openDrawer = useNotificationStore((s) => s.setDrawerOpen);
  const unread = useNotificationStore((s) => s.items.filter((n) => !n.read).length);

  return (
    <div className="grid min-h-screen grid-cols-[260px_1fr] bg-background">
      <aside className="border-r border-border/60 bg-sidebar/70 px-4 py-5">
        <div className="px-2">
          <Link to="/admin">
            <Logo />
          </Link>
        </div>
        {navLoading && !nav ? (
          <SidebarNavSkeleton />
        ) : (
          <div className="mt-6 space-y-6">
            {(nav ?? []).map((section, si) => (
              <div key={`${section.section}-${si}`}>
                <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {section.section}
                </p>
                <ul className="space-y-0.5">
                  {section.items.map((item, i) => {
                    const active = pathname === item.to;
                    return (
                      <li key={`${item.to}-${i}`}>
                        <Link
                          to={item.to}
                          className={cn(
                            "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                            active
                              ? "bg-primary/8 text-primary"
                              : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                          )}
                        >
                          <Icon name={item.icon} className="h-4 w-4" />
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </aside>
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/60 bg-background/80 px-6 backdrop-blur">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Admin</span>
            <span>/</span>
            <span className="font-medium text-foreground capitalize">
              {pathname.split("/").filter(Boolean).slice(1).join(" / ") || "Dashboard"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" onClick={() => openPalette(true)}>
              <Search className="h-4 w-4" /> <span className="hidden sm:inline">Search</span>
              <kbd className="ml-1 hidden rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono sm:inline">⌘K</kbd>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => openDrawer(true)} className="relative">
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute right-1.5 top-1.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                  {unread}
                </span>
              )}
            </Button>
            <UserMenu />
          </div>
        </header>
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
