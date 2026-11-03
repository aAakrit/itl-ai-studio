/* eslint-disable prettier/prettier */
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Bot,
  Building2,
  Check,
  Gavel,
  Info,
  Landmark,
  PenLine,
  Plug,
  Receipt,
  Scale,
  ScrollText,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/features/landing/sections";
import { useIsAuthenticated } from "@/hooks/useAuth";

/* Content mirrors the ITL Bridge AI reference site. */

const AI_PLATFORMS = ["ChatGPT", "Claude", "Gemini"];

const CAPABILITIES: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Scale,
    title: "Case Laws",
    body: "Judgments and decisions of the Supreme Court, High Courts, ITAT and other judicial and quasi-judicial authorities available in ITL.",
  },
  {
    icon: Landmark,
    title: "Income Tax",
    body: "Statutory provisions, case laws, circulars, notifications and related Income Tax material.",
  },
  {
    icon: Receipt,
    title: "GST Research",
    body: "CGST/SGST case laws, circulars, notifications, advance rulings and other available GST material.",
  },
  {
    icon: ScrollText,
    title: "Circulars & Notifications",
    body: "Search departmental circulars, notifications, instructions and other relevant documents.",
  },
  {
    icon: Search,
    title: "Section-wise Research",
    body: "Find authorities and documents relevant to a particular statutory provision.",
  },
  {
    icon: Gavel,
    title: "Citation & Court-wise",
    body: "Locate cases using court, citation, date, section and other available metadata.",
  },
];

const STEPS: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Check, title: "Subscribe", body: "Activate an eligible ITL Bridge AI subscription through Income Tax Library." },
  { icon: Plug, title: "Connect", body: "Connect with a supported AI assistant using setup instructions in your ITL account." },
  { icon: PenLine, title: "Ask", body: "Ask your tax or legal research question naturally in your AI conversation." },
  { icon: Search, title: "ITL searches", body: "ITL Bridge searches permitted resources and retrieves relevant material." },
  { icon: Sparkles, title: "Your AI responds", body: "Your selected AI analyses the retrieved material and prepares its response." },
];

const RESPONSE_PARTS: { title: string; body: string }[] = [
  { title: "Direct answer", body: "A concise response to your tax or legal question." },
  { title: "Relevant case laws", body: "Cases identified from the ITL database relevant to the issue." },
  { title: "Legal principle / ratio", body: "The principle emerging from the retrieved judgments." },
  { title: "Statutory references", body: "Relevant sections, rules, circulars or notifications available through ITL." },
  { title: "Research-based drafting", body: "Use retrieved research for replies, submissions, opinions, notes and other professional work." },
];

const AUDIENCE: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: BookOpen,
    title: "Chartered Accountants",
    body: "Research complex Income Tax and GST issues without repeatedly moving between your AI assistant and legal databases.",
  },
  {
    icon: Gavel,
    title: "Advocates",
    body: "Locate relevant authorities and use your preferred AI for analysis, comparison and drafting assistance.",
  },
  {
    icon: Search,
    title: "Tax Practitioners",
    body: "Quickly research statutory provisions, circulars, notifications and judicial precedents.",
  },
  {
    icon: Building2,
    title: "Firms & Tax Teams",
    body: "Work from a common ITL knowledge source while using preferred supported AI tools.",
  },
];

const TAGS = ["Section 74", "Wrongful ITC", "Fraud", "Wilful misstatement", "Suppression", "Extended limitation"];

/** Sign-up / sign-in links keep ?product=bridge so those pages show the Bridge branding. */
function useBridgeCtas() {
  const isAuthenticated = useIsAuthenticated();
  return { isAuthenticated };
}

function PrimaryCta({ size = "lg", label }: { size?: "lg" | "default"; label?: string }) {
  const { isAuthenticated } = useBridgeCtas();
  const className = "h-12 gap-2 rounded-xl px-6 gradient-primary text-primary-foreground shadow-float";
  return (
    <Button asChild size={size} className={className}>
      {isAuthenticated ? (
        <Link to="/profile">
          {label ?? "Open my ITL Bridge AI"} <ArrowRight className="h-4 w-4" />
        </Link>
      ) : (
        <a href="/register?product=bridge">
          {label ?? "Get ITL Bridge AI"} <ArrowRight className="h-4 w-4" />
        </a>
      )}
    </Button>
  );
}

/* ---------------------------------- Hero ---------------------------------- */

function BridgeHero() {
  const { isAuthenticated } = useBridgeCtas();
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 gradient-hero" />
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-24 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute right-0 top-40 h-[28rem] w-[28rem] rounded-full bg-accent/15 blur-3xl" />
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
            Indian tax research, connected
          </div>
          <h1 className="font-display text-5xl font-bold leading-[1.02] tracking-tight text-foreground md:text-7xl lg:text-[5.5rem]">
            Your Tax Knowledge. <span className="text-gradient">Your AI.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            Connect Income Tax Library with the AI you already use. Bring trusted Indian Income Tax and GST research
            into ChatGPT, Claude, Gemini and other compatible AI platforms — without leaving your preferred AI
            environment.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <PrimaryCta />
            <Button asChild size="lg" variant="outline" className="h-12 rounded-xl px-6 backdrop-blur">
              <a href="#how-it-works">See how it works</a>
            </Button>
          </div>
          {!isAuthenticated && (
            <p className="mt-4 text-xs text-muted-foreground">
              Already have an ITL account?{" "}
              <a href="/login?product=bridge" className="font-semibold text-primary hover:underline">
                Sign in
              </a>
            </p>
          )}
        </motion.div>

        {/* One knowledge base, your choice of AI */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mx-auto mt-20 max-w-4xl"
        >
          <div className="glass-strong rounded-3xl p-2 shadow-float">
            <div className="rounded-2xl border border-border/60 bg-card p-8 md:p-10">
              <div className="grid items-center gap-8 md:grid-cols-[1fr_auto_1fr]">
                <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-surface-2/60 p-4">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl gradient-primary text-primary-foreground">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-display text-sm font-semibold">Income Tax Library</p>
                    <p className="text-xs text-muted-foreground">Acts, rules, case laws</p>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-1 text-center">
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/8 text-primary ring-1 ring-primary/20">
                    <Plug className="h-5 w-5" />
                  </div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">ITL Bridge AI</p>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Tax knowledge connector</p>
                </div>

                <div className="space-y-2">
                  {AI_PLATFORMS.map((p) => (
                    <div key={p} className="flex items-center gap-3 rounded-xl border border-border/60 bg-surface-2/60 px-4 py-2.5">
                      <Bot className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm font-semibold leading-none">{p}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">AI assistant</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-border/60 pt-6 text-xs font-medium text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Controlled access
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Search className="h-3.5 w-3.5 text-primary" /> Relevant legal research
                </span>
              </div>
              <p className="mt-6 text-center font-display text-lg font-semibold tracking-tight">
                One knowledge base. <span className="text-gradient">Your choice of AI.</span>
              </p>
            </div>
          </div>
        </motion.div>

        <p className="mt-12 pb-4 text-center text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Built for professional tax research · {AI_PLATFORMS.join(" · ")} + compatible AI platforms
        </p>
      </div>
    </section>
  );
}

/* --------------------------------- Intro ---------------------------------- */

function IntroSection() {
  return (
    <section id="about" className="mx-auto max-w-7xl px-6 py-24">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-primary backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Introducing ITL Bridge AI
          </div>
          <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
            Your AI assistant. Backed by ITL research.
          </h2>
        </div>
        <div className="space-y-4 text-muted-foreground">
          <p className="leading-relaxed">
            <span className="font-semibold text-foreground">ITL Bridge AI</span> is a secure connection between Income
            Tax Library and supported AI assistants. It enables your AI to search and retrieve relevant material from
            ITL's legal research database while you continue working in your preferred AI environment.
          </p>
          <p className="leading-relaxed">
            Ask your question naturally. Your AI can request relevant case laws, statutory material, circulars,
            notifications and other available tax documents through ITL Bridge AI — then use the retrieved material to
            prepare its response.
          </p>
          <p className="font-medium text-foreground">You choose the AI. ITL provides the tax knowledge.</p>
        </div>
      </div>
    </section>
  );
}

/* ----------------------- Two capabilities, one workflow -------------------- */

function WorkflowTrio() {
  const items = [
    {
      icon: Bot,
      eyebrow: "Your AI",
      title: "Reasoning & drafting",
      body: "Your chosen AI helps understand questions, analyse information, summarise judgments and draft professional responses.",
      foot: "ChatGPT · Claude · Gemini",
    },
    {
      icon: BookOpen,
      eyebrow: "ITL Bridge AI",
      title: "Specialised tax knowledge",
      body: "Controlled access to Income Tax Library's available Indian tax and legal research collection.",
      foot: "Income Tax · GST · Case Laws",
    },
    {
      icon: Sparkles,
      eyebrow: "Together",
      title: "AI-assisted research",
      body: "Your AI can prepare responses informed by relevant material retrieved from the ITL knowledge base.",
      foot: "One knowledge base. Your choice of AI.",
    },
  ];
  return (
    <section id="features" className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-7xl px-6 py-24">
        <SectionHeader
          eyebrow="Why ITL Bridge AI"
          title="Two capabilities. One powerful workflow."
          subtitle="Bring the reasoning strengths of your AI together with specialised Indian tax and legal research."
        />
        <div className="grid gap-4 md:grid-cols-3">
          {items.map((it, i) => (
            <motion.div
              key={it.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.06 }}
              className="relative rounded-2xl border border-border/60 bg-card p-6 shadow-soft"
            >
              <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl gradient-primary text-primary-foreground">
                <it.icon className="h-5 w-5" />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">{it.eyebrow}</p>
              <h3 className="mt-1 font-display text-lg font-semibold tracking-tight">{it.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{it.body}</p>
              <p className="mt-4 text-xs font-medium text-foreground">{it.foot}</p>
              {i < items.length - 1 && (
                <span className="absolute -right-3 top-1/2 z-10 hidden h-6 w-6 -translate-y-1/2 place-items-center rounded-full border border-border/60 bg-card text-xs font-bold text-muted-foreground md:grid">
                  {i === 0 ? "+" : "="}
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ Capabilities ------------------------------ */

function CapabilitiesSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <SectionHeader
        eyebrow="Research capabilities"
        title="What can ITL Bridge AI access?"
        subtitle="Depending on your subscription, available integrations and usage permissions, search across ITL's available research collection."
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {CAPABILITIES.map((c, i) => (
          <motion.div
            key={c.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.35, delay: i * 0.05 }}
            className="group relative rounded-2xl border border-border/60 bg-card p-6 shadow-soft transition hover:-translate-y-0.5 hover:shadow-elevated"
          >
            <span className="absolute right-5 top-5 font-mono text-xs text-muted-foreground/60">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-primary/8 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <c.icon className="h-5 w-5" />
            </div>
            <h3 className="font-display text-lg font-semibold tracking-tight">{c.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------- How it works ----------------------------- */

function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-24">
      <SectionHeader
        eyebrow="Simple to connect"
        title="From your question to research-backed answers."
        subtitle="Keep working inside the AI platform you already prefer."
      />
      <div className="grid gap-4 md:grid-cols-5">
        {STEPS.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: i * 0.06 }}
            className="relative rounded-2xl border border-border/60 bg-card p-5 shadow-soft"
          >
            <div className="mb-3 flex items-center gap-2">
              <div className="grid h-10 w-10 place-items-center rounded-xl gradient-primary text-primary-foreground">
                <s.icon className="h-5 w-5" />
              </div>
              <span className="font-mono text-xs text-muted-foreground/60">{String(i + 1).padStart(2, "0")}</span>
            </div>
            <h3 className="font-display text-base font-semibold tracking-tight">{s.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
            {i < STEPS.length - 1 && (
              <ArrowRight className="absolute -right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-muted-foreground/40 md:block" />
            )}
          </motion.div>
        ))}
      </div>
      <p className="mt-8 flex flex-wrap items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {["Ask", "Search", "Retrieve", "Analyse", "Respond"].map((w, i, arr) => (
          <span key={w} className="inline-flex items-center gap-2">
            {w}
            {i < arr.length - 1 && <ArrowRight className="h-3 w-3 text-primary" />}
          </span>
        ))}
      </p>
    </section>
  );
}

/* ------------------------------- In action -------------------------------- */

function InAction() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-primary backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            See it in action
          </div>
          <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
            Ask a complex question. Start with the right research.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            For example, ask your AI to research whether the extended period under Section 74 of the CGST Act can be
            invoked merely because ITC was wrongly claimed.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {TAGS.map((t) => (
              <Badge key={t} variant="outline" className="font-normal">
                {t}
              </Badge>
            ))}
          </div>
        </div>

        <div className="glass-strong rounded-3xl p-2 shadow-float">
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
            <div className="flex items-center gap-2 border-b border-border/60 bg-surface-2/60 px-4 py-2.5">
              <Bot className="h-4 w-4 text-primary" />
              <p className="text-xs font-semibold">Your AI conversation</p>
              <span className="ml-auto text-[10px] uppercase tracking-widest text-muted-foreground">Illustrative workflow</span>
            </div>
            <div className="space-y-4 p-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Your question</p>
                <p className="mt-1 rounded-xl bg-secondary/60 px-3.5 py-2.5 text-sm">
                  Can extended limitation under Section 74 be invoked merely on the ground of wrongful availment of ITC?
                </p>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2.5">
                <Plug className="h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold">ITL Bridge AI</p>
                  <p className="text-[11px] text-muted-foreground">Searching permitted ITL resources…</p>
                </div>
                <Badge className="bg-success/10 text-success hover:bg-success/10">
                  <Check className="mr-1 h-3 w-3" /> Retrieved
                </Badge>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Your AI response</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {["Relevant law", "Case laws", "Analysis"].map((w) => (
                    <span key={w} className="rounded-lg border border-border/60 bg-card px-2.5 py-1 text-xs font-medium">
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <p className="border-t border-border/60 px-5 py-3 text-[11px] text-muted-foreground">
              Illustrative only. Actual results depend on the query, retrieved material and selected AI platform.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ResponseParts() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-24">
      <SectionHeader
        eyebrow="Your AI's response"
        title="Research you can work with."
        subtitle="The final response is generated by your selected AI platform using information made available through ITL Bridge AI. Depending on the question and AI capabilities, it may include:"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {RESPONSE_PARTS.map((p, i) => (
          <motion.div
            key={p.title}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.04 }}
            className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft"
          >
            <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full gradient-primary font-mono text-xs font-bold text-primary-foreground">
              {String(i + 1).padStart(2, "0")}
            </div>
            <p className="font-display text-sm font-semibold">{p.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{p.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------- Audience --------------------------------- */

function Audience() {
  return (
    <section id="professionals" className="mx-auto max-w-7xl px-6 py-24">
      <SectionHeader
        eyebrow="Built for tax professionals"
        title="Made for the way you work."
        subtitle="For professionals who already use AI and need specialised Indian tax research alongside it."
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {AUDIENCE.map((a, i) => (
          <motion.div
            key={a.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: i * 0.05 }}
            className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft"
          >
            <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-primary/8 text-primary">
              <a.icon className="h-5 w-5" />
            </div>
            <h3 className="font-display text-lg font-semibold tracking-tight">{a.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* --------------------- Not another chatbot + controlled access ------------- */

function KeepYourAi() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-24">
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-10 shadow-soft md:p-14">
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative grid items-center gap-8 lg:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">Not another AI chatbot</p>
            <h2 className="mt-2 font-display text-4xl font-bold tracking-tight md:text-5xl">Keep the AI you prefer.</h2>
          </div>
          <div className="space-y-3 text-muted-foreground">
            <p className="leading-relaxed">
              You may prefer ChatGPT for one type of work, Claude for another, or Gemini for a different workflow.
            </p>
            <p className="leading-relaxed">
              <span className="font-semibold text-foreground">ITL Bridge AI does not force you to choose a new AI.</span>{" "}
              It connects Income Tax Library's specialised tax knowledge with supported AI assistants.
            </p>
            <p className="font-medium text-foreground">Your AI may change. Your ITL knowledge connection stays.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ControlledAccess() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-24">
      <SectionHeader
        eyebrow="Controlled access to ITL knowledge"
        title="Built to connect. Designed to protect."
        subtitle="ITL Bridge AI is designed to provide controlled retrieval, not unrestricted access to the Income Tax Library database. Search requests and returned information are governed by the user's subscription, applicable permissions and usage limits. This approach helps protect ITL's proprietary database while enabling AI-assisted legal research."
      />
      <div className="mx-auto flex max-w-3xl items-start gap-3 rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-info/10 text-info">
          <Info className="h-4 w-4" />
        </div>
        <div>
          <h3 className="font-display text-sm font-semibold">Important: AI response vs. ITL source material</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            ITL Bridge AI provides access to relevant material from Income Tax Library. The analysis, interpretation and
            final response are generated by the third-party AI platform selected by the user. Response quality, accuracy
            and format may differ between platforms. For professional use, review the underlying authorities and source
            documents before relying on an AI-generated conclusion.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------- CTA ----------------------------------- */

function BridgeCta() {
  const { isAuthenticated } = useBridgeCtas();
  return (
    <section id="get-started" className="mx-auto max-w-7xl px-6 pb-12">
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-10 shadow-float md:p-16">
        <div aria-hidden className="pointer-events-none absolute inset-0 gradient-hero opacity-70" />
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-10 -left-10 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">ITL Bridge AI</p>
          <h2 className="mt-2 font-display text-4xl font-bold tracking-tight md:text-5xl">
            One Knowledge Base. Your Choice of AI.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Connect your preferred AI with the specialised Indian tax and legal research resources of Income Tax Library.
          </p>
          <p className="mt-3 text-xs font-medium text-muted-foreground">
            Income Tax • GST • Case Laws • Circulars • Notifications
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <PrimaryCta label={isAuthenticated ? "Open my ITL Bridge AI" : "Start with ITL Bridge AI"} />
            <Button asChild size="lg" variant="outline" className="h-12 rounded-xl px-6">
              <a href="#how-it-works">How to connect</a>
            </Button>
          </div>
        </div>
      </div>
      <p className="mx-auto mt-6 max-w-3xl text-center text-[11px] leading-relaxed text-muted-foreground">
        ITL Bridge AI is an independent service of Income Tax Library. Third-party AI platforms are subject to their
        respective terms, availability, privacy policies and usage charges. References to third-party products do not
        imply endorsement or affiliation unless expressly stated.
      </p>
    </section>
  );
}

/* --------------------------------- Page ----------------------------------- */

export function BridgeLanding() {
  return (
    <>
      <BridgeHero />
      <IntroSection />
      <WorkflowTrio />
      <CapabilitiesSection />
      <HowItWorks />
      <InAction />
      <ResponseParts />
      <Audience />
      <KeepYourAi />
      <ControlledAccess />
      <BridgeCta />
    </>
  );
}
