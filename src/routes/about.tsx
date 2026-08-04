/* eslint-disable prettier/prettier */
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Target, Eye, Rocket, Users2, MapPin } from "lucide-react";
import { PublicLayout } from "@/layouts/PublicLayout";
import { useAbout } from "@/hooks";
import { SectionHeader, CtaBanner } from "@/features/landing/sections";

export const Route = createFileRoute("/about")({
  component: About,
  head: () => ({
    meta: [
      { title: "About — ITL AI" },
      { name: "description", content: "Meet the team building the operating system for Indian tax professionals." },
      { property: "og:title", content: "About ITL AI" },
      { property: "og:description", content: "Our mission, story, values and roadmap for the AI copilot for Indian tax." },
    ],
  }),
});

function About() {
  const { data } = useAbout() as { data: any };
  if (!data) return null;
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 gradient-hero opacity-60" />
        <div className="relative mx-auto max-w-4xl px-6 pt-24 pb-16 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">{data.hero.eyebrow ?? "About"}</p>
          <h1 className="mt-3 font-display text-5xl font-bold tracking-tight md:text-6xl">{data.hero.title}</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">{data.hero.subtitle}</p>
        </div>
      </section>

      {/* Mission + Vision */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-5 md:grid-cols-2">
          {[
            { icon: Target, label: "Mission", text: data.mission },
            { icon: Eye, label: "Vision", text: data.vision },
          ].map(({ icon: I, label, text }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-3xl border border-border/60 bg-card p-8 shadow-soft md:p-10"
            >
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl gradient-primary text-primary-foreground">
                <I className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">{label}</p>
              <p className="mt-2 font-display text-xl leading-snug tracking-tight text-foreground md:text-2xl">
                {text}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Story */}
      {data.story && (
        <section className="mx-auto max-w-5xl px-6 py-16">
          <SectionHeader eyebrow="Our story" title="Why we built ITL AI." />
          <div className="grid gap-4 md:grid-cols-3">
            {data.story.map((s: any, i: number) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft"
              >
                <p className="font-mono text-xs font-semibold text-primary">CHAPTER {i + 1}</p>
                <h3 className="mt-2 font-display text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Values */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <SectionHeader eyebrow="Values" title="How we work." />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {data.values.map((v: any) => (
            <div key={v.title} className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
              <h3 className="font-display text-lg font-semibold">{v.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Timeline */}
      {/* <section className="mx-auto max-w-4xl px-6 py-16">
        <SectionHeader eyebrow="Journey" title="From prototype to production." />
        <div className="relative">
          <div className="absolute left-6 top-2 bottom-2 hidden w-px bg-border md:block" />
          <div className="space-y-4">
            {data.timeline.map((t: any, i: number) => (
              <motion.div
                key={t.year}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="relative flex gap-6 rounded-2xl border border-border/60 bg-card p-6 shadow-soft md:pl-12"
              >
                <div className="absolute left-3 top-1/2 hidden h-4 w-4 -translate-y-1/2 rounded-full bg-primary ring-4 ring-background md:block" />
                <p className="w-16 shrink-0 font-mono text-sm font-semibold text-primary md:w-20">{t.year}</p>
                <div>
                  <p className="font-display text-base font-semibold">{t.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{t.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section> */}

      {/* Roadmap */}
      {/* {data.roadmap && (
        <section className="mx-auto max-w-6xl px-6 py-16">
          <SectionHeader eyebrow="Roadmap" title="What's next." subtitle="Shipping in the coming quarters." />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {data.roadmap.map((r: any, i: number) => (
              <motion.div
                key={r.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft"
              >
                <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-primary/8 text-primary">
                  <Rocket className="h-5 w-5" />
                </div>
                <p className="font-mono text-[11px] font-semibold text-primary">{r.quarter}</p>
                <p className="mt-1 font-display text-base font-semibold">{r.title}</p>
                <p className="mt-1.5 text-sm text-muted-foreground">{r.body}</p>
              </motion.div>
            ))}
          </div>
        </section>
      )} */}

      {/* Culture + Leadership */}
      {/* {data.culture && (
        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">Culture</p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight">How we operate.</h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {data.culture.map((c: any) => (
                  <div key={c.title} className="rounded-xl border border-border/60 bg-card p-4">
                    <div className="mb-2 grid h-8 w-8 place-items-center rounded-lg bg-primary/8 text-primary">
                      <Users2 className="h-4 w-4" />
                    </div>
                    <p className="text-sm font-semibold">{c.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{c.body}</p>
                  </div>
                ))}
              </div>
            </div>
            {data.leadership && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">Leadership</p>
                <h2 className="mt-3 font-display text-3xl font-bold tracking-tight">Who's building this.</h2>
                <div className="mt-6 space-y-3">
                  {data.leadership.map((l: any) => (
                    <div key={l.name} className="flex gap-4 rounded-xl border border-border/60 bg-card p-4">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl gradient-primary font-display text-sm font-bold text-primary-foreground">
                        {l.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("")}
                      </div>
                      <div className="min-w-0">
                        <p className="font-display text-sm font-semibold">{l.name}</p>
                        <p className="text-xs text-primary">{l.role}</p>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{l.bio}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 text-primary" />
            Mumbai · Bengaluru · Delhi · Pune
          </div>
        </section>
      )} */}

      <CtaBanner />
    </PublicLayout>
  );
}
