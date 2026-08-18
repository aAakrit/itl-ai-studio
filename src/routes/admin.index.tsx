/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prettier/prettier */
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowUpRight, TrendingUp } from "lucide-react";
import { useAdminMetrics, useAdminUsers } from "@/hooks";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { MetricCardsSkeleton } from "@/features/admin/AdminSkeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
  head: () => ({ meta: [{ title: "Dashboard — Admin" }] }),
});

function AdminDashboard() {
  const { data: metrics, isLoading: metricsLoading } = useAdminMetrics();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [plan, setPlan] = useState("");
  const [sort, setSort] = useState("created_at");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const {data: users, isLoading: usersLoading, } = useAdminUsers({page,limit: 10,search,role,status,plan,sort, order,});
  return (
    <>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of platform usage, subscriptions and health.
        </p>
      </div>

      {metricsLoading && !metrics ? <MetricCardsSkeleton /> : (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {(metrics ?? []).map((m, i) => (
          <motion.div
            key={m.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="p-5 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {m.label}
              </p>
              <div className="mt-3 flex items-baseline justify-between">
                <p className="font-display text-3xl font-bold tracking-tight">{m.value}</p>
                <span
                  className={cn(
                    "flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
                    m.delta >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
                  )}
                >
                  <TrendingUp className="h-3 w-3" />
                  {m.delta >= 0 ? "+" : ""}
                  {m.delta}%
                </span>
              </div>
              <svg viewBox="0 0 100 30" className="mt-3 h-8 w-full">
                <polyline
                  fill="none"
                  stroke="var(--color-primary)"
                  strokeWidth="1.5"
                  points={m.trend
                    .map((v, i, arr) => {
                      const max = Math.max(...arr);
                      const min = Math.min(...arr);
                      const x = (i / (arr.length - 1)) * 100;
                      const y = 30 - ((v - min) / (max - min || 1)) * 26 - 2;
                      return `${x},${y}`;
                    })
                    .join(" ")}
                />
              </svg>
            </Card>
          </motion.div>
        ))}
      </div>
      )}



      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <Card className="p-5 shadow-soft lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Recent users</h2>
              <p className="text-xs text-muted-foreground">Latest signups and status</p>
            </div>
            <button className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
              View all <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Last Logged In At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersLoading && !users
                ? Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div className="space-y-1.5">
                            <Skeleton className="h-3.5 w-28" />
                            <Skeleton className="h-2.5 w-40" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="ml-auto h-3 w-20" /></TableCell>
                    </TableRow>
                  ))
                : (users?.items ?? []).slice(0, 6).map((u: any) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-8 w-8 place-items-center rounded-full gradient-primary text-[11px] font-bold text-primary-foreground">
                        {u.name.split(" ").slice(-1)[0][0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{u.name}</p>
                        <p className="text-[11px] text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{u.plan}</Badge></TableCell>
                  <TableCell className="capitalize text-sm">{u.role}</TableCell>
                  <TableCell>
                    <Badge
                      className={cn(
                        "capitalize",
                        u.status === "APPROVED" && "bg-success/10 text-success hover:bg-success/10",
                        u.status === "PENDING" && "bg-info/10 text-info hover:bg-info/10",
                        u.status === "SUSPENDED" && "bg-destructive/10 text-destructive hover:bg-destructive/10",
                        u.status === "DELETED" && "bg-destructive/10 text-destructive hover:bg-destructive/10",
                      )}
                    >
                      {u.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">{u.last_login}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card className="p-5 shadow-soft">
          <h2 className="text-base font-semibold">Plan distribution</h2>
          <p className="text-xs text-muted-foreground">Across active workspaces</p>
          <div className="mt-6 space-y-4">
            {[
              { label: "Free", value: 42, color: "var(--color-muted-foreground)" },
              { label: "Professional", value: 48, color: "var(--color-primary)" },
              { label: "Firm / Enterprise", value: 10, color: "var(--color-accent)" },
            ].map((row) => (
              <div key={row.label}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium">{row.label}</span>
                  <span className="text-muted-foreground">{row.value}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full" style={{ width: `${row.value}%`, background: row.color }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
