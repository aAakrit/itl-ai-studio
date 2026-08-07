/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prettier/prettier */
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Clock, Building2, HeadphonesIcon, Rocket, Users } from "lucide-react";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useContact } from "@/hooks";
import { SectionHeader } from "@/features/landing/sections";

export const Route = createFileRoute("/contact")({
  component: Contact,
  head: () => ({
    meta: [
      { title: "Contact — ITL AI" },
      { name: "description", content: "Get in touch with ITL AI — sales, support, enterprise and partnerships." },
      { property: "og:title", content: "Talk to ITL AI" },
      { property: "og:description", content: "Sales, enterprise, support and general enquiries." },
    ],
  }),
});

const channels = [
  { icon: Rocket, title: "Sales", body: "Buy Professional or Firm. Includes onboarding.", email: "sales@itl.ai" },
  { icon: Building2, title: "Enterprise", body: "SSO, private cloud, custom corpora, SLAs.", email: "enterprise@itl.ai" },
  { icon: HeadphonesIcon, title: "Support", body: "Priority for paid plans. Under 4 hour SLA.", email: "support@itl.ai" },
  { icon: Users, title: "Partnerships", body: "Integrations, referrals, co-marketing.", email: "partners@itl.ai" },
];

function Contact() {
  const { data } = useContact();
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 gradient-hero opacity-60" />
        <div className="relative mx-auto max-w-4xl px-6 pt-24 pb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Contact</p>
          <h1 className="mt-3 font-display text-5xl font-bold tracking-tight md:text-6xl">
            Let's talk about your practice.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Whether you're a solo practitioner or a firm-wide buyer, we'd love to hear from you.
          </p>
        </div>
      </section>

      {/* Channels */}
      {/* <section className="mx-auto max-w-6xl px-6 pb-8">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {channels.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft"
            >
              <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-primary/8 text-primary">
                <c.icon className="h-5 w-5" />
              </div>
              <p className="font-display text-sm font-semibold">{c.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{c.body}</p>
              <a href={`mailto:${c.email}`} className="mt-3 inline-block text-xs font-semibold text-primary hover:underline">
                {c.email}
              </a>
            </motion.div>
          ))}
        </div>
      </section> */}

      {/* Form + Info */}
      <section className="mx-auto grid max-w-6xl gap-8 px-6 py-12 lg:grid-cols-[1fr_1.3fr]">
        <div>
          <SectionHeader align="left" eyebrow="Reach us" title="Office & hours." />
          <div className="space-y-3 rounded-3xl border border-border/60 bg-card p-6 shadow-soft">
            {data && (
              <>
                <Row icon={<Mail className="h-4 w-4" />} label="Email" value={data.info.email} />
                <Row icon={<Phone className="h-4 w-4" />} label="Phone" value={data.info.phone} />
                <Row icon={<MapPin className="h-4 w-4" />} label="Office" value={data.info.address} />
                <Row icon={<Clock className="h-4 w-4" />} label="Hours" value={data.info.hours} />
              </>
            )}
          </div>
          {/* Map placeholder */}
          <div className="mt-4 overflow-hidden rounded-3xl border border-border/60 shadow-soft">
            <iframe
              title="Office Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15279.872439571669!2d75.70735535835051!3d26.965536300000004!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x396db34479010d3f%3A0x3a626ff039dba5f4!2sIncome%20Tax%20Library!5e1!3m2!1sen!2sin!4v1786023628650!5m2!1sen!2sin"
              width="100%"
              height="340"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="block border-0"
            />
          </div>
        </div>

        <form className="rounded-3xl border border-border/60 bg-card p-6 shadow-elevated md:p-8">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Send a message</p>
            <h3 className="mt-2 font-display text-2xl font-bold tracking-tight">Tell us about your practice.</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="mb-1.5 block text-xs">Name</Label>
              <Input placeholder="Your name" className="h-11 rounded-xl" />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">Email</Label>
              <Input type="email" placeholder="you@firm.in" className="h-11 rounded-xl" />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">Firm</Label>
              <Input placeholder="Firm name" className="h-11 rounded-xl" />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">Reason</Label>
              <Select>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {(data?.reasons ?? []).map((r: any) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4">
            <Label className="mb-1.5 block text-xs">Message</Label>
            <Textarea rows={5} placeholder="How can we help?" className="rounded-xl" />
          </div>
          <Button className="mt-6 h-11 w-full rounded-xl gradient-primary text-primary-foreground shadow-soft">
            Send message
          </Button>
          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            By submitting you agree to our privacy policy.
          </p>
        </form>
      </section>
    </PublicLayout>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-lg bg-primary/8 text-primary">{icon}</div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground">{value}</p>
      </div>
    </div>
  );
}
