/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Minus, ArrowRight, Building2, ShieldCheck, Sparkles } from "lucide-react";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { usePricing } from "@/hooks";
import { cn } from "@/lib/utils";
import { SectionHeader, CtaBanner } from "@/features/landing/sections";

export const Route = createFileRoute("/pricing")({
  component: Pricing,
  head: () => ({
    meta: [
      { title: "Pricing — ITL AI" },
      { name: "description", content: "Simple, transparent plans for professionals and firms. Free to start, enterprise-ready when your team is." },
      { property: "og:title", content: "ITL AI — Pricing" },
      { property: "og:description", content: "Monthly, yearly and enterprise plans for Indian tax professionals." },
    ],
  }),
});

type Cycle = "monthly" | "yearly";

function Pricing() {
  const { data } = usePricing();
  const [cycle, setCycle] = useState<Cycle>("yearly");
  if (!data) return null;
  const { plans, comparison, enterprise, faqs } = data;

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 gradient-hero opacity-70" />
        <div className="relative mx-auto max-w-4xl px-6 pt-24 pb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Pricing</p>
          <h1 className="mt-3 font-display text-5xl font-bold tracking-tight md:text-6xl">
            Priced for practice, <span className="text-gradient">not for demos.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Start free. Upgrade when your team is ready. Firm-wide licences and enterprise deployments available.
          </p>

          {/* <div className="mt-8 inline-flex items-center gap-1 rounded-full border border-border/60 bg-card p-1 shadow-soft">
            {(["monthly", "yearly"] as Cycle[]).map((c) => (
              <button
                key={c}
                onClick={() => setCycle(c)}
                className={cn(
                  "relative rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors",
                  cycle === c ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {cycle === c && (
                  <motion.span
                    layoutId="cycle-pill"
                    className="absolute inset-0 rounded-full gradient-primary"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative">{c}</span>
                {c === "yearly" && (
                  <span className={cn("relative ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold", cycle === c ? "bg-primary-foreground/20" : "bg-success/15 text-success")}>
                    Save 17%
                  </span>
                )}
              </button>
            ))}
          </div> */}
        </div>
      </section>

      {/* Plans */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="grid gap-5 md:grid-cols-2">
          {plans.map((p: any, i: any) => {
            const price = cycle === "yearly" && p.yearlyPrice != null ? p.yearlyPrice : p.price;
            const suffix = p.price === 0 ? "" : cycle === "yearly" ? "/ year" : "/ month";
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={cn(
                  "relative rounded-3xl border p-8 shadow-soft transition-shadow hover:shadow-elevated",
                  p.featured
                    ? "border-primary/40 bg-card shadow-float ring-1 ring-primary/20"
                    : "border-border/60 bg-card",
                )}
              >
                {p.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full gradient-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-primary-foreground shadow-soft">
                    {p.badge ?? "Most popular"}
                  </span>
                )}
                <h3 className="font-display text-lg font-semibold">{p.name}</h3>
                <p className="mt-1 min-h-[40px] text-sm text-muted-foreground">{p.description}</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="font-display text-5xl font-bold tracking-tight">
                    {p.currency}
                    {price.toLocaleString("en-IN")}
                  </span>
                  <span className="text-sm text-muted-foreground">{suffix}</span>
                </div>
                <Button
                  asChild
                  className={cn(
                    "mt-6 h-11 w-full rounded-xl",
                    p.featured ? "gradient-primary text-primary-foreground shadow-soft" : "",
                  )}
                  variant={p.featured ? "default" : "outline"}
                >
                  <Link to="/register">
                    {p.cta}
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
                <ul className="mt-6 space-y-2.5">
                  {p.features.map((f: any) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Comparison */}
      {/* <section className="mx-auto max-w-6xl px-6 py-16">
        <SectionHeader eyebrow="Compare" title="Every capability, by plan." />
        <div className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-soft">
          <div className="grid grid-cols-[1.4fr_repeat(3,1fr)] gap-2 border-b border-border/60 bg-surface-2/40 px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            <span>Capability</span>
            {plans.map((p: any) => (
              <span key={p.id} className={cn("text-center", p.featured && "text-primary")}>
                {p.name}
              </span>
            ))}
          </div>
          {comparison.groups.map((g: any) => (
            <div key={g.name}>
              <div className="border-y border-border/60 bg-surface-2/30 px-5 py-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                {g.name}
              </div>
              {g.rows.map((r: any, i: any) => (
                <div
                  key={r.label}
                  className={cn(
                    "grid grid-cols-[1.4fr_repeat(3,1fr)] items-center gap-2 border-b border-border/40 px-5 py-3.5 text-sm last:border-b-0",
                    i % 2 === 1 && "bg-surface-2/20",
                  )}
                >
                  <span>{r.label}</span>
                  {r.values.map((v: any, j: any) => (
                    <div key={j} className="text-center">
                      {typeof v === "boolean" ? (
                        v ? <Check className="mx-auto h-4 w-4 text-success" /> : <Minus className="mx-auto h-4 w-4 text-muted-foreground/40" />
                      ) : (
                        <span className="text-xs text-muted-foreground">{v}</span>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </section> */}

      {/* Enterprise */}
      {/* <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-10 shadow-float md:p-14">
          <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-accent/15 blur-3xl" />
          <div className="relative grid gap-10 lg:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-primary">
                <Building2 className="h-3.5 w-3.5" />
                {enterprise.eyebrow}
              </div>
              <h3 className="mt-4 font-display text-4xl font-bold tracking-tight">{enterprise.title}</h3>
              <p className="mt-4 max-w-md text-muted-foreground">{enterprise.body}</p>
              <Button asChild className="mt-6 h-11 rounded-xl gradient-primary text-primary-foreground shadow-soft">
                <Link to={enterprise.cta.to}>
                  {enterprise.cta.label}
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {enterprise.bullets.map((b: any) => (
                <li key={b} className="flex items-start gap-2 rounded-xl border border-border/60 bg-surface p-3 text-sm">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section> */}

      {/* Pricing FAQ */}
      <section className="mx-auto max-w-3xl px-6 py-16">
        <SectionHeader eyebrow="FAQ" title="Pricing questions." />
        <div className="rounded-3xl border border-border/60 bg-card p-2 shadow-soft">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((f: any, i: any) => (
              <AccordionItem key={i} value={`i-${i}`} className="border-border/50 px-4 last:border-b-0">
                <AccordionTrigger className="text-left text-base font-semibold">{f.q}</AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/faq">See all FAQs</Link>
          </Button>
          <Button asChild className="rounded-xl gradient-primary text-primary-foreground">
            <Link to="/contact">
              <Sparkles className="mr-1.5 h-4 w-4" />
              Book a demo
            </Link>
          </Button>
        </div>
      </section>

      <CtaBanner />
    </PublicLayout>
  );
}
