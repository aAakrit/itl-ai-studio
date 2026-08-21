/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prettier/prettier */
import { isAxiosError } from "axios";
import { api, endpoints } from "./api/api";
import { promptSuggestions, workspaceModules } from "@/mock/workspace";
import type {
  Attachment,
  ChatMessage,
  ChatThread,
  Citation,
  MessageAttachment,
  NoticeAllegation,
  NoticeAllegationCoverage,
  NoticeEvidenceMatrixRow,
  NoticeProfile,
  NoticeRejectedFile,
  NoticeReviewNote,
  NoticeWorkflowData,
  PromptSuggestion,
  RelatedJudgement,
} from "@/types";

/**
 * Maps a workspace tool to the {provider, tool} pair the backend's
 * /ai/query expects. Confirmed against the vendor's own Django reference
 * client (core/views.py + core/case_law_research_views.py) — critically,
 * "Case Law Research" is NOT `provider: main, tool: case-laws` (that's a
 * different, secondary endpoint requiring a context_answer). It's its own
 * provider — the judgement/premium search bot.
 *
 * Tools not listed here have no working backend yet (see mock/workspace.ts
 * `disabled` flags) — sendMessage() refuses to call for them rather than
 * silently falling back to Ask Bot.
 */
const TOOL_BACKEND_ROUTE_MAP: Record<string, { provider: string; tool: string }> = {
  ask: { provider: "main", tool: "chat" },
  "case-law": { provider: "premium", tool: "search" },
  "notice-reply": { provider: "notice", tool: "process" },
  summarize: { provider: "summarizer", tool: "summarize" },
};

/**
 * Tools backed by the multipart file-upload endpoints (/ai/notice/generate,
 * /ai/summarize) rather than the JSON /ai/query endpoint — confirmed against
 * core/draft_assistant.py and core/summarizer.py, which both accept a file
 * as optional (zero-or-more), never required.
 */
const FILE_TOOL_ENDPOINTS: Record<string, string> = {
  "notice-reply": endpoints.ai.noticeGenerate,
  summarize: endpoints.ai.summarize,
};

const BACKEND_ROUTE_TO_UI_TOOL_MAP: Record<string, string> = {
  ...Object.fromEntries(
    Object.entries(TOOL_BACKEND_ROUTE_MAP).map(([uiTool, route]) => [`${route.provider}:${route.tool}`, uiTool]),
  ),
  // Staged Notice Agent conversations are created with tool="notice" (see
  // ChatService.analyze_notice), distinct from the legacy one-shot
  // "notice:process" route above — both resolve to the same UI tool.
  "notice:notice": "notice-reply",
};

interface AiQueryContext {
  moduleId: string;
  toolId: string;
}

/** Generic `{ success, message, data }` envelope every /ai/* route returns. */
interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

interface BackendCitation {
  id?: string | number;
  source_no?: number;
  document_type?: string;
  heading?: string;
  title?: string;
  reference?: string;
  citation?: string;
  court?: string;
  court_name?: string;
  court_area?: string;
  link?: string;
  url?: string;
  similarity?: number;
  snippet?: string;
}

interface BackendRelatedJudgement {
  id?: string | number;
  partyname?: string;
  court?: string;
  facts?: string;
  issue?: string;
  held?: string;
  ratio?: string;
  link?: string;
}

interface BackendAttachment {
  filename?: string;
  content_type?: string;
  size?: number;
  download_url?: string;
}

/** Shape returned by ChatService.serialize_message on the backend. */
interface BackendMessage {
  id: number | string;
  parent_message_id?: number | string | null;
  role: "user" | "assistant" | "system";
  message_type?: string;
  status?: string;
  content?: string | null;
  confidence?: number | null;
  query_time_ms?: number | null;
  sources?: BackendCitation[] | null;
  related_judgements?: BackendRelatedJudgement[] | null;
  needs_clarification?: boolean | null;
  deep_research_used?: boolean | null;
  attachment?: BackendAttachment | null;
  job_id?: string | null;
  feedback?: "up" | "down" | null;
  created_at: string;
}

/** Shape returned by ChatService.serialize_conversation on the backend. */
interface BackendConversation {
  id: number | string;
  title?: string;
  provider?: string;
  tool?: string;
  module?: string | null;
  status?: string;
  is_archived?: boolean;
  created_at?: string;
  updated_at?: string;
  last_message_at?: string | null;
  messages?: BackendMessage[];
}

/** Shape of the `data` field returned by POST /ai/query. */
interface BackendQueryResult {
  conversation: BackendConversation;
  user_message: {
    id: number | string;
    query: string;
    created_at: string;
  };
  assistant_message: {
    id: number | string;
    answer: string | null;
    status?: string;
    job_id?: string | null;
    confidence?: number | null;
    query_time_ms?: number | null;
    sources?: BackendCitation[] | null;
    related_judgements?: BackendRelatedJudgement[] | null;
    needs_clarification?: boolean | null;
    deep_research_used?: boolean | null;
    verification?: unknown;
    pipeline?: unknown;
    created_at: string;
  };
}

interface NoticeSources {
  sections?: Array<{
    url?: string;
    type?: string;
    heading?: string;
    reference?: string;
  }>;

  case_laws?: Array<{
    url?: string;
    court?: string;
    citation?: string;
    partyname?: string;
    favour?: string;
    dateofjudgement?: string;
    sectionno?: string;
  }>;

  circulars?: Array<{
    url?: string;
    heading?: string;
    reference?: string;
  }>;
}

/** Backend snake_case shapes for the staged Notice Agent workflow (Part B of the Aug 2026 contract). */
interface BackendNoticeAmountProposed {
  tax?: number;
  interest?: number;
  penalty?: number;
  fine?: number;
  currency?: string;
}

interface BackendNoticeProfileAmounts {
  tax?: number | null;
  interest?: number | null;
  penalty?: number | null;
  total?: number | null;
}

interface BackendNoticeProfileAuthority {
  name?: string;
  designation?: string;
  office?: string;
  jurisdiction?: string;
}

interface BackendNoticeProfile {
  notice_type?: string;
  form?: string;
  act?: string;
  sections_cited?: string[];
  rules_cited?: string[];
  notice_number?: string;
  notice_date?: string;
  din_number?: string;
  tax_period?: string;
  hearing_date?: string;
  reply_due_date?: string;
  amounts?: BackendNoticeProfileAmounts;
  issuing_authority?: BackendNoticeProfileAuthority;
  relied_upon_documents?: string[];
  annexures?: string[];
  missing_particulars?: string[];
  fraud_track?: boolean;
  personal_hearing_offered?: boolean;
  reply_form?: string;
  deadline?: string;
  category?: string;
  notice_summary?: string;
}

interface BackendNoticeAllegation {
  id: string;
  allegation: string;
  section?: string;
  amount?: number | null;
  evidence_cited_in_notice?: string;
}

interface BackendNoticeReviewNote {
  type: string;
  note: string;
  action?: string;
  include_in_reply?: string;
}

interface BackendNoticeEvidenceMatrixRow {
  id: string;
  allegation: string;
  user_position?: string;
  evidence_offered?: string[];
  evidence_gap?: string;
  inconsistency?: string;
  status: "ANSWERED" | "PARTIAL" | "UNADDRESSED";
}

interface BackendNoticeRejectedFile {
  file: string;
  reason: string;
}

interface BackendNoticeAllegationCoverage {
  allegation_no: number;
  addressed: boolean;
  reply_section?: string;
  reason?: string;
}

/**
 * v3's single unified turn shape — analyse/submissions/draft/refine (and
 * the /ask compatibility shim) all return this same envelope, with fields
 * simply absent when not applicable to that call/phase.
 */
interface BackendNoticeTurn {
  conversation: BackendConversation;
  user_message: { id: number | string; query: string; created_at: string };
  assistant_message: { id: number | string; answer: string | null; created_at: string };
  phase: "uploaded" | "ANALYSED_AWAITING_FACTS" | "COLLECTING_FACTS" | "DRAFTED";
  message?: string;
  query_time_ms?: number;

  // Analyse-phase fields
  notice_profile?: BackendNoticeProfile;
  allegations?: BackendNoticeAllegation[];
  review_notes?: BackendNoticeReviewNote[];
  suggested_documents?: string[];

  // Facts/evidence-loop fields
  evidence_matrix?: BackendNoticeEvidenceMatrixRow[];
  follow_up_questions?: string[];
  unaddressed_allegations?: string[];
  extracted_facts?: string[];
  ready_to_draft?: boolean;
  accepted_files?: string[];
  rejected_files?: BackendNoticeRejectedFile[];
  documents_on_record?: number;

  // Draft-phase fields
  notice_type?: string;
  reply_form?: string;
  deadline?: string;
  fraud_track?: boolean;
  disclaimer?: string;
  escalation_warning?: string | null;
  sources?: NoticeSources;
  allegation_coverage?: BackendNoticeAllegationCoverage[];
  revision?: number;
  instruction_applied?: string;

  /** Set when the staged endpoints 404'd and the backend fell back to the legacy one-shot "reply as it is" path. */
  legacy?: boolean;
}

const titleCase = (s: string) => s.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const normalizeCitation = (citation: BackendCitation, index: number): Citation => {
  const rawType = citation.document_type ?? "Source";
  return {
    id: citation.id != null ? String(citation.id) : `${rawType}-${index}-${citation.heading ?? citation.title ?? "item"}`,
    sourceNo: citation.source_no,
    // Vendor's own document_type, passed through as-is (title-cased for
    // display) rather than collapsed into a fixed set — this is what was
    // making every non-"act" source display as "ACTS" before: unrecognized
    // types silently fell back to a hardcoded default.
    documentType: titleCase(rawType),
    heading: citation.heading ?? citation.title ?? "Untitled source",
    reference: citation.reference,
    citation: citation.citation,
    court: citation.court ?? citation.court_name,
    courtArea: citation.court_area,
    link: citation.link ?? citation.url,
    similarity: citation.similarity,
    snippet: citation.snippet,
  };
};

const normalizeCitations = (sources: BackendCitation[] | null | undefined): Citation[] =>
  // Vendor ordering is preserved — no sort applied.
  (sources ?? []).map((source, index) => normalizeCitation(source, index));

const normalizeRelatedJudgement = (j: BackendRelatedJudgement, index: number): RelatedJudgement => ({
  id: j.id != null ? String(j.id) : `related-${index}-${j.partyname ?? "case"}`,
  partyName: j.partyname ?? "Untitled case",
  court: j.court,
  facts: j.facts,
  issue: j.issue,
  held: j.held,
  ratio: j.ratio,
  link: j.link,
});

function normalizeNoticeSources(
  sources?: NoticeSources | BackendCitation[] | null
): Citation[] {
  if (!sources) return [];

  // Existing providers
  if (Array.isArray(sources)) {
    return normalizeCitations(sources);
  }

  const citations: BackendCitation[] = [];

  sources.sections?.forEach((s, index) => {
    citations.push({
      id: `section-${index}`,
      document_type: s.type,
      heading: s.heading,
      reference: s.reference,
      link: s.url,
      source_no: citations.length + 1,
    });
  });

  sources.case_laws?.forEach((c, index) => {
    citations.push({
      id: `case-${index}`,
      document_type: "Judgement",
      heading: c.partyname,
      citation: c.citation,
      court: c.court,
      link: c.url,
      source_no: citations.length + 1,
    });
  });

  sources.circulars?.forEach((c, index) => {
    citations.push({
      id: `circular-${index}`,
      document_type: "Circular",
      heading: c.heading,
      reference: c.reference,
      link: c.url,
      source_no: citations.length + 1,
    });
  });

  return normalizeCitations(citations);
}


const normalizeRelatedJudgements = (list: BackendRelatedJudgement[] | null | undefined): RelatedJudgement[] =>
  (list ?? []).map(normalizeRelatedJudgement);

const normalizeNoticeProfile = (p?: BackendNoticeProfile): NoticeProfile | undefined =>
  p
    ? {
        noticeType: p.notice_type,
        form: p.form,
        act: p.act,
        sectionsCited: p.sections_cited,
        rulesCited: p.rules_cited,
        noticeNumber: p.notice_number,
        noticeDate: p.notice_date,
        dinNumber: p.din_number,
        taxPeriod: p.tax_period,
        hearingDate: p.hearing_date,
        replyDueDate: p.reply_due_date,
        amounts: p.amounts
          ? { tax: p.amounts.tax, interest: p.amounts.interest, penalty: p.amounts.penalty, total: p.amounts.total }
          : undefined,
        issuingAuthority: p.issuing_authority
          ? {
              name: p.issuing_authority.name,
              designation: p.issuing_authority.designation,
              office: p.issuing_authority.office,
              jurisdiction: p.issuing_authority.jurisdiction,
            }
          : undefined,
        reliedUponDocuments: p.relied_upon_documents,
        annexures: p.annexures,
        missingParticulars: p.missing_particulars,
        fraudTrack: p.fraud_track,
        personalHearingOffered: p.personal_hearing_offered,
        replyForm: p.reply_form,
        deadline: p.deadline,
        category: p.category,
        noticeSummary: p.notice_summary,
      }
    : undefined;

const normalizeAllegations = (list?: BackendNoticeAllegation[]): NoticeAllegation[] | undefined =>
  list?.map((a) => ({
    id: a.id,
    allegation: a.allegation,
    section: a.section,
    amount: a.amount,
    evidenceCitedInNotice: a.evidence_cited_in_notice,
  }));

const normalizeReviewNotes = (list?: BackendNoticeReviewNote[]): NoticeReviewNote[] | undefined =>
  list?.map((n) => ({ type: n.type, note: n.note, action: n.action, includeInReply: n.include_in_reply }));

const normalizeEvidenceMatrix = (list?: BackendNoticeEvidenceMatrixRow[]): NoticeEvidenceMatrixRow[] | undefined =>
  list?.map((r) => ({
    id: r.id,
    allegation: r.allegation,
    userPosition: r.user_position,
    evidenceOffered: r.evidence_offered,
    evidenceGap: r.evidence_gap,
    inconsistency: r.inconsistency,
    status: r.status,
  }));

const normalizeRejectedFiles = (list?: BackendNoticeRejectedFile[]): NoticeRejectedFile[] | undefined =>
  list?.map((f) => ({ file: f.file, reason: f.reason }));

const normalizeAllegationCoverage = (
  list?: BackendNoticeAllegationCoverage[],
): NoticeAllegationCoverage[] | undefined =>
  list?.map((c) => ({
    allegationNo: c.allegation_no,
    addressed: c.addressed,
    replySection: c.reply_section,
    reason: c.reason,
  }));

/** Builds the full NoticeWorkflowData from any v3 turn response — analyse/submissions/draft/refine all share this shape. */
const normalizeNoticeTurn = (result: BackendNoticeTurn): NoticeWorkflowData => ({
  phase: result.phase,
  conversationId: String(result.conversation.id),
  revision: result.revision,
  noticeProfile: normalizeNoticeProfile(result.notice_profile),
  allegations: normalizeAllegations(result.allegations),
  reviewNotes: normalizeReviewNotes(result.review_notes),
  suggestedDocuments: result.suggested_documents,
  evidenceMatrix: normalizeEvidenceMatrix(result.evidence_matrix),
  followUpQuestions: result.follow_up_questions,
  unaddressedAllegations: result.unaddressed_allegations,
  extractedFacts: result.extracted_facts,
  readyToDraft: result.ready_to_draft,
  acceptedFiles: result.accepted_files,
  rejectedFiles: normalizeRejectedFiles(result.rejected_files),
  documentsOnRecord: result.documents_on_record,
  noticeType: result.notice_type,
  replyForm: result.reply_form,
  deadline: result.deadline,
  fraudTrack: result.fraud_track,
  disclaimer: result.disclaimer,
  escalationWarning: result.escalation_warning,
  allegationCoverage: normalizeAllegationCoverage(result.allegation_coverage),
  instructionApplied: result.instruction_applied,
  legacy: result.legacy,
});

const normalizeAttachment = (a: BackendAttachment | null | undefined): MessageAttachment | undefined =>
  a?.filename
    ? {
        filename: a.filename,
        contentType: a.content_type,
        size: a.size,
        downloadUrl: a.download_url ?? "",
      }
    : undefined;

/** Normalizes a message that already came pre-shaped from the backend's `serialize_message`. */
const normalizeStoredMessage = (message: BackendMessage): ChatMessage => ({
  id: String(message.id),
  role: message.role,
  content: message.content ?? "",
  createdAt: message.created_at,
  citations:
  Array.isArray(message.sources)
    ? normalizeCitations(message.sources)
    : normalizeNoticeSources(message.sources as any),
  relatedJudgements: normalizeRelatedJudgements(message.related_judgements),
  needsClarification: message.needs_clarification ?? false,
  deepResearchUsed: message.deep_research_used ?? false,
  attachment: normalizeAttachment(message.attachment),
  attachments: [],
  feedback: message.feedback ?? undefined,
  status: message.status === "processing" ? "processing" : message.status === "error" ? "error" : undefined,
  jobId: message.job_id ?? undefined,
});

const normalizeThread = (
  conversation: BackendConversation | null | undefined,
  overrides: { moduleId?: string; toolId?: string } = {},
): ChatThread | null => {
  if (!conversation || conversation.id == null) return null;

  const hasMessages = Array.isArray(conversation.messages);

  return {
    id: String(conversation.id),
    title: conversation.title || "New chat",
    // The backend is the source of truth once it has a value — the previous
    // implementation always fell back to "income-tax" regardless of what the
    // conversation actually was, which is why GST conversations kept showing
    // up under the Income Tax module.
    moduleId: conversation.module ?? overrides.moduleId ?? "gst",
    toolId:
      (conversation.provider && conversation.tool
        ? BACKEND_ROUTE_TO_UI_TOOL_MAP[`${conversation.provider}:${conversation.tool}`]
        : undefined) ?? overrides.toolId ?? "ask",
    updatedAt:
      conversation.last_message_at ?? conversation.updated_at ?? new Date().toISOString(),
    messages: hasMessages ? conversation.messages!.map(normalizeStoredMessage) : [],
    // Only present when this thread came from a full detail fetch (GET /ai/conversations/{id}),
    // so WorkspaceShell knows whether it still needs to load message history.
    hasLoadedMessages: hasMessages || undefined,
  };
};

export const workspaceService = {
  getModules: () => Promise.resolve(workspaceModules),
  getFolders: async () => {
    // No backend folders endpoint exists yet. Folders are a future feature;
    // returning an empty list keeps the sidebar's optional folder section hidden.
    return [] as { id: string; name: string; count: number }[];
  },
  getSuggestions: async (_moduleId?: string): Promise<PromptSuggestion[]> => {
    try {
      const { data } = await api.get<PromptSuggestion[]>(endpoints.workspace.templates);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      if (isAxiosError(error) && (error.response?.status === 404 || error.response?.status === 501)) {
        // TODO: backend prompt-template endpoint is not available yet.
        return promptSuggestions.filter((s) => !_moduleId || s.moduleId === _moduleId);
      }
      throw error;
    }
  },
};

export const isFileTool = (toolId: string): boolean => toolId in FILE_TOOL_ENDPOINTS;

/** Parses a thread id into the numeric backend conversation id, or throws a clear error for an unsynced ("local-") thread rather than silently sending `null`. */
const requireConversationId = (threadId: string): number => {
  const id = Number(threadId);
  if (!Number.isFinite(id)) {
    throw new Error(
      `Cannot call this endpoint for thread "${threadId}" — it hasn't been synced to the backend yet (still a local/optimistic id).`,
    );
  }
  return id;
};

/**
 * Pulls a human-readable message out of the 409 body the backend's
 * NoticeStageError raises (`{success, error, detail, stage}`) — used for
 * the staged workflow's out-of-order/legacy-mode guards, so the person
 * sees the actual explanation instead of the generic "unable to generate
 * a response" fallback bubble.
 */
const extractNoticeErrorDetail = (error: unknown, fallback: string): string => {
  if (isAxiosError(error)) {
    const body = error.response?.data as { detail?: string } | undefined;
    if (body?.detail) return body.detail;
  }
  return fallback;
};

export const chatService = {
  /** Lightweight list for the sidebar — metadata only, no message bodies, scoped to one Module+Tool workspace. */
  listThreads: async (moduleId: string, toolId: string): Promise<ChatThread[]> => {
    try {
      const route = TOOL_BACKEND_ROUTE_MAP[toolId];
      const { data } = await api.get<ApiEnvelope<BackendConversation[]>>(endpoints.ai.conversations, {
        params: { module: moduleId, provider: route?.provider, tool: route?.tool ?? toolId },
      });
      return (data.data ?? [])
        .map((conversation) => normalizeThread(conversation, { moduleId, toolId }))
        .filter((thread): thread is ChatThread => thread !== null);
    } catch (error) {
      if (isAxiosError(error) && (error.response?.status === 404 || error.response?.status === 501)) {
        return [];
      }
      throw error;
    }
  },

  /** Full conversation detail, including message history. */
  getThread: async (id: string): Promise<ChatThread | null> => {
    try {
      const { data } = await api.get<ApiEnvelope<BackendConversation>>(endpoints.ai.conversation(id));
      return normalizeThread(data.data);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  deleteThread: async (id: string): Promise<void> => {
    await api.delete(endpoints.ai.conversation(id));
  },

  sendMessage: async (
    threadId: string | null,
    prompt: string,
    context: AiQueryContext,
    signal?: AbortSignal,
  ): Promise<{ userMessage: ChatMessage; assistantMessage: ChatMessage; thread: ChatThread | null }> => {
    const route = TOOL_BACKEND_ROUTE_MAP[context.toolId];
    if (!route) {
      // Draft Assistant has no entry — no distinct backend for it (see
      // mock/workspace.ts `disabled` note). The composer is disabled for it
      // in the UI, but this guard exists so a stale client can't still fire
      // a request that would silently be treated as Ask Bot.
      throw new Error(`No backend route configured for tool "${context.toolId}".`);
    }
    if (FILE_TOOL_ENDPOINTS[context.toolId]) {
      // Notice Reply and Summarizer are multipart file-upload endpoints —
      // use sendFileMessage() instead.
      throw new Error(`Tool "${context.toolId}" must use sendFileMessage(), not sendMessage().`);
    }

    const { data } = await api.post<ApiEnvelope<BackendQueryResult>>(
      endpoints.ai.query,
      {
        query: prompt,
        // Backend field is `conversation_id` (numeric) — NOT `thread_id`. Sending the wrong
        // key here silently drops it and makes every message start a brand-new conversation.
        conversation_id: threadId ? Number(threadId) : undefined,
        provider: route.provider,
        tool: route.tool,
        module_id: context.moduleId,
      },
      { signal },
    );

    const { conversation, user_message: userMessage, assistant_message: assistantMessage } = data.data;

    const normalizedThread = normalizeThread(conversation, {
      moduleId: context.moduleId,
      toolId: context.toolId,
    });

    return {
      userMessage: {
        id: String(userMessage.id),
        role: "user",
        content: userMessage.query,
        createdAt: userMessage.created_at,
        citations: [],
        attachments: [] as Attachment[],
      },
      assistantMessage: {
        id: String(assistantMessage.id),
        role: "assistant",
        content: assistantMessage.answer ?? "",
        createdAt: assistantMessage.created_at,
        citations: normalizeCitations(assistantMessage.sources),
        relatedJudgements: normalizeRelatedJudgements(assistantMessage.related_judgements),
        needsClarification: assistantMessage.needs_clarification ?? false,
        deepResearchUsed: assistantMessage.deep_research_used ?? false,
        attachments: [],
      },
      thread: normalizedThread,
    };
  },

  /**
   * The multipart counterpart to sendMessage() — for Notice Reply and
   * Summarizer, which take an optional file (never required, matching
   * core/draft_assistant.py and core/summarizer.py) plus the query text.
   * Returns the same shape as sendMessage() so callers can treat both
   * uniformly.
   */
  sendFileMessage: async (
    threadId: string | null,
    prompt: string,
    context: AiQueryContext,
    file?: File | null,
    onUploadProgress?: (percent: number) => void,
    signal?: AbortSignal,
  ): Promise<{ userMessage: ChatMessage; assistantMessage: ChatMessage; thread: ChatThread | null }> => {
    const endpoint = FILE_TOOL_ENDPOINTS[context.toolId];
    if (!endpoint) {
      throw new Error(`Tool "${context.toolId}" is not a file-upload tool.`);
    }

    const form = new FormData();
    form.append("query", prompt);
    form.append("module_id", context.moduleId);
    if (threadId) form.append("conversation_id", threadId);
    if (file) form.append("file", file);

    const { data } = await api.post<ApiEnvelope<BackendQueryResult>>(endpoint, form, {
      headers: { "Content-Type": "multipart/form-data" },
      signal,
      onUploadProgress: onUploadProgress
        ? (event) => {
            if (event.total) onUploadProgress(Math.round((event.loaded / event.total) * 100));
          }
        : undefined,
    });

    const { conversation, user_message: userMessage, assistant_message: assistantMessage } = data.data;

    const normalizedThread = normalizeThread(conversation, {
      moduleId: context.moduleId,
      toolId: context.toolId,
    });

    return {
      userMessage: {
        id: String(userMessage.id),
        role: "user",
        content: userMessage.query,
        createdAt: userMessage.created_at,
        citations: [],
        attachments: file ? [{ id: `local-${file.name}`, name: file.name, size: file.size, type: file.type }] : [],
      },
      assistantMessage: {
        id: String(assistantMessage.id),
        role: "assistant",
        content: assistantMessage.answer ?? "",
        createdAt: assistantMessage.created_at,
        citations:
          context.toolId === "notice-reply"
            ? normalizeNoticeSources(assistantMessage.sources as any)
            : normalizeCitations(assistantMessage.sources),
        relatedJudgements: normalizeRelatedJudgements(assistantMessage.related_judgements),
        needsClarification: assistantMessage.needs_clarification ?? false,
        deepResearchUsed: assistantMessage.deep_research_used ?? false,
        status: assistantMessage.status === "processing" ? "processing" : undefined,
        jobId: assistantMessage.job_id ?? undefined,
        attachments: [],
      },
      thread: normalizedThread,
    };
  },

  /**
   * v3 Notice Agent — POST /ai/notice/analyze or /ai/notice/analyze-file.
   * Returns allegations + notice profile ONLY; the vendor's own rule is
   * "analyze never returns a draft" — the reply comes later from
   * submitNoticeFacts() (auto-drafts once every allegation is answered)
   * or draftNotice() (explicit/forced).
   */
  analyzeNotice: async (
    threadId: string | null,
    prompt: string,
    context: AiQueryContext,
    file?: File | null,
    onUploadProgress?: (percent: number) => void,
    signal?: AbortSignal,
  ): Promise<{ userMessage: ChatMessage; assistantMessage: ChatMessage; thread: ChatThread | null }> => {
    const endpoint = file ? endpoints.ai.noticeAnalyzeFile : endpoints.ai.noticeAnalyze;

    const form = new FormData();
    // The vendor's notice_text is required — pasting/attaching-only still
    // needs *some* text field, so an attach-only submission sends a
    // placeholder the backend/vendor ignore in favour of the file content.
    form.append("notice_text", prompt || (file ? `[See attached file: ${file.name}]` : ""));
    form.append("module_id", context.moduleId);
    if (threadId) form.append("conversation_id", threadId);
    if (file) form.append("file", file);

    let data: ApiEnvelope<BackendNoticeTurn>;
    try {
      ({ data } = await api.post<ApiEnvelope<BackendNoticeTurn>>(endpoint, form, {
        headers: { "Content-Type": "multipart/form-data" },
        signal,
        onUploadProgress: onUploadProgress
          ? (event) => {
              if (event.total) onUploadProgress(Math.round((event.loaded / event.total) * 100));
            }
          : undefined,
      }));
    } catch (error) {
      // Surfaces the backend's NoticeUnavailableError detail ("neither the
      // v3 nor the legacy endpoint could be reached") when both vendor
      // paths are down, instead of a generic axios error.
      throw new Error(extractNoticeErrorDetail(error, "Unable to analyse the notice. Please try again."));
    }

    const result = data.data;
    const normalizedThread = normalizeThread(result.conversation, {
      moduleId: context.moduleId,
      toolId: context.toolId,
    });

    return {
      userMessage: {
        id: String(result.user_message.id),
        role: "user",
        content: result.user_message.query,
        createdAt: result.user_message.created_at,
        citations: [],
        attachments: file ? [{ id: `local-${file.name}`, name: file.name, size: file.size, type: file.type }] : [],
      },
      assistantMessage: {
        id: String(result.assistant_message.id),
        role: "assistant",
        content: result.assistant_message.answer ?? "",
        createdAt: result.assistant_message.created_at,
        // Only populated on the legacy fallback path — a real /analyze
        // response never returns sources (no reply has been drafted yet).
        citations: normalizeNoticeSources(result.sources),
        attachments: [],
        notice: normalizeNoticeTurn(result),
      },
      thread: normalizedThread,
    };
  },

  /**
   * POST /ai/notice/submissions — the facts/evidence loop. Send facts, an
   * evidence description, an answer to a follow-up question, or a "reply
   * as it is" style message. Auto-drafts (phase "DRAFTED", full reply
   * present) once every allegation is answered.
   */
  submitNoticeFacts: async (
    threadId: string,
    message: string,
    context: AiQueryContext,
    readyToDraft = false,
    signal?: AbortSignal,
  ): Promise<{ userMessage: ChatMessage; assistantMessage: ChatMessage; thread: ChatThread | null }> => {
    let data: ApiEnvelope<BackendNoticeTurn>;
    try {
      ({ data } = await api.post<ApiEnvelope<BackendNoticeTurn>>(
        endpoints.ai.noticeSubmissions,
        { conversation_id: requireConversationId(threadId), message, ready_to_draft: readyToDraft },
        { signal },
      ));
    } catch (error) {
      throw new Error(extractNoticeErrorDetail(error, "Unable to submit those details. Please try again."));
    }

    const result = data.data;
    const normalizedThread = normalizeThread(result.conversation, { moduleId: context.moduleId, toolId: context.toolId });

    return {
      userMessage: {
        id: String(result.user_message.id),
        role: "user",
        content: result.user_message.query,
        createdAt: result.user_message.created_at,
        citations: [],
        attachments: [],
      },
      assistantMessage: {
        id: String(result.assistant_message.id),
        role: "assistant",
        content: result.assistant_message.answer ?? "",
        createdAt: result.assistant_message.created_at,
        citations: normalizeNoticeSources(result.sources),
        attachments: [],
        notice: normalizeNoticeTurn(result),
      },
      thread: normalizedThread,
    };
  },

  /**
   * POST /ai/notice/submissions-file — multipart evidence upload, multiple
   * files in one call. `forceDraft: true` (the "Reply" action) guarantees a
   * generated reply comes back in this same call — chained server-side to
   * an explicit forced draft if the vendor's own upload response doesn't
   * already include one.
   */
  submitNoticeEvidenceFile: async (
    threadId: string,
    files: File[],
    note: string,
    context: AiQueryContext,
    forceDraft = false,
    onUploadProgress?: (percent: number) => void,
    signal?: AbortSignal,
  ): Promise<{ userMessage: ChatMessage; assistantMessage: ChatMessage; thread: ChatThread | null }> => {
    const form = new FormData();
    form.append("conversation_id", threadId);
    if (note) form.append("note", note);
    if (forceDraft) form.append("force_draft", "true");
    files.forEach((f) => form.append("files", f));

    let data: ApiEnvelope<BackendNoticeTurn>;
    try {
      ({ data } = await api.post<ApiEnvelope<BackendNoticeTurn>>(endpoints.ai.noticeSubmissionsFile, form, {
        headers: { "Content-Type": "multipart/form-data" },
        signal,
        onUploadProgress: onUploadProgress
          ? (event) => {
              if (event.total) onUploadProgress(Math.round((event.loaded / event.total) * 100));
            }
          : undefined,
      }));
    } catch (error) {
      throw new Error(extractNoticeErrorDetail(error, "Unable to submit that evidence. Please try again."));
    }

    const result = data.data;
    const normalizedThread = normalizeThread(result.conversation, { moduleId: context.moduleId, toolId: context.toolId });
    const attachments = files.map((f) => ({ id: `local-${f.name}`, name: f.name, size: f.size, type: f.type }));

    return {
      userMessage: {
        id: String(result.user_message.id),
        role: "user",
        content: result.user_message.query,
        createdAt: result.user_message.created_at,
        citations: [],
        attachments,
      },
      assistantMessage: {
        id: String(result.assistant_message.id),
        role: "assistant",
        content: result.assistant_message.answer ?? "",
        createdAt: result.assistant_message.created_at,
        citations: normalizeNoticeSources(result.sources),
        attachments: [],
        notice: normalizeNoticeTurn(result),
      },
      thread: normalizedThread,
    };
  },

  /** POST /ai/notice/draft — force a draft explicitly, optionally with extra instructions or the DIN ground included. */
  draftNotice: async (
    threadId: string,
    options: { includeDinGround?: boolean; extraInstruction?: string; force?: boolean } | undefined,
    context: AiQueryContext,
    signal?: AbortSignal,
  ): Promise<{ userMessage: ChatMessage; assistantMessage: ChatMessage; thread: ChatThread | null }> => {
    let data: ApiEnvelope<BackendNoticeTurn>;
    try {
      ({ data } = await api.post<ApiEnvelope<BackendNoticeTurn>>(
        endpoints.ai.noticeDraft,
        {
          conversation_id: requireConversationId(threadId),
          include_din_ground: options?.includeDinGround ?? false,
          extra_instruction: options?.extraInstruction ?? "",
          force: options?.force ?? false,
        },
        { signal },
      ));
    } catch (error) {
      throw new Error(extractNoticeErrorDetail(error, "Unable to draft the reply. Please try again."));
    }

    const result = data.data;
    const normalizedThread = normalizeThread(result.conversation, { moduleId: context.moduleId, toolId: context.toolId });

    return {
      userMessage: {
        id: String(result.user_message.id),
        role: "user",
        content: result.user_message.query,
        createdAt: result.user_message.created_at,
        citations: [],
        attachments: [],
      },
      assistantMessage: {
        id: String(result.assistant_message.id),
        role: "assistant",
        content: result.assistant_message.answer ?? "",
        createdAt: result.assistant_message.created_at,
        citations: normalizeNoticeSources(result.sources),
        attachments: [],
        notice: normalizeNoticeTurn(result),
      },
      thread: normalizedThread,
    };
  },

  /** POST /ai/notice/refine — repeatable; edits the current draft. v3 has no draft_id, acts on the session implicitly. */
  refineNoticeReply: async (
    threadId: string,
    instruction: string,
    context: AiQueryContext,
    signal?: AbortSignal,
  ): Promise<{ userMessage: ChatMessage; assistantMessage: ChatMessage; thread: ChatThread | null }> => {
    let data: ApiEnvelope<BackendNoticeTurn>;
    try {
      ({ data } = await api.post<ApiEnvelope<BackendNoticeTurn>>(
        endpoints.ai.noticeRefine,
        { conversation_id: requireConversationId(threadId), instruction },
        { signal },
      ));
    } catch (error) {
      throw new Error(extractNoticeErrorDetail(error, "Unable to refine the reply. Please try again."));
    }

    const result = data.data;
    const normalizedThread = normalizeThread(result.conversation, { moduleId: context.moduleId, toolId: context.toolId });

    return {
      userMessage: {
        id: String(result.user_message.id),
        role: "user",
        content: result.user_message.query,
        createdAt: result.user_message.created_at,
        citations: [],
        attachments: [],
      },
      assistantMessage: {
        id: String(result.assistant_message.id),
        role: "assistant",
        content: result.assistant_message.answer ?? "",
        createdAt: result.assistant_message.created_at,
        citations: [],
        attachments: [],
        notice: normalizeNoticeTurn(result),
      },
      thread: normalizedThread,
    };
  },

  /**
   * POST /ai/notice/ask — COMPATIBILITY endpoint only (v3 has no
   * standalone ask API). The backend dispatches this internally to
   * submissions or refine depending on phase. Prefer submitNoticeFacts /
   * refineNoticeReply directly in new code.
   */
  askNotice: async (
    threadId: string,
    question: string,
    context: AiQueryContext,
    signal?: AbortSignal,
  ): Promise<{ userMessage: ChatMessage; assistantMessage: ChatMessage; thread: ChatThread | null }> => {
    let data: ApiEnvelope<BackendNoticeTurn>;
    try {
      ({ data } = await api.post<ApiEnvelope<BackendNoticeTurn>>(
        endpoints.ai.noticeAsk,
        { conversation_id: requireConversationId(threadId), question },
        { signal },
      ));
    } catch (error) {
      throw new Error(extractNoticeErrorDetail(error, "Unable to answer that question. Please try again."));
    }

    const result = data.data;
    const normalizedThread = normalizeThread(result.conversation, { moduleId: context.moduleId, toolId: context.toolId });

    return {
      userMessage: {
        id: String(result.user_message.id),
        role: "user",
        content: result.user_message.query,
        createdAt: result.user_message.created_at,
        citations: [],
        attachments: [],
      },
      assistantMessage: {
        id: String(result.assistant_message.id),
        role: "assistant",
        content: result.assistant_message.answer ?? "",
        createdAt: result.assistant_message.created_at,
        citations: normalizeNoticeSources(result.sources),
        attachments: [],
        notice: normalizeNoticeTurn(result),
      },
      thread: normalizedThread,
    };
  },

  /**
   * Clarifies a draft prompt via the vendor's Clarify API. Real contract
   * (confirmed against api_io_reference.md) is `{query}` in — no
   * previous-answer/session fields — and out comes either
   * `{needs_clarification: false}` (prompt is already clear, nothing to do)
   * or `{needs_clarification: true, options: [...]}`: a list of more
   * specific candidate questions for the user to pick from, NOT a single
   * "improved" prompt to auto-fill.
   */
  clarify: async (
    query: string,
    toolId: string,
    signal?: AbortSignal,
  ): Promise<{ needsClarification: boolean; options: string[] }> => {
    const provider = TOOL_BACKEND_ROUTE_MAP[toolId]?.provider ?? "main";
    const { data } = await api.post<ApiEnvelope<{ needs_clarification?: boolean; options?: string[] }>>(
      endpoints.ai.clarify,
      { query, provider },
      { signal },
    );
    return {
      needsClarification: data.data?.needs_clarification ?? false,
      options: data.data?.options ?? [],
    };
  },

  submitFeedback: async (messageId: string, rating: "up" | "down"): Promise<void> => {
    await api.post(endpoints.ai.messageFeedback(messageId), { rating });
  },

  refineMessage: async (messageId: string, instruction: string): Promise<ChatMessage> => {
    const { data } = await api.post<ApiEnvelope<BackendMessage>>(endpoints.ai.messageRefine(messageId), {
      instruction,
    });
    return normalizeStoredMessage(data.data);
  },

  /** GET /ai/summarize/status/{job_id} — progress info for an async Summarizer job. */
  getSummarizeStatus: async (
    jobId: string,
  ): Promise<{ status: string; stage?: string; progress?: number }> => {
    const { data } = await api.get<ApiEnvelope<{ status: string; stage?: string; progress?: number }>>(
      endpoints.ai.summarizeStatus(jobId),
    );
    return data.data;
  },

  /**
   * GET /ai/summarize/result/{job_id} — call once status is "done". Returns
   * `ready: false` (with progress) if polled too early, or the finalized
   * message once ready. Idempotent on the backend.
   */
  getSummarizeResult: async (
    jobId: string,
  ): Promise<
    | { ready: true; conversationId: string; message: ChatMessage }
    | { ready: false; status?: string; stage?: string; progress?: number }
  > => {
    const { data } = await api.get<
      ApiEnvelope<{ ready: boolean; conversation_id?: number; message?: BackendMessage; status?: string; stage?: string; progress?: number }>
    >(endpoints.ai.summarizeResult(jobId));

    if (data.data.ready && data.data.message) {
      return {
        ready: true,
        conversationId: String(data.data.conversation_id),
        message: normalizeStoredMessage(data.data.message),
      };
    }

    return { ready: false, status: data.data.status, stage: data.data.stage, progress: data.data.progress };
  },
};