/* eslint-disable prettier/prettier */
import type { LucideProps } from "lucide-react";
import {
  AlertTriangle, AlignLeft, BarChart3, Bell, BookOpen, Boxes, Building2, Circle, Clock,
  CreditCard, Download, FileCode, FileText, FileWarning, Flag, Gavel, HelpCircle, Home,
  Image, Info, KeyRound, Landmark, Layers, LayoutDashboard, LayoutTemplate, Mail, Menu,
  MessageSquare, MessagesSquare, Palette, PenLine, Pencil, Plus, Receipt, Scale, ScanLine,
  ScrollText, Search, Send, Settings, Shield, ShieldCheck, Sparkles, Sun, Upload, User,
  Users, Wallet,
} from "lucide-react";

/**
 * PERF: icon names come from CMS/API data, so this component keeps a
 * dynamic-by-name API but resolves against an explicit map of the icons the app
 * actually ships.
 *
 * It deliberately does NOT fall back to `lucide-react/dynamic`: that module
 * references the entire icon set (a ~240KB dependency map plus ~1500 one-icon
 * chunks), which both exploded the number of HTTP requests and defeated vendor
 * chunk grouping. Unknown names render a neutral `Circle` placeholder — add the
 * icon to the map below when the CMS starts using a new one.
 */
const ICONS: Record<string, React.ComponentType<LucideProps>> = {
  AlertTriangle, AlignLeft, BarChart3, Bell, BookOpen, Boxes, Building2, Circle, Clock,
  CreditCard, Download, FileCode, FileText, FileWarning, Flag, Gavel, HelpCircle, Home,
  Image, Info, KeyRound, Landmark, Layers, LayoutDashboard, LayoutTemplate, Mail, Menu,
  MessageSquare, MessagesSquare, Palette, PenLine, Pencil, Plus, Receipt, Scale, ScanLine,
  ScrollText, Search, Send, Settings, Shield, ShieldCheck, Sparkles, Sun, Upload, User,
  Users, Wallet,
};

export function Icon({ name, ...props }: { name: string } & LucideProps) {
  const Known = ICONS[name] ?? Circle;
  return <Known {...props} />;
}
