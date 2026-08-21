/* eslint-disable prettier/prettier */
export interface HeroData {
  eyebrow: string;
  title: string;
  highlight: string;
  subtitle: string;
  primaryCta: { label: string; to: string };
  secondaryCta: { label: string; to: string };
  stats: { label: string; value: string }[];
  logos: string[];
  typewriter?: string[];
}

export interface FeatureItem {
  icon: string;
  title: string;
  description: string;
}

export interface Testimonial {
  name: string;
  role: string;
  firm: string;
  quote: string;
  avatar?: string;
}

export interface FAQItem {
  q: string;
  a: string;
  category?: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  yearlyPrice?: number;
  period: "monthly" | "yearly";
  currency: string;
  description: string;
  featured?: boolean;
  cta: string;
  features: string[];
  badge?: string;
}

export interface ContactInfo {
  email: string;
  phone: string;
  address: string;
  hours: string;
}

export interface WorkspaceModule {
  id: string;
  slug: string;
  name: string;
  icon: string;
  description: string;
  color: string;
  tools: WorkspaceTool[];
  disabled?: boolean;
  disabledReason?: string;
}

export interface WorkspaceTool {
  id: string;
  slug: string;
  name: string;
  icon: string;
  description: string;
  /** True when the vendor hasn't provided a working backend for this tool yet. */
  disabled?: boolean;
  disabledReason?: string;
}

export interface NoticeAmountProposed {
  tax?: number;
  interest?: number;
  penalty?: number;
  fine?: number;
  currency?: string;
}

export interface NoticeProfileAmounts {
  tax?: number | null;
  interest?: number | null;
  penalty?: number | null;
  total?: number | null;
}

export interface NoticeProfileAuthority {
  name?: string;
  designation?: string;
  office?: string;
  jurisdiction?: string;
}

/** v3's replacement for the old "notice_summary" — same idea, vendor's actual field names. */
export interface NoticeProfile {
  noticeType?: string;
  form?: string;
  act?: string;
  sectionsCited?: string[];
  rulesCited?: string[];
  noticeNumber?: string;
  noticeDate?: string;
  dinNumber?: string;
  taxPeriod?: string;
  hearingDate?: string;
  replyDueDate?: string;
  amounts?: NoticeProfileAmounts;
  issuingAuthority?: NoticeProfileAuthority;
  reliedUponDocuments?: string[];
  annexures?: string[];
  missingParticulars?: string[];
  fraudTrack?: boolean;
  personalHearingOffered?: boolean;
  replyForm?: string;
  deadline?: string;
  category?: string;
  noticeSummary?: string;
}

export interface NoticeAllegation {
  id: string;
  allegation: string;
  section?: string;
  amount?: number | null;
  evidenceCitedInNotice?: string;
}

export interface NoticeReviewNote {
  type: string;
  note: string;
  action?: string;
  includeInReply?: string;
}

/** One row per allegation while facts/evidence are being collected. */
export interface NoticeEvidenceMatrixRow {
  id: string;
  allegation: string;
  userPosition?: string;
  evidenceOffered?: string[];
  evidenceGap?: string;
  inconsistency?: string;
  status: "ANSWERED" | "PARTIAL" | "UNADDRESSED";
}

export interface NoticeRejectedFile {
  file: string;
  reason: string;
}

export interface NoticeAllegationCoverage {
  allegationNo: number;
  addressed: boolean;
  replySection?: string;
  reason?: string;
}

/**
 * Notice Agent v3 staged-workflow metadata attached to a ChatMessage.
 * `phase` mirrors the vendor's own state machine verbatim: uploaded ->
 * ANALYSED_AWAITING_FACTS -> COLLECTING_FACTS -> DRAFTED. (Named `phase`,
 * not `stage`, to match the vendor's v3 vocabulary directly.)
 */
export interface NoticeWorkflowData {
  phase: "uploaded" | "ANALYSED_AWAITING_FACTS" | "COLLECTING_FACTS" | "DRAFTED";
  conversationId: string;
  revision?: number;

  // Analyse-phase fields
  noticeProfile?: NoticeProfile;
  allegations?: NoticeAllegation[];
  reviewNotes?: NoticeReviewNote[];
  suggestedDocuments?: string[];

  // Facts/evidence-loop fields (COLLECTING_FACTS)
  evidenceMatrix?: NoticeEvidenceMatrixRow[];
  followUpQuestions?: string[];
  unaddressedAllegations?: string[];
  extractedFacts?: string[];
  readyToDraft?: boolean;
  acceptedFiles?: string[];
  rejectedFiles?: NoticeRejectedFile[];
  documentsOnRecord?: number;

  // Draft-phase fields (DRAFTED)
  noticeType?: string;
  replyForm?: string;
  deadline?: string;
  fraudTrack?: boolean;
  disclaimer?: string;
  escalationWarning?: string | null;
  allegationCoverage?: NoticeAllegationCoverage[];
  instructionApplied?: string;

  /** True when this reply came from the legacy one-shot Notice AI ("reply as it is" shortcut) — no facts loop, no refine session. */
  legacy?: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  citations?: Citation[];
  relatedJudgements?: RelatedJudgement[];
  attachments?: Attachment[];
  /** A single uploaded/generated document tied to this message (Notice Reply / Summarizer). */
  attachment?: MessageAttachment;
  /** True when `content` is actually a clarifying question, not a real answer — vendor's needs_clarification flag. */
  needsClarification?: boolean;
  /** Vendor did an extra deep-research pass for this answer. */
  deepResearchUsed?: boolean;
  /** Local-only lifecycle state for optimistic UI. Absent = already settled. */
  status?: "pending" | "error" | "processing";
  /** Set when status is "processing" — the vendor job id to poll. */
  jobId?: string;
  /** Live progress (0-1) and stage label while status is "processing". */
  progress?: number;
  stage?: string;
  feedback?: "up" | "down";
  /** Notice Agent staged-workflow data — see NoticeWorkflowData. Only set for provider="notice" assistant messages. */
  notice?: NoticeWorkflowData;
}

/**
 * Matches the vendor's `sources[]` entries as closely as possible.
 * `documentType` is whatever the vendor returns — Act, Judgement, Circular,
 * Notification, Rule, Section, Order, Statute, or any future type — never
 * hardcoded to a fixed enum, so a new vendor type just renders with its own
 * label instead of silently becoming "Act".
 */
export interface Citation {
  id: string;
  /** Vendor's own numbering — maps to "(Source N)" mentions inside the markdown answer. */
  sourceNo?: number;
  documentType: string;
  heading: string;
  reference?: string;
  citation?: string;
  court?: string;
  courtArea?: string;
  link?: string;
  similarity?: number;
  snippet?: string;
}

export interface RelatedJudgement {
  id: string;
  partyName: string;
  court?: string;
  facts?: string;
  issue?: string;
  held?: string;
  ratio?: string;
  link?: string;
}

export interface MessageAttachment {
  filename: string;
  contentType?: string;
  size?: number;
  downloadUrl: string;
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
}

export interface ImportContentResponse {
    title: string;
    html_content: string;
    plain_text: string;
    word_count?: number;
    page_count?: number;
    file_name: string;
    file_type: string;
    attachment_path?: string | null;
    attachment_filename?: string | null;
    attachment_content_type?: string | null;
    attachment_size?: number | null;
}

export interface ChatThread {
  id: string;
  title: string;
  moduleId: string;
  toolId: string;
  updatedAt: string;
  pinned?: boolean;
  favorite?: boolean;
  folder?: string;
  tags?: string[];
  messages: ChatMessage[];
  /** True once full message history has been fetched from the backend for this thread. */
  hasLoadedMessages?: boolean;
}

export interface PromptSuggestion {
  id: string;
  title: string;
  prompt: string;
  moduleId: string;
}

export interface AdminMetric {
  key: string;
  label: string;
  value: string;
  delta: number;
  trend: number[];
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "editor" | "user";
  plan: "free" | "pro" | "enterprise";
  status: "active" | "invited" | "suspended";
  joinedAt: string;
}

export interface LegalDoc {
  slug: string;
  title: string;
  updatedAt: string;
  readingTime?: string;
  sections: { heading: string; body: string }[];
}

/* Public marketing extensions */

export interface PainPoint {
  icon: string;
  title: string;
  body: string;
}

export interface ProductShowcase {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  bullets: string[];
  icon: string;
  cta: { label: string; to: string };
  demo: "chat" | "research" | "notice" | "draft" | "summarize";
}

export interface ComparisonRow {
  capability: string;
  manual: string | boolean;
  google: string | boolean;
  chatgpt: string | boolean;
  itl: string | boolean;
}

export interface TrustSource {
  icon: string;
  name: string;
  count: string;
}

export interface LogoItem {
  name: string;
  kind?: "firm" | "government" | "source";
}