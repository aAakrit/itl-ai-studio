/* eslint-disable prettier/prettier */
import { Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Sparkles,
  Check,
  X,
  ChevronDown,
  Quote,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/common/Icon";
import { cn } from "@/lib/utils";
import type {
  HeroData,
  FeatureItem,
  Testimonial,
  PainPoint,
  ProductShowcase,
  ComparisonRow,
  TrustSource,
  LogoItem,
} from "@/types";
import {
  useCurrentUser,
  useIsAuthenticated,
} from "@/hooks/useAuth";

/* ---------------------------------- Shared ---------------------------------- */

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "center",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={cn("mb-14 max-w-2xl", align === "center" ? "mx-auto text-center" : "text-left")}>
      {eyebrow && (
        <div className={cn("mb-3 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-primary backdrop-blur")}>
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          {eyebrow}
        </div>
      )}
      <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">{title}</h2>
      {subtitle && <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

/* ------------------------------------ Hero ---------------------------------- */

function Typewriter({ items }: { items: string[] }) {
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<"typing" | "pausing" | "deleting">("typing");

  useEffect(() => {
    const current = items[idx % items.length];
    if (phase === "typing") {
      if (text.length < current.length) {
        const t = setTimeout(() => setText(current.slice(0, text.length + 1)), 28);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setPhase("deleting"), 1600);
      return () => clearTimeout(t);
    }
    if (phase === "deleting") {
      if (text.length > 0) {
        const t = setTimeout(() => setText(text.slice(0, -1)), 14);
        return () => clearTimeout(t);
      }
      setPhase("typing");
      setIdx((i) => i + 1);
    }
  }, [text, phase, idx, items]);

  return (
    <span className="font-mono text-sm text-foreground">
      {text}
      <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 bg-primary animate-pulse-dot" />
    </span>
  );
}

export function Hero({ data }: { data: HeroData }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 80]);

  return (
    <section ref={ref} className="relative overflow-hidden">
      {/* Ambient background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 gradient-hero" />
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-24 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute right-0 top-40 h-[28rem] w-[28rem] rounded-full bg-accent/15 blur-3xl" />
        <svg className="absolute inset-0 h-full w-full opacity-[0.035]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M40 0H0V40" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative mx-auto max-w-7xl px-6 pt-24 md:pt-32">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="mx-auto max-w-4xl text-center"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/70 px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-soft backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            {data.eyebrow}
          </div>
          <h1 className="font-display text-5xl font-bold leading-[1.02] tracking-tight text-foreground md:text-7xl lg:text-[5.5rem]">
            {data.title}{" "}
            <span className="text-gradient">{data.highlight}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            {data.subtitle}
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="h-12 gap-2 rounded-xl px-6 gradient-primary text-primary-foreground shadow-float">
              <Link to={data.primaryCta.to}>
                {data.primaryCta.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-xl px-6 backdrop-blur">
              <Link to={data.secondaryCta.to}>{data.secondaryCta.label}</Link>
            </Button>
          </div>
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex -space-x-1">
              {[1, 2, 3].map((i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-warning text-warning" />
              ))}
              <Star className="h-3.5 w-3.5 fill-warning text-warning" />
              <Star className="h-3.5 w-3.5 fill-warning text-warning" />
            </span>
            <span>Trusted by 1,200+ Indian tax professionals</span>
          </div>
        </motion.div>

        {/* Product preview */}
        <motion.div
          style={{ y }}
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mx-auto mt-20 max-w-5xl"
        >
          <div className="glass-strong rounded-3xl p-2 shadow-float">
            <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
              <div className="flex items-center gap-1.5 border-b border-border/60 bg-surface-2/60 px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
                <span className="ml-3 truncate text-[11px] font-mono text-muted-foreground">itl.ai / workspace / income-tax</span>
                <span className="ml-auto hidden items-center gap-1.5 text-[10px] font-medium text-muted-foreground sm:inline-flex">
                  <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-dot" />
                  Live
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] text-left">
                <div className="hidden border-r border-border/60 bg-surface-2/30 p-3 text-xs md:block">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Modules</p>
                  {[
                    { name: "Income Tax", active: true, icon: "Scale" as const },
                    { name: "GST", active: false, icon: "Landmark" as const },
                    { name: "Case Law", active: false, icon: "Gavel" as const },
                  ].map((m) => (
                    <div key={m.name} className={cn("mb-1 flex items-center gap-2 rounded-md px-2 py-1.5", m.active ? "bg-primary/10 text-primary" : "text-muted-foreground")}>
                      <Icon name={m.icon} className="h-3.5 w-3.5" />
                      {m.name}
                    </div>
                  ))}
                  <p className="mb-2 mt-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Recent</p>
                  {["Reassessment u/s 148", "ITC on credit notes", "s.56(2)(x) HUF gift"].map((t) => (
                    <div key={t} className="mb-1 truncate rounded-md px-2 py-1.5 text-muted-foreground">
                      {t}
                    </div>
                  ))}
                </div>
                <div className="space-y-3 p-4 md:p-5">
                  <div className="ml-auto max-w-xs rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-xs text-primary-foreground">
                    What's the limitation for reopening under s.148?
                  </div>
                  <div className="max-w-lg rounded-2xl rounded-bl-sm border border-border/60 bg-surface p-3.5 text-xs leading-relaxed">
                    Under the amended regime effective 1 April 2021, notice under s.148 may be issued within{" "}
                    <span className="font-semibold text-foreground">3 years</span> from the end of the assessment year — extended to{" "}
                    <span className="font-semibold text-foreground">10 years</span> where escaped income is ₹50 lakh or more.
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {[
                        { label: "s.147 IT Act", kind: "act" },
                        { label: "s.149 IT Act", kind: "act" },
                        { label: "Ashish Agarwal, SC", kind: "case" },
                        { label: "CBDT Instruction 1/2022", kind: "circ" },
                      ].map((c) => (
                        <span key={c.label} className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-card px-1.5 py-0.5 text-[10px] font-medium">
                          <span className={cn("h-1.5 w-1.5 rounded-full", c.kind === "act" ? "bg-primary" : c.kind === "case" ? "bg-accent" : "bg-info")} />
                          {c.label}
                        </span>
                      ))}
                    </div>
                  </div>
                  {/* Prompt bar */}
                  <div className="mt-3 flex items-center gap-2 rounded-xl border border-border/60 bg-surface px-3 py-2.5">
                    <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />
                    {data.typewriter && data.typewriter.length > 0 ? (
                      <Typewriter items={data.typewriter} />
                    ) : (
                      <span className="text-xs text-muted-foreground">Ask a question…</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating badges */}
          <div className="pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="absolute -left-2 top-1/2 hidden -translate-y-1/2 lg:block"
            >
              <div className="glass rounded-xl px-3 py-2 shadow-soft">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Grounded</p>
                <p className="text-xs font-semibold">100% cited</p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
              className="absolute -right-2 top-1/3 hidden lg:block"
            >
              <div className="glass rounded-xl px-3 py-2 shadow-soft">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Latency</p>
                <p className="text-xs font-semibold">1.8s avg</p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-2 gap-6 md:grid-cols-4">
          {data.stats.map((s, i) => (
            <motion.div
              key={`${s.label}-${i}`}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="text-center"
            >
              <p className="font-display text-3xl font-bold text-gradient md:text-4xl">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="mt-16 flex justify-center">
          <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
            <span>Scroll to explore</span>
            <ChevronDown className="h-4 w-4 animate-bounce" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------- LogoStrip -------------------------------- */

export function LogoStrip({ items }: { items: LogoItem[] }) {
  return (
    <section className="border-y border-border/60 bg-surface-2/40">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <p className="text-center text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Trusted by professionals at leading firms
        </p>
        <div className="mt-6 grid grid-cols-2 items-center gap-6 sm:grid-cols-4 md:grid-cols-8">
          {items.map((l, i) => (
            <div
              key={`${l.name}-${i}`}
              className="flex items-center justify-center text-center font-display text-base font-semibold tracking-tight text-muted-foreground/80 grayscale transition-all hover:text-foreground hover:grayscale-0 md:text-lg"
            >
              {l.name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------- Problem --------------------------------- */

export function ProblemSection({ items }: { items: PainPoint[] }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <SectionHeader
        eyebrow="The problem"
        title="Legal research eats the day."
        subtitle="Every tax professional we spoke to described the same afternoon — tabs, PDFs, and a slow Ctrl-F across scanned judgments."
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {items.map((p, i) => (
          <motion.div
            key={`${p.title}-${i}`}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.35, delay: i * 0.05 }}
            className="group relative rounded-2xl border border-border/60 bg-card p-6 shadow-soft transition hover:-translate-y-0.5 hover:shadow-elevated"
          >
            <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-destructive/8 text-destructive">
              <Icon name={p.icon} className="h-5 w-5" />
            </div>
            <h3 className="font-display text-lg font-semibold tracking-tight">{p.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* --------------------------------- Solution --------------------------------- */

export function SolutionSection({ steps }: { steps: { icon: string; title: string; body: string }[] }) {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-7xl px-6 py-24">
        <SectionHeader
          eyebrow="The solution"
          title="One AI workspace. Every tax task."
          subtitle="ITL AI collapses research, drafting, summarizing and replying into a single, grounded workflow."
        />
        <div className="grid gap-4 md:grid-cols-5">
          {steps.map((s, i) => (
            <motion.div
              key={`${s.title}-${i}`}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.06 }}
              className="relative rounded-2xl border border-border/60 bg-card p-5 shadow-soft"
            >
              <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl gradient-primary text-primary-foreground">
                <Icon name={s.icon} className="h-5 w-5" />
              </div>
              <h3 className="font-display text-base font-semibold tracking-tight">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
              {i < steps.length - 1 && (
                <ArrowRight className="absolute -right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-muted-foreground/40 md:block" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- WorkspaceShowcase ---------------------------- */

export function WorkspaceShowcase() {
  return (
    <section id="workspace" className="mx-auto max-w-7xl px-6 py-24">
      <SectionHeader
        eyebrow="The workspace"
        title="Where a tax professional's day happens."
        subtitle="A single canvas for asking, researching, drafting and exporting — with citations at every step."
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="glass-strong rounded-3xl p-2 shadow-float"
      >
        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
          <div className="flex items-center gap-1.5 border-b border-border/60 bg-surface-2/60 px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
            <span className="ml-3 text-[11px] font-mono text-muted-foreground">workspace / notice-reply / DRC-01</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_260px]">
            <div className="hidden border-r border-border/60 bg-surface-2/30 p-4 text-xs lg:block">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Threads</p>
              {["s.148 Reassessment", "DRC-01 reply", "ITC reversal — s.17(5)", "Cap gains — unlisted"].map((t, i) => (
                <div key={t} className={cn("mb-1 truncate rounded-md px-2 py-1.5", i === 1 ? "bg-primary/10 text-primary" : "text-muted-foreground")}>
                  {t}
                </div>
              ))}
            </div>
            <div className="min-h-[380px] space-y-3 p-5">
              <div className="ml-auto max-w-md rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-xs text-primary-foreground">
                Draft a reply to attached GST DRC-01 alleging ITC on ineligible services.
              </div>
              <div className="rounded-2xl rounded-bl-sm border border-border/60 bg-surface p-4 text-xs leading-relaxed">
                <p className="font-semibold text-foreground">Reply structure — grounds-wise</p>
                <ol className="mt-2 list-decimal space-y-1 pl-4 text-muted-foreground">
                  <li>Preliminary objection — proper officer jurisdiction under s.73</li>
                  <li>ITC availed complies with s.16 read with r.36</li>
                  <li>Alleged ineligibility under s.17(5) rebutted with facts</li>
                  <li>Reliance on Safari Retreats (SC), 2024</li>
                </ol>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {["s.16 CGST", "s.17(5)", "r.36(4)", "Safari Retreats SC", "Circular 183/15/2022"].map((c) => (
                    <span key={c} className="rounded-md border border-border/60 bg-card px-1.5 py-0.5 text-[10px] font-medium">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="hidden border-l border-border/60 bg-surface-2/30 p-4 text-xs lg:block">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Citations</p>
              {[
                { t: "Safari Retreats", s: "SC · 2024" },
                { t: "Circular 183/2022", s: "CBIC" },
                { t: "s.17(5) CGST", s: "Statute" },
                { t: "r.36(4) CGST", s: "Rule" },
              ].map((c) => (
                <div key={c.t} className="mb-2 rounded-lg border border-border/60 bg-card p-2">
                  <p className="text-[11px] font-semibold text-foreground">{c.t}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{c.s}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

/* ---------------------------- ProductShowcaseRow ---------------------------- */

function DemoVisual({ demo }: { demo: ProductShowcase["demo"] }) {
  const common = "rounded-2xl border border-border/60 bg-card p-5 shadow-elevated";
  if (demo === "chat") {
    return (
      <div className={common}>
        <div className="ml-auto mb-2 max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-xs text-primary-foreground">
          Are HUF gifts to members taxable under s.56(2)(x)?
        </div>
        <div className="max-w-[92%] rounded-2xl rounded-bl-sm border border-border/60 bg-surface p-3 text-xs leading-relaxed text-muted-foreground">
          No — a gift from an HUF to its member is expressly outside the ambit of s.56(2)(x) under proviso (VII)…
          <div className="mt-2 flex flex-wrap gap-1">
            <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px]">s.56(2)(x)</span>
            <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px]">Vineetkumar Raghavjibhai Bhalodia, ITAT</span>
          </div>
        </div>
      </div>
    );
  }
  if (demo === "research") {
    return (
      <div className={common}>
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-border/60 bg-surface px-3 py-2 text-xs">
          <Icon name="Search" className="h-3.5 w-3.5 text-primary" />
          <span className="text-muted-foreground">Reassessment beyond 4 years without new material</span>
        </div>
        {["Ashish Agarwal — SC (2022)", "Rajeev Bansal — SC (2024)", "Anshul Jain — HC (2023)"].map((r, i) => (
          <div key={r} className={cn("mb-2 rounded-lg border border-border/60 p-2.5", i === 0 ? "bg-primary/5" : "bg-surface")}>
            <p className="text-[11px] font-semibold">{r}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">Reassessment · s.147/148 · Reopening</p>
          </div>
        ))}
      </div>
    );
  }
  if (demo === "notice") {
    return (
      <div className={common}>
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-dashed border-border/70 bg-surface-2/50 px-3 py-3 text-xs">
          <Icon name="FileText" className="h-4 w-4 text-primary" />
          <div>
            <p className="font-semibold">DRC-01_reply.pdf</p>
            <p className="text-[10px] text-muted-foreground">Uploaded · 3 pages</p>
          </div>
        </div>
        <div className="space-y-1.5 text-xs">
          {["Extracting demand…", "Identifying grounds…", "Retrieving precedents…", "Draft ready"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn("grid h-4 w-4 place-items-center rounded-full", i < 3 ? "bg-success text-primary-foreground" : "bg-primary text-primary-foreground")}>
                <Check className="h-2.5 w-2.5" />
              </div>
              <span className="text-muted-foreground">{s}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (demo === "draft") {
    return (
      <div className={common}>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-lg border border-border/60 bg-surface p-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Original</p>
            <p className="mt-1.5 leading-relaxed text-muted-foreground">
              The assessee humbly submits that reassessment is bad in law because there is no new material.
            </p>
          </div>
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">Improved</p>
            <p className="mt-1.5 leading-relaxed">
              The reassessment lacks jurisdictional foundation — no fresh tangible material exists, as required under
              <span className="font-semibold"> Kelvinator (SC) </span> and reaffirmed in
              <span className="font-semibold"> Ashish Agarwal (SC)</span>.
            </p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className={common}>
      <div className="mb-3 flex items-center gap-2 text-xs">
        <Icon name="Sparkles" className="h-3.5 w-3.5 text-primary" />
        <span className="font-semibold">Ashish Agarwal v. UOI — 60-second brief</span>
      </div>
      <div className="space-y-2 text-xs">
        {[
          { k: "Issue", v: "Validity of s.148 notices issued between 1 Apr–30 Jun 2021 under old regime." },
          { k: "Holding", v: "Notices deemed issued under new regime u/s 148A." },
          { k: "Ratio", v: "Procedural fairness reconciled with legislative intent." },
        ].map((row) => (
          <div key={row.k} className="rounded-lg border border-border/60 bg-surface p-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">{row.k}</p>
            <p className="mt-0.5 leading-relaxed text-muted-foreground">{row.v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProductShowcaseSection({ items }: { items: ProductShowcase[] }) {
  return (
    <section id="product" className="mx-auto max-w-7xl px-6 py-24">
      <SectionHeader
        eyebrow="Product tour"
        title="Every module, engineered for practice."
        subtitle="Five modules built for CAs and advocates — each grounded in Indian tax law and shipped after design partner reviews."
      />
      <div className="space-y-24">
        {items.map((s, i) => {
          const reverse = i % 2 === 1;
          return (
            <div key={s.id} id={s.id} className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
              <motion.div
                initial={{ opacity: 0, x: reverse ? 24 : -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.45 }}
                className={cn(reverse ? "lg:order-2" : "")}
              >
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-primary">
                  <Icon name={s.icon} className="h-3.5 w-3.5" />
                  {s.eyebrow}
                </div>
                <h3 className="font-display text-3xl font-bold tracking-tight md:text-4xl">{s.title}</h3>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">{s.body}</p>
                <ul className="mt-6 space-y-2.5">
                  {s.bullets.map((b, bi) => (
                    <li key={`${b}-${bi}`} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild className="mt-7 h-11 rounded-xl gradient-primary text-primary-foreground shadow-soft">
                  <Link to={s.cta.to}>
                    {s.cta.label}
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className={cn("relative", reverse ? "lg:order-1" : "")}
              >
                <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-primary/10 via-accent/10 to-transparent blur-2xl" />
                <div className="glass-strong rounded-3xl p-2 shadow-float">
                  <DemoVisual demo={s.demo} />
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* --------------------------------- Comparison ------------------------------- */

function Cell({ v }: { v: string | boolean }) {
  if (v === true) return <Check className="mx-auto h-4 w-4 text-success" />;
  if (v === false) return <X className="mx-auto h-4 w-4 text-muted-foreground/40" />;
  return <span className="text-xs text-muted-foreground">{v}</span>;
}

export function ComparisonSection({ rows }: { rows: ComparisonRow[] }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <SectionHeader
        eyebrow="Why ITL AI"
        title="Not ChatGPT. Not Google. Not manual."
        subtitle="A tax-native workspace beats general tools on every dimension that matters to a professional."
      />
      <div className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-soft">
        <div className="grid grid-cols-[1.4fr_repeat(4,1fr)] items-center gap-2 border-b border-border/60 bg-surface-2/40 px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          <span>Capability</span>
          <span className="text-center">Manual</span>
          <span className="text-center">Google</span>
          <span className="text-center">ChatGPT</span>
          <span className="text-center text-primary">ITL AI</span>
        </div>
        {rows.map((r, i) => (
          <div
            key={`${r.capability}-${i}`}
            className={cn(
              "grid grid-cols-[1.4fr_repeat(4,1fr)] items-center gap-2 px-5 py-3.5 text-sm",
              i % 2 === 1 && "bg-surface-2/20",
              "border-b border-border/40 last:border-b-0",
            )}
          >
            <span className="text-foreground">{r.capability}</span>
            <div className="text-center"><Cell v={r.manual} /></div>
            <div className="text-center"><Cell v={r.google} /></div>
            <div className="text-center"><Cell v={r.chatgpt} /></div>
            <div className="rounded-lg bg-primary/5 py-1 text-center"><Cell v={r.itl} /></div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* --------------------------------- Workflow --------------------------------- */

export function WorkflowSection({ steps }: { steps: { step: string; title: string; body: string }[] }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <SectionHeader
        eyebrow="How it works"
        title="From question to citation in seconds."
        subtitle="Four steps. No prompt engineering. No hallucinations."
      />
      <div className="relative grid gap-4 md:grid-cols-4">
        <div aria-hidden className="absolute left-4 right-4 top-14 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block" />
        {steps.map((s, i) => (
          <motion.div
            key={`${s.step}-${i}`}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            className="relative rounded-2xl border border-border/60 bg-card p-6 shadow-soft"
          >
            <div className="mb-4 inline-flex h-8 w-8 items-center justify-center rounded-full gradient-primary font-mono text-xs font-bold text-primary-foreground">
              {s.step}
            </div>
            <h3 className="font-display text-base font-semibold tracking-tight">{s.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------ NoticeReplyFlow ----------------------------- */

export function NoticeReplyFlow({ steps }: { steps: { icon: string; title: string; body: string }[] }) {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.03] to-transparent" />
      <div className="relative mx-auto max-w-7xl px-6 py-24">
        <SectionHeader
          eyebrow="Notice reply demo"
          title="Upload notice. Get a client-ready draft."
          subtitle="ITL AI reads the notice, retrieves precedents, drafts a structured reply — and hands you a downloadable file."
        />
        <div className="grid gap-3 md:grid-cols-5">
          {steps.map((s, i) => (
            <motion.div
              key={`${s.title}-${i}`}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="relative rounded-2xl border border-border/60 bg-card p-5 shadow-soft"
            >
              <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon name={s.icon} className="h-5 w-5" />
              </div>
              <p className="font-display text-sm font-semibold">{s.title}</p>
              <p className="mt-1.5 text-xs text-muted-foreground">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------- Trust ----------------------------------- */

export function TrustSection({ sources }: { sources: TrustSource[] }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <SectionHeader
        eyebrow="Grounded in the law"
        title="Built on the sources that matter."
        subtitle="Every answer cites primary sources — statute, rules, circulars, notifications and case law from Indian courts."
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {sources.map((s, i) => (
          <motion.div
            key={`${s.name}-${i}`}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.03 }}
            className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft"
          >
            <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-primary/8 text-primary">
              <Icon name={s.icon} className="h-5 w-5" />
            </div>
            <p className="font-display text-sm font-semibold">{s.name}</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{s.count}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------- FeaturesGrid ------------------------------- */

export function FeaturesGrid({ items }: { items: FeatureItem[] }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <SectionHeader
        eyebrow="Platform"
        title="Everything a tax professional needs."
        subtitle="Purpose-built modules that replace hours of retrieval with minutes of judgment."
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((f, i) => (
          <motion.div
            key={`${f.title}-${i}`}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.35, delay: i * 0.05 }}
            className="group relative rounded-2xl border border-border/60 bg-card p-6 shadow-soft transition hover:-translate-y-0.5 hover:shadow-elevated"
          >
            <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-primary/8 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <Icon name={f.icon} className="h-5 w-5" />
            </div>
            <h3 className="font-display text-lg font-semibold tracking-tight">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------- Testimonials ------------------------------ */

export function Testimonials({ items }: { items: Testimonial[] }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <SectionHeader
        eyebrow="Loved by professionals"
        title="Trusted by leading firms."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((t, i) => (
          <motion.figure
            key={`${t.name}-${i}`}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            className="relative rounded-2xl border border-border/60 bg-card p-6 shadow-soft"
          >
            <Quote className="absolute right-5 top-5 h-6 w-6 text-primary/20" />
            <blockquote className="text-[15px] leading-relaxed text-foreground">"{t.quote}"</blockquote>
            <figcaption className="mt-5 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full gradient-primary text-sm font-bold text-primary-foreground">
                {t.name.split(" ").slice(-1)[0][0]}
              </div>
              <div>
                <p className="text-sm font-semibold">{t.name}</p>
                <p className="text-xs text-muted-foreground">
                  {t.role} · {t.firm}
                </p>
              </div>
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </section>
  );
}

/* --------------------------------- CtaBanner -------------------------------- */

export function CtaBanner() {
  const isAuthenticated = useIsAuthenticated();
  return (
    <section className="mx-auto max-w-7xl px-6 pb-24">
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-10 shadow-float md:p-16">
        <div aria-hidden className="pointer-events-none absolute inset-0 gradient-hero opacity-70" />
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-10 -left-10 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative mx-auto max-w-2xl text-center">
          <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
            Ready to research at the speed of thought?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Start free. Upgrade when your team is ready. No credit card required.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="h-12 rounded-xl px-6 gradient-primary text-primary-foreground shadow-float">
              <Link to={isAuthenticated ? "/workspace" : "/login"}>Open Workspace</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-xl px-6">
              <Link to="/pricing">See pricing</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
