/* eslint-disable prettier/prettier */
import type {
  WorkspaceModule,
  ChatThread,
  PromptSuggestion,
  Citation,
} from "@/types";

export const workspaceModules: WorkspaceModule[] = [
  {
    id: "income-tax",
    slug: "income-tax",
    name: "Income Tax",
    icon: "Landmark",
    description: "Statute, case law, circulars and notifications under the Income Tax Act.",
    color: "#7A1025",
    tools: [
      { id: "ask", slug: "ask", name: "Ask Bot", icon: "MessagesSquare", description: "Conversational research." },
      { id: "case-law", slug: "case-law", name: "Case Law Research", icon: "Scale", description: "Search & compare judgments." },
      { id: "notice-reply", slug: "notice-reply", name: "Notice Reply", icon: "FileText", description: "Draft replies to notices.", disabled: true, disabledReason: "Not yet available from the AI provider." },
      { id: "draft", slug: "draft", name: "Draft Assistant", icon: "PenLine", description: "Memos, opinions, submissions.", disabled: true, disabledReason: "Not yet available from the AI provider." },
      { id: "summarize", slug: "summarize", name: "Summarizer", icon: "Sparkles", description: "Summarize orders & judgments.", disabled: true, disabledReason: "Not yet available from the AI provider." },
    ],
  },
  {
    id: "gst",
    slug: "gst",
    name: "GST",
    icon: "Receipt",
    description: "CGST/SGST/IGST Acts, rules, notifications and rulings.",
    color: "#B22234",
    tools: [
      { id: "ask", slug: "ask", name: "Ask Bot", icon: "MessagesSquare", description: "Conversational research." },
      { id: "case-law", slug: "case-law", name: "Case Law Research", icon: "Scale", description: "AAR/AAAR & tribunal rulings." },
      { id: "notice-reply", slug: "notice-reply", name: "Notice Reply", icon: "FileText", description: "Reply to SCN and orders." },
      { id: "draft", slug: "draft", name: "Draft Assistant", icon: "PenLine", description: "Advance ruling applications.", disabled: true, disabledReason: "Same underlying capability as Notice Reply — use that instead." },
      { id: "summarize", slug: "summarize", name: "Summarizer", icon: "Sparkles", description: "Circular & ruling summaries." },
    ],
  },
];

const sampleCitations: Citation[] = [
  { id: "c1", sourceNo: 1, heading: "CIT v. Vatika Township (P) Ltd.", documentType: "Judgement", citation: "(2015) 1 SCC 1", snippet: "Retrospective operation of tax statutes — presumption against retrospectivity." },
  { id: "c2", sourceNo: 2, heading: "Section 147, Income Tax Act, 1961", documentType: "Act", reference: "s.147", snippet: "Income escaping assessment." },
  { id: "c3", sourceNo: 3, heading: "CBDT Circular No. 549 dated 31.10.1989", documentType: "Circular", reference: "Circular 549/1989" },
];

// Static timestamps to avoid SSR/hydration mismatches from Date.now() at module scope.
export const sampleThreads: ChatThread[] = [
  {
    id: "t1",
    title: "Reassessment u/s 148 — limitation post 2021",
    moduleId: "income-tax",
    toolId: "ask",
    updatedAt: "2026-07-15T05:00:00.000Z",
    pinned: true,
    tags: ["reassessment", "limitation"],
    messages: [
      { id: "m1", role: "user", content: "What is the limitation for reopening under s.148 after the 2021 Finance Act?", createdAt: "2026-07-15T05:00:00.000Z" },
      {
        id: "m2",
        role: "assistant",
        createdAt: "2026-07-15T05:00:05.000Z",
        content:
`Under the amended regime effective **1 April 2021**, the limitation for issuing notice under Section 148 is:

| Escaped income | Limitation |
| --- | --- |
| Below ₹50 lakh | **3 years** from end of the relevant AY |
| ₹50 lakh or more | **10 years** from end of the relevant AY |

Key points to note:

1. The AO must first pass an order under **s.148A(d)** after conducting an enquiry under s.148A(a)–(c).
2. The Supreme Court in *Union of India v. Ashish Agarwal* (2022) reconciled TOLA notices with the new regime.
3. The extended 10-year window applies only where escaped income is represented in the form of an **asset**, expenditure or entry.

Recommended next step: check whether the impugned notice complies with s.148A procedure and whether TOLA safeguards apply.`,
        citations: sampleCitations,
      },
    ],
  },
  { id: "t2", title: "GST — ITC reversal on credit notes", moduleId: "gst", toolId: "ask", updatedAt: "2026-07-14T22:00:00.000Z", tags: ["ITC", "credit-notes"], messages: [] },
  { id: "t3", title: "Section 56(2)(x) — gift from HUF to member", moduleId: "income-tax", toolId: "ask", updatedAt: "2026-07-13T22:00:00.000Z", favorite: true, folder: "Client — Sharma & Sons", messages: [] },
  { id: "t4", title: "Draft reply — s.143(2) scrutiny notice", moduleId: "income-tax", toolId: "notice-reply", updatedAt: "2026-07-12T22:00:00.000Z", folder: "Client — Sharma & Sons", messages: [] },
  { id: "t5", title: "AAR summary — solar EPC works contract", moduleId: "gst", toolId: "summarize", updatedAt: "2026-07-11T22:00:00.000Z", messages: [] },
];

export const promptSuggestions: PromptSuggestion[] = [
  { id: "p1", moduleId: "income-tax", title: "Reassessment limitation", prompt: "Explain the limitation for notice u/s 148 after Finance Act 2021, with case law." },
  { id: "p2", moduleId: "income-tax", title: "Presumptive taxation", prompt: "Summarize eligibility and computation under s.44AD, 44ADA and 44AE with examples." },
  { id: "p3", moduleId: "gst", title: "ITC on CSR expenses", prompt: "Is input tax credit available on CSR expenditure post Finance Act 2023? Cite rulings." },
  { id: "p4", moduleId: "gst", title: "E-invoicing threshold", prompt: "What is the current turnover threshold for e-invoicing and who is exempt?" },
];

export const chatFolders = [
  { id: "f1", name: "Client — Sharma & Sons", count: 12 },
  { id: "f2", name: "Research — Reassessment", count: 8 },
  { id: "f3", name: "GST audits FY24", count: 5 },
];