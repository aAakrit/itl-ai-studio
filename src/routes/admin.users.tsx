/* eslint-disable prettier/prettier */
import { createFileRoute } from "@tanstack/react-router";
import { Search, Plus, Loader2, ArrowUpDown } from "lucide-react";
import {
  useAdminUsers,
  useAdminUserDetail,
  useApproveUser,
  useSuspendUser,
  useDeleteUser,
  useUpdateUser,
} from "@/hooks";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { TableSkeleton } from "@/features/admin/AdminSkeletons";
import { UserExportMenu } from "@/features/admin/users/UserExportMenu";
import { adminService } from "@/services/admin.service";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Eye,
  Pencil,
  CheckCircle,
  Ban,
  Trash2,
  History,
  CreditCard,
  KeyRound,
} from "lucide-react";
import {
  EMPTY_FILTERS,
  UserFiltersSheet,
  countActiveFilters,
  type UserFilters,
} from "@/features/admin/users/UserFiltersSheet";
import { UserDetailDialog } from "@/features/admin/users/UserDetailDialog";
import {
  accountStatusClass,
  formatDate,
  formatNumber,
  initials,
  subscriptionStatusClass,
  subscriptionStatusLabel,
} from "@/features/admin/users/admin-user-utils";
import type { AdminUser, AdminUserDetail } from "@/types/admin";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsersPage,
  head: () => ({ meta: [{ title: "Users — Admin" }] }),
});

const SORTABLE: { id: string; label: string; className?: string }[] = [
  { id: "created_at", label: "Dates" },
  { id: "email", label: "Email & Password" },
  { id: "name", label: "Name & Company" },
  { id: "status", label: "Status" },
  { id: "", label: "Mobile & Telephone" },
  { id: "", label: "Address / City / State / Pin" },
  { id: "", label: "AI Usage Limit" },
  { id: "subscription_status", label: "Status" },
];

function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<UserFilters>(EMPTY_FILTERS);
  const [sort, setSort] = useState("created_at");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  const { data, isLoading } = useAdminUsers({
    page,
    limit: 20,
    search,
    sort,
    order,
    ...filters,
  });

  const [detail, setDetail] = useState<{ id: number; tab: string } | null>(null);
  const [editUserId, setEditUserId] = useState<number | null>(null);
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const approveMutation = useApproveUser();
  const suspendMutation = useSuspendUser();
  const deleteMutation = useDeleteUser();

  const users = (data?.items ?? []) as AdminUser[];
  const total = data?.total ?? 0;
  const limit = data?.limit ?? 20;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  // Selection is cleared whenever the visible set changes underneath it
  // (new page, new filters) so "N selected" never silently refers to rows
  // that are no longer on screen.
  useEffect(() => {
    setSelected(new Set());
  }, [page, search, filters, sort, order]);

  const allOnPageSelected = users.length > 0 && users.every((u) => selected.has(u.id));
  const toggleAllOnPage = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        users.forEach((u) => next.delete(u.id));
      } else {
        users.forEach((u) => next.add(u.id));
      }
      return next;
    });
  };
  const toggleRow = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const [selectingAll, setSelectingAll] = useState(false);
  const selectAllMatching = async () => {
    setSelectingAll(true);
    try {
      const all = await adminService.getUsers({ page: 1, limit: 5000, search, sort, order, ...filters });
      setSelected(new Set((all.items as AdminUser[]).map((u) => u.id)));
    } catch {
      toast.error("Couldn't load all matching users — please try again.");
    } finally {
      setSelectingAll(false);
    }
  };

  const toggleSort = (field: string) => {
    if (!field) return;
    setPage(1);
    if (sort === field) setOrder((o) => (o === "asc" ? "desc" : "asc"));
    else {
      setSort(field);
      setOrder("asc");
    }
  };

  const handleApprove = (u: AdminUser) => {
    approveMutation.mutate(
      { id: u.id, arg: undefined },
      {
        onSuccess: () => toast.success(`${u.name} approved`),
        onError: () => toast.error("Couldn't approve this user — please try again."),
      },
    );
  };

  const handleSuspend = (u: AdminUser) => {
    suspendMutation.mutate(
      { id: u.id, arg: undefined },
      {
        onSuccess: () => toast.success(`${u.name} suspended`),
        onError: () => toast.error("Couldn't suspend this user — please try again."),
      },
    );
  };

  const handleDelete = () => {
    if (!deleteUser) return;
    deleteMutation.mutate(
      { id: deleteUser.id, arg: undefined },
      {
        onSuccess: () => {
          toast.success(`${deleteUser.name} deleted`);
          setDeleteUser(null);
        },
        onError: () => toast.error("Couldn't delete this user — please try again."),
      },
    );
  };

  return (
    <>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Accounts, subscriptions, payments and AI usage in one place.
          </p>
        </div>
        <Button
          className="gap-2 gradient-primary text-primary-foreground shadow-soft"
          disabled
          title="Not available yet — no invite endpoint exists on the backend"
        >
          <Plus className="h-4 w-4" /> Invite user
        </Button>
      </div>

      <Card className="p-5 shadow-soft">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              className="h-10 pl-9"
            />
          </div>
          <UserFiltersSheet
            filters={filters}
            onApply={(next) => {
              setPage(1);
              setFilters(next);
            }}
          />
          <Select
            value={filters.product || "all"}
            onValueChange={(v) => {
              setPage(1);
              setFilters({ ...filters, product: v === "all" ? "" : v });
            }}
          >
            <SelectTrigger className="w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All products</SelectItem>
              <SelectItem value="itl_ai">ITL AI</SelectItem>
              <SelectItem value="itl_bridge_ai">ITL Bridge AI</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={`${sort}:${order}`}
            onValueChange={(v) => {
              const [s, o] = v.split(":");
              setPage(1);
              setSort(s);
              setOrder(o as "asc" | "desc");
            }}
          >
            <SelectTrigger className="w-[190px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at:desc">Newest first</SelectItem>
              <SelectItem value="created_at:asc">Oldest first</SelectItem>
              <SelectItem value="name:asc">Name A–Z</SelectItem>
              <SelectItem value="last_login:desc">Recently active</SelectItem>
              <SelectItem value="expiry_date:asc">Expiring soonest</SelectItem>
            </SelectContent>
          </Select>
          {(search || countActiveFilters(filters) > 0) && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearch("");
                setFilters(EMPTY_FILTERS);
                setPage(1);
              }}
            >
              Reset
            </Button>
          )}
        </div>

        {selected.size > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
            <span className="font-medium">
              {selected.size} selected
              {selected.size < total && ` of ${total}`}
            </span>
            {selected.size < total && (
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                disabled={selectingAll}
                onClick={selectAllMatching}
              >
                {selectingAll ? "Selecting…" : `Select all ${total} matching`}
              </Button>
            )}
            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
                Clear
              </Button>
              <UserExportMenu userIds={Array.from(selected)} />
            </div>
          </div>
        )}

        {isLoading && !data ? (
          <TableSkeleton rows={8} cols={4} />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allOnPageSelected}
                      onCheckedChange={toggleAllOnPage}
                      aria-label="Select all on this page"
                    />
                  </TableHead>
                  {SORTABLE.map((c, i) => (
                    <TableHead key={`${c.label}-${i}`}>
                      {c.id ? (
                        <button
                          className="inline-flex items-center gap-1 hover:text-foreground"
                          onClick={() => toggleSort(c.id)}
                        >
                          {c.label}
                          <ArrowUpDown
                            className={cn(
                              "h-3 w-3",
                              sort === c.id ? "text-foreground" : "text-muted-foreground/50",
                            )}
                          />
                        </button>
                      ) : (
                        c.label
                      )}
                    </TableHead>
                  ))}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="py-14 text-center text-sm text-muted-foreground">
                      No users match these filters.
                    </TableCell>
                  </TableRow>
                )}
                {users.map((u) => {
                  const sub = u.subscription?.id ? u.subscription : null;
                  const planLabel = sub?.plan_name ?? u.plan;
                  const addressBits = [u.address, u.city, u.state, u.pin_code].filter(Boolean).join(", ");
                  const ai = u.ai_usage;
                  const aiConfigured = ai && ai.daily_limit !== null && ai.daily_limit !== undefined;
                  return (
                    <TableRow key={u.id} data-state={selected.has(u.id) ? "selected" : undefined}>
                      <TableCell>
                        <Checkbox
                          checked={selected.has(u.id)}
                          onCheckedChange={() => toggleRow(u.id)}
                          aria-label={`Select ${u.name}`}
                        />
                      </TableCell>

                      {/* Dates */}
                      <TableCell>
                        <p className="whitespace-nowrap text-xs font-medium">{formatDate(u.created_at)}</p>
                        <p className="whitespace-nowrap text-[11px] text-muted-foreground">
                          {u.last_login ? `Active ${formatDate(u.last_login)}` : "Never logged in"}
                        </p>
                      </TableCell>

                      {/* Email & Password */}
                      <TableCell>
                        <p className="max-w-[200px] truncate text-sm">{u.email}</p>
                        <button
                          className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                          onClick={() => setEditUserId(u.id)}
                          title="Password is hashed and can't be viewed — set a new one from Edit"
                        >
                          <KeyRound className="h-3 w-3" /> •••••••• · Reset
                        </button>
                      </TableCell>

                      {/* Name & Company */}
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full gradient-primary text-[10px] font-bold text-primary-foreground">
                            {initials(u.name)}
                          </div>
                          <div className="min-w-0">
                            <button
                              className="truncate text-sm font-medium hover:underline"
                              onClick={() => setDetail({ id: u.id, tab: "overview" })}
                              title="View user"
                            >
                              {u.name}
                            </button>
                            <p className="truncate text-[11px] text-muted-foreground">{u.firm ?? "—"}</p>
                            <Badge variant="outline" className="mt-1 px-1.5 py-0 text-[10px] font-normal">
                              {u.product === "itl_bridge_ai" ? "ITL Bridge AI" : "ITL AI"}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>

                      {/* Status (account) */}
                      <TableCell>
                        <Badge className={cn("capitalize", accountStatusClass(u.status))}>{u.status}</Badge>
                        <p className="mt-1 text-[11px] capitalize text-muted-foreground">{u.role}</p>
                      </TableCell>

                      {/* Mobile & Telephone */}
                      <TableCell>
                        <p className="whitespace-nowrap text-sm">{u.mobile ?? "—"}</p>
                        <p className="whitespace-nowrap text-[11px] text-muted-foreground">{u.telephone ?? "—"}</p>
                      </TableCell>

                      {/* Address / City / State / Pin */}
                      <TableCell>
                        <p className="max-w-[220px] truncate text-sm">{addressBits || "—"}</p>
                      </TableCell>

                      {/* AI Usage Limit */}
                      <TableCell>
                        {aiConfigured ? (
                          <span className="whitespace-nowrap text-xs">
                            {formatNumber(ai!.daily_used)} / {formatNumber(ai!.daily_limit)} daily
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Not configured</span>
                        )}
                      </TableCell>

                      {/* Status (subscription + plan) */}
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {planLabel ?? "No plan"}
                        </Badge>
                        {sub ? (
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <Badge className={subscriptionStatusClass(sub.status)}>
                              {subscriptionStatusLabel(sub.status)}
                            </Badge>
                            {sub.expiry_date && (
                              <span className="whitespace-nowrap text-[11px] text-muted-foreground">
                                exp. {formatDate(sub.expiry_date)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className="mt-1 text-[11px] text-muted-foreground">No subscription</p>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setDetail({ id: u.id, tab: "overview" })}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDetail({ id: u.id, tab: "subscription" })}
                            >
                              <CreditCard className="mr-2 h-4 w-4" />
                              Subscription
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditUserId(u.id)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            {["PENDING", "SUSPENDED"].includes(u.status) && (
                              <DropdownMenuItem onClick={() => handleApprove(u)}>
                                <CheckCircle className="mr-2 h-4 w-4 text-success" />
                                Approve
                              </DropdownMenuItem>
                            )}
                            {u.status === "APPROVED" && (
                              <DropdownMenuItem onClick={() => handleSuspend(u)}>
                                <Ban className="mr-2 h-4 w-4 text-warning" />
                                Suspend account
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteUser(u)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem onClick={() => setDetail({ id: u.id, tab: "activity" })}>
                              <History className="mr-2 h-4 w-4" />
                              Activity
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Page {page} of {totalPages} · {total} users
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {detail && (
        <UserDetailDialog
          key={`${detail.id}-${detail.tab}`}
          userId={detail.id}
          defaultTab={detail.tab}
          onOpenChange={(open) => !open && setDetail(null)}
        />
      )}
      <EditUserDialog userId={editUserId} onOpenChange={(open) => !open && setEditUserId(null)} />

      <AlertDialog open={!!deleteUser} onOpenChange={(open) => !open && setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteUser?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This soft-deletes the account — they'll immediately lose access. This can be reversed by an admin later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/**
 * Editing user fields only. Subscription plan is deliberately read-only here —
 * plan changes go through the Subscription APIs, never PUT /admin/users.
 */
function EditUserDialog({
  userId,
  onOpenChange,
}: {
  userId: number | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { data, isLoading } = useAdminUserDetail(userId);
  const user = data as AdminUserDetail | undefined;
  const updateMutation = useUpdateUser();
  const [form, setForm] = useState<Partial<AdminUserDetail>>({});
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (user) setForm(user);
    setNewPassword("");
  }, [user]);

  const set = <K extends keyof AdminUserDetail>(key: K, value: AdminUserDetail[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = () => {
    if (!userId) return;
    updateMutation.mutate(
      {
        id: userId,
        arg: {
          name: form.name,
          firm: form.firm,
          mobile: form.mobile,
          telephone: form.telephone,
          gstin: form.gstin,
          address: form.address,
          city: form.city,
          state: form.state,
          pin_code: form.pin_code,
          is_admin: form.is_admin,
          is_staff: form.is_staff,
          ...(newPassword.trim() ? { password: newPassword.trim() } : {}),
        },
      },
      {
        onSuccess: () => {
          toast.success(newPassword.trim() ? "User updated and password reset" : "User updated");
          setNewPassword("");
          onOpenChange(false);
        },
        onError: () => toast.error("Couldn't save changes — please try again."),
      },
    );
  };

  return (
    <Dialog open={userId != null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit user</DialogTitle>
          <DialogDescription>{user?.email}</DialogDescription>
        </DialogHeader>
        {isLoading && !user ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-border/60 bg-secondary/30 px-3 py-2 text-xs">
              <span className="text-muted-foreground">Current plan: </span>
              <span className="font-medium">
                {user?.subscription?.plan_name ?? user?.plan ?? "No subscription"}
              </span>
              <p className="mt-0.5 text-muted-foreground">
                Plan changes are made in the user's Subscription tab.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="firm">Firm</Label>
                <Input id="firm" value={form.firm ?? ""} onChange={(e) => set("firm", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="mobile">Mobile</Label>
                <Input id="mobile" value={form.mobile ?? ""} onChange={(e) => set("mobile", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="telephone">Telephone</Label>
                <Input id="telephone" value={form.telephone ?? ""} onChange={(e) => set("telephone", e.target.value)} />
              </div>
              <div className="col-span-2">
                <Label htmlFor="gstin">GSTIN</Label>
                <Input
                  id="gstin"
                  placeholder="e.g. 22AAAAA0000A1Z5"
                  className="uppercase"
                  value={form.gstin ?? ""}
                  onChange={(e) => set("gstin", e.target.value.toUpperCase())}
                />
              </div>
              <div className="col-span-2 space-y-1.5 rounded-lg border border-border/60 bg-secondary/30 p-3">
                <Label htmlFor="new-password">Reset password</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Leave blank to keep the current password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">
                  Passwords are hashed and can't be viewed — this sets a new one. The user isn't notified automatically.
                </p>
              </div>
              <div className="col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" value={form.city ?? ""} onChange={(e) => set("city", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input id="state" value={form.state ?? ""} onChange={(e) => set("state", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="pin">PIN Code</Label>
                <Input id="pin" value={form.pin_code ?? ""} onChange={(e) => set("pin_code", e.target.value)} />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
              <Label htmlFor="is_admin" className="text-sm font-normal">Admin access</Label>
              <Switch id="is_admin" checked={!!form.is_admin} onCheckedChange={(v) => set("is_admin", v)} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
              <Label htmlFor="is_staff" className="text-sm font-normal">Staff access</Label>
              <Switch id="is_staff" checked={!!form.is_staff} onCheckedChange={(v) => set("is_staff", v)} />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={updateMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending || isLoading} className="gap-1.5">
            {updateMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
