/* eslint-disable prettier/prettier */
import type { AdminMetric, AdminUser } from "@/types";

export const adminMetrics: AdminMetric[] = [
  { key: "mrr", label: "MRR", value: "₹18.4L", delta: 12.6, trend: [8, 10, 9, 12, 14, 13, 16, 18] },
  { key: "users", label: "Active users", value: "3,284", delta: 8.1, trend: [1200, 1500, 1800, 2100, 2400, 2700, 3000, 3284] },
  { key: "queries", label: "Queries / day", value: "42,910", delta: 22.4, trend: [10, 14, 18, 22, 26, 30, 36, 42] },
  { key: "csat", label: "CSAT", value: "4.8 / 5", delta: 1.2, trend: [4.4, 4.5, 4.5, 4.6, 4.7, 4.7, 4.8, 4.8] },
];


export const adminNav = [
  { section: "Overview", items: [
    { label: "Dashboard", to: "/admin", icon: "LayoutDashboard" },
    { label: "Analytics", to: "/admin/analytics", icon: "BarChart3" },
  ]},
  { section: "Management", items: [
    { label: "Users", to: "/admin/users", icon: "Users" },
    // { label: "Roles", to: "/admin/roles", icon: "ShieldCheck" },
    // { label: "Permissions", to: "/admin/permissions", icon: "KeyRound" },
    { label: "Subscriptions", to: "/admin/subscriptions", icon: "CreditCard" },
    { label: "ITL Bridge AI", to: "/admin/bridge", icon: "Sparkles" },
  ]},
  { section: "Content", items: [
    { label: "CMS", to: "/admin/cms", icon: "FileText" },
    { label: "Page Builder", to: "/admin/pages", icon: "LayoutTemplate" },
    { label: "Content", to: "/admin/content", icon: "FileText" },
    { label: "Knowledge Base", to: "/admin/knowledge", icon: "BookOpen" },
    // { label: "Media Library", to: "/admin/media", icon: "Image" },
    // { label: "Email Templates", to: "/admin/email-templates", icon: "Mail" },
    // { label: "Document Templates", to: "/admin/doc-templates", icon: "FileCode" },
    // { label: "Prompt Templates", to: "/admin/prompt-templates", icon: "Sparkles" },
  ]},
  { section: "Platform", items: [
    // { label: "Navigation", to: "/admin/navigation", icon: "Menu" },
    // { label: "Feature Flags", to: "/admin/features", icon: "Flag" },
    { label: "Workspace Settings", to: "/admin/workspace-settings", icon: "Boxes" },
    { label: "Notifications", to: "/admin/notifications", icon: "Bell" },
    // { label: "AI Settings", to: "/admin/ai", icon: "Sparkles" },
    // { label: "SEO", to: "/admin/seo", icon: "Search" },
    // { label: "Theme", to: "/admin/theme", icon: "Palette" },
    // { label: "System", to: "/admin/system", icon: "Settings" },
    { label: "Audit Logs", to: "/admin/audit", icon: "ScrollText" },
    { label: "Logs", to: "/admin/logs", icon: "ScrollText" },
  ]},
];
