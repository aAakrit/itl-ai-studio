/* eslint-disable prettier/prettier */
import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/common/Logo";
import { motion } from "framer-motion";

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  variant = "ai",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** "bridge" keeps the same layout with ITL Bridge AI branding. */
  variant?: "ai" | "bridge";
}) {
  const bridge = variant === "bridge";
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="flex flex-col justify-between p-8 md:p-12">
        <Link to={bridge ? "/bridge" : "/"}>
          <Logo />
        </Link>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mx-auto w-full max-w-md py-12"
        >
          {bridge && (
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              ITL Bridge AI
            </div>
          )}
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
        </motion.div>
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} ITL AI</p>
      </div>
      <div className="relative hidden overflow-hidden gradient-hero lg:block">
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="glass-strong max-w-lg rounded-3xl p-8 shadow-float">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">
              {bridge ? "ITL Bridge AI" : "ITL AI"}
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
              {bridge ? "Your Tax Knowledge. Your AI." : "The AI copilot for Indian tax professionals."}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {bridge
                ? "Connect Income Tax Library with ChatGPT, Claude, Gemini and other compatible AI assistants — and bring trusted Indian tax research into the AI you already use."
                : "Research Income Tax and GST law, draft notice replies, and summarize tribunal orders — all grounded in verifiable citations."}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 text-xs">
              {(bridge
                ? ["ChatGPT", "Claude", "Gemini", "ITL research"]
                : ["180K+ case laws", "42K+ circulars", "83% time saved", "1,200+ firms"]
              ).map((s) => (
                <div key={s} className="rounded-xl border border-border/60 bg-card/60 px-3 py-2 font-medium">
                  {s}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
