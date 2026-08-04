/* eslint-disable prettier/prettier */
import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/layouts/PublicLayout";
import {
  Hero,
  LogoStrip,
  ProblemSection,
  SolutionSection,
  WorkspaceShowcase,
  ProductShowcaseSection,
  ComparisonSection,
  WorkflowSection,
  NoticeReplyFlow,
  TrustSection,
  Testimonials,
  CtaBanner,
} from "@/features/landing/sections";
import { useHome } from "@/hooks";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "ITL AI — Income Tax & GST research, drafting and case law" },
      {
        name: "description",
        content:
          "Purpose-built AI workspace for Chartered Accountants, advocates and tax teams. Grounded citations, notice drafting, case law summaries.",
      },
      { property: "og:title", content: "ITL AI — The AI copilot for Indian tax professionals" },
      {
        property: "og:description",
        content: "Research Income Tax & GST, draft replies, summarize orders — with verifiable citations.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function Home() {
  const { data, isLoading } = useHome();
  if (isLoading || !data) {
    return (
      <PublicLayout>
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="h-96 animate-pulse rounded-2xl bg-secondary/60" />
        </div>
      </PublicLayout>
    );
  }
  return (
    <PublicLayout>
      <Hero data={data.hero} />
      {/* <LogoStrip items={data.logos} /> */}
      <ProblemSection items={data.painPoints} />
      <SolutionSection steps={data.solutionSteps} />
      <WorkspaceShowcase />
      <ProductShowcaseSection items={data.showcases} />
      {/* <ComparisonSection rows={data.comparison} /> */}
      <WorkflowSection steps={data.workflow} />
      <NoticeReplyFlow steps={data.noticeReplyFlow} />
      <TrustSection sources={data.trustSources} />
      {/* <Testimonials items={data.testimonials} /> */}
      <CtaBanner />
    </PublicLayout>
  );
}
