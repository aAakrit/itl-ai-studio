/* eslint-disable prettier/prettier */
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Plus,
  Search,
  Pin,
  Star,
  MoreHorizontal,
  Folder,
  Settings,
  LogOut,
  ChevronsLeft,
  Pencil,
  Archive,
  ArchiveRestore,
  Trash2,
  Check,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { toast } from "sonner";
import { Logo } from "@/components/common/Logo";
import { Icon } from "@/components/common/Icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useArchiveThread, useChatFolders, useChatThreads, useDeleteThread, useRenameThread, useWorkspaceModules } from "@/hooks";
import { useCurrentUser } from "@/hooks/useAuth";
import { useWorkspaceStore, useSidebarStore, useChatStore } from "@/store";
import { authService } from "@/services/auth.service";
import { WorkspaceSettingsDialog } from "./WorkspaceSettingsDialog";
import type { ChatThread } from "@/types";

export function WorkspaceSidebar() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const threads = useChatStore((s) => s.threads);
  const setThreadsForScope = useChatStore((s) => s.setThreadsForScope);
  const { data: folders } = useChatFolders();
  const { data: modules } = useWorkspaceModules();
  const activeModuleId = useWorkspaceStore((s) => s.activeModuleId);
  const activeToolId = useWorkspaceStore((s) => s.activeToolId);
  const setModule = useWorkspaceStore((s) => s.setModule);
  const activeThreadId = useWorkspaceStore((s) => s.activeThreadId);
  const setThread = useWorkspaceStore((s) => s.setThread);
  const toggleLeft = useSidebarStore((s) => s.toggleLeft);
  const { data: threadList, isSuccess: threadsLoaded } = useChatThreads(activeModuleId, activeToolId);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ChatThread | null>(null);

  // Refetches and re-syncs every time the active Module+Tool workspace changes —
  // each combination is an independent namespace with its own history.
  useEffect(() => {
    if (threadsLoaded && threadList) {
      setThreadsForScope(activeModuleId, activeToolId, threadList);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadsLoaded, threadList, activeModuleId, activeToolId]);

  const handleNewChat = () => setThread(null);

  const deleteThread = useDeleteThread();
  const renameThread = useRenameThread();
  const archiveThread = useArchiveThread();

  const handleRename = (thread: ChatThread, title: string) => {
    renameThread.mutate(
      { id: thread.id, title },
      {
        onSuccess: () => toast.success("Renamed"),
        onError: () => toast.error("Couldn't rename — please try again."),
      },
    );
  };

  const handleArchive = (thread: ChatThread) => {
    archiveThread.mutate(
      { id: thread.id, archived: true },
      {
        onSuccess: () => {
          toast.success("Archived");
          if (activeThreadId === thread.id) setThread(null);
        },
        onError: () => toast.error("Couldn't archive — please try again."),
      },
    );
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } finally {
      useChatStore.getState().reset();
      useWorkspaceStore.getState().reset();
      navigate({ to: "/login" });
    }
  };

  const displayName = currentUser?.name || currentUser?.email || "Account";
  const initials =
    (currentUser?.name ?? currentUser?.email ?? "?")
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  // Single source of truth for ordering: always derive from `updatedAt`,
  // never rely on array insertion order. Newest conversation is always first.
  const sorted = useMemo(
    () => [...threads].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [threads],
  );

  const filtered = sorted.filter(
    (t) =>
      t.moduleId === activeModuleId &&
      t.toolId === activeToolId &&
      (query ? t.title.toLowerCase().includes(query.toLowerCase()) : true),
  );

  const pinned = filtered.filter((t) => t.pinned);
  const recent = filtered.filter((t) => !t.pinned);

  return (
    <aside className="flex h-full flex-col border-r border-border/60 bg-sidebar/70">
      <div className="flex items-center justify-between px-4 pt-4">
        <Link to="/">
          <Logo />
        </Link>
        <Button variant="ghost" size="icon" onClick={toggleLeft} className="h-8 w-8">
          <ChevronsLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Module switcher */}
      <div className="mx-3 mt-4 grid grid-cols-2 gap-1 rounded-xl border border-border/60 bg-card/60 p-1">
        {(modules ?? []).map((m) => (
          <button
            key={m.id}
            onClick={() => !m.disabled && setModule(m.id)}
            disabled={m.disabled}
            title={m.disabled ? m.disabledReason ?? "Coming soon" : undefined}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors",
              m.disabled
                ? "cursor-not-allowed text-muted-foreground/40"
                : activeModuleId === m.id
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon name={m.icon} className="h-3.5 w-3.5" />
            {m.name}
          </button>
        ))}
      </div>

      <div className="p-3">
        <Button
          onClick={handleNewChat}
          className="w-full gap-2 gradient-primary text-primary-foreground shadow-soft"
        >
          <Plus className="h-4 w-4" /> New chat
        </Button>
      </div>

      <div className="px-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats…"
            className="h-9 pl-8 text-sm"
          />
        </div>
      </div>

      <nav className="scrollbar-thin mt-3 min-h-0 flex-1 space-y-4 overflow-y-auto px-2 pb-2">
        {pinned.length > 0 && (
          <ThreadGroup
            title="Pinned"
            items={pinned}
            activeId={activeThreadId}
            onSelect={setThread}
            onRename={handleRename}
            onArchive={handleArchive}
            onDelete={setDeleteTarget}
          />
        )}
        {folders && folders.length > 0 && (
          <div>
            <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Folders
            </p>
            <ul>
              {folders.map((f) => (
                <li key={f.id}>
                  <button className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground">
                    <span className="flex items-center gap-2">
                      <Folder className="h-3.5 w-3.5" />
                      {f.name}
                    </span>
                    <span className="text-[10px]">{f.count}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <ThreadGroup
          title="Recent"
          items={recent}
          activeId={activeThreadId}
          onSelect={setThread}
          onRename={handleRename}
          onArchive={handleArchive}
          onDelete={setDeleteTarget}
        />
        {filtered.length === 0 && (
          <p className="px-2 text-[12px] text-muted-foreground">
            {query ? "No chats match your search." : "No conversations yet — start one below."}
          </p>
        )}
      </nav>

      <div className="border-t border-border/60 p-3">
        <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/60 p-2">
          <div className="grid h-8 w-8 place-items-center rounded-full gradient-primary text-xs font-bold text-primary-foreground">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{displayName}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {currentUser?.firm ? currentUser.firm : currentUser?.plan ? `${currentUser.plan} plan` : currentUser?.email}
            </p>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSettingsOpen(true)} aria-label="Workspace settings">
            <Settings className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleLogout} aria-label="Log out">
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <WorkspaceSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.title}" will be permanently deleted. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!deleteTarget) return;
                deleteThread.mutate(deleteTarget.id, {
                  onSuccess: () => {
                    toast.success("Conversation deleted");
                    if (activeThreadId === deleteTarget.id) setThread(null);
                  },
                  onError: () => toast.error("Couldn't delete — please try again."),
                });
                setDeleteTarget(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
}

function ThreadGroup({
  title,
  items,
  activeId,
  onSelect,
  onRename,
  onArchive,
  onDelete,
}: {
  title: string;
  items: ChatThread[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onRename: (thread: ChatThread, title: string) => void;
  onArchive: (thread: ChatThread) => void;
  onDelete: (thread: ChatThread) => void;
}) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");

  if (items.length === 0) return null;

  const startRename = (t: ChatThread) => {
    setRenamingId(t.id);
    setDraftTitle(t.title);
  };

  const commitRename = (t: ChatThread) => {
    const trimmed = draftTitle.trim();
    if (trimmed && trimmed !== t.title) onRename(t, trimmed);
    setRenamingId(null);
  };

  return (
    <div>
      <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </p>
      <ul className="space-y-0.5">
        {items.map((t) => {
          const isRenaming = renamingId === t.id;
          return (
            <li key={t.id}>
              {isRenaming ? (
                <div className="flex items-center gap-1 rounded-lg px-2 py-1.5">
                  <Input
                    autoFocus
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename(t);
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                    className="h-7 flex-1 text-[13px]"
                  />
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => commitRename(t)}>
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setRenamingId(null)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => onSelect(t.id)}
                  className={cn(
                    "group flex w-full items-center justify-between gap-1 rounded-lg px-2 py-2 text-left transition-colors",
                    activeId === t.id
                      ? "bg-primary/8 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium">
                      {/* Backend title falls back to first prompt client-side until the
                          server assigns a real one, so this is never stuck on "New Chat". */}
                      {t.title}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {dayjs(t.updatedAt).format("MMM D, HH:mm")}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    {t.pinned && <Pin className="h-3 w-3" />}
                    {t.favorite && <Star className="h-3 w-3" />}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => e.stopPropagation()}
                          className="grid h-5 w-5 place-items-center rounded hover:bg-secondary"
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem onClick={() => startRename(t)}>
                          <Pencil className="mr-2 h-3.5 w-3.5" /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onArchive(t)}>
                          <Archive className="mr-2 h-3.5 w-3.5" /> Archive
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => onDelete(t)}>
                          <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}