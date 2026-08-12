/* eslint-disable prettier/prettier */
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Copy, Check, Download, Wand2, ThumbsDown, ThumbsUp, Scale, FileText, BookOpen, Bell,
  AlertTriangle, Loader2, HelpCircle, Microscope, Paperclip, FileType, Gavel, ListOrdered,
  ChevronDown, FileArchive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/store";
import { chatService } from "@/services/workspace.service";
import type { ChatMessage, Citation } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const REFINE_SUGGESTIONS = ["Make it more formal", "Summarize", "Explain in simple language", "Add more case law"];

/**
 * Icon per document_type, case-insensitive, with a sane fallback for any
 * type the vendor introduces later — this is what was previously missing,
 * causing every non-"act" source to silently render as a generic type.
 */
function citationIcon(documentType: string) {
  const key = documentType.toLowerCase();
  if (key.includes("judgement") || key.includes("judgment") || key.includes("case")) return Scale;
  if (key.includes("circular")) return FileText;
  if (key.includes("notification")) return Bell;
  if (key.includes("rule")) return Gavel;
  if (key.includes("section")) return ListOrdered;
  if (key.includes("order")) return FileType;
  if (key.includes("act") || key.includes("statute")) return BookOpen;
  return BookOpen;
}

/** Turns "(Source N)" mentions into clickable links to the matching citation card below. */
function preprocessSourceLinks(content: string, messageId: string): string {
  return content.replace(/\(Source (\d+)\)/g, (match, n) => `[${match}](#source-${messageId}-${n})`);
}

export function ChatMessageBubble({ message, threadId }: { message: ChatMessage; threadId: string }) {
  const isUser = message.role === "user";
  const isError = message.status === "error";
  const isPending = message.status === "pending";
  const isProcessing = message.status === "processing";
  const isClarification = !isUser && message.needsClarification;
  const [copied, setCopied] = useState(false);
  const [isRefineOpen, setIsRefineOpen] = useState(false);
  const [exporting, setExporting] = useState<"pdf" | "docx" | null>(null);

  // Optimistic/local-only messages (e.g. still in flight, or an error bubble)
  // don't have a real backend message id yet — feedback and refine both need
  // one, so they're disabled rather than firing a request that can't succeed.
  const hasBackendId = !message.id.startsWith("local-");

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(message.content);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = message.content;

        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";

        document.body.appendChild(textArea);

        textArea.focus();
        textArea.select();

        document.execCommand("copy");

        document.body.removeChild(textArea);
      }

      setCopied(true);
      toast.success("Copied to clipboard");

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch (err) {
      console.error(err);
      toast.error("Unable to copy.");
    }
  };

  /**
   * The prompt that produced this answer, read non-reactively at click time so
   * the bubble never re-renders because of it.
   */
  const findQuestion = () => {
    const thread = useChatStore.getState().threads.find((t) => t.id === threadId);
    const messages = thread?.messages ?? [];
    const idx = messages.findIndex((m) => m.id === message.id);
    for (let i = (idx === -1 ? messages.length : idx) - 1; i >= 0; i -= 1) {
      if (messages[i].role === "user") return messages[i].content;
    }
    return undefined;
  };

  const runExport = async (format: "pdf" | "docx") => {
    if (exporting) return;
    setExporting(format);
    const toastId = toast.loading(`Preparing ${format === "pdf" ? "PDF" : "Word"} document…`);
    try {
      const { exportMessageAsPdf, exportMessageAsWord } = await import("@/utils/export");
      const opts = { message, question: findQuestion() };
      if (format === "pdf") await exportMessageAsPdf(opts);
      else await exportMessageAsWord(opts);
      toast.success(`${format === "pdf" ? "PDF" : "Word document"} downloaded`, { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Export failed. Please try again.", { id: toastId });
    } finally {
      setExporting(null);
    }
  };

  const exportPdf = () => runExport("pdf");
  const exportWord = () => runExport("docx");

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: isPending ? 0.6 : 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}
    >
      {!isUser && (
        <div
          className={cn(
            "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-bold",
            isError
              ? "bg-destructive/15 text-destructive"
              : isClarification
                ? "bg-amber-500/15 text-amber-600"
                : "gradient-primary text-primary-foreground",
          )}
        >
          {isError ? <AlertTriangle className="h-4 w-4" /> : isClarification ? <HelpCircle className="h-4 w-4" /> : "ITL"}
        </div>
      )}
      <div className={cn("max-w-4xl min-w-0", isUser ? "text-left" : "")}>
        {/* needs_clarification: this is a clarifying QUESTION, not a real
            answer — rendered with a distinct border/badge rather than as a
            normal assistant reply, so it's never mistaken for one. */}
        {isClarification && (
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-amber-600">
            <HelpCircle className="h-3 w-3" />
            Clarification needed
          </div>
        )}

        {isUser && message.attachment && (
          <div className="mb-1.5 inline-flex items-center gap-2 rounded-lg border border-border/60 bg-card/60 px-3 py-1.5 text-[12px]">
            <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="max-w-[200px] truncate">{message.attachment.filename}</span>
            <a
              href={message.attachment.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Download
            </a>
          </div>
        )}

        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-[15px] leading-relaxed",
            isUser
              ? "bg-primary text-primary-foreground shadow-soft"
              : isError
                ? "border border-destructive/30 bg-destructive/8 text-destructive"
                : isClarification
                  ? "border border-amber-500/30 bg-amber-500/8"
                  : "bg-card text-card-foreground border border-border/60 shadow-soft",
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : isProcessing ? (
            <ProcessingIndicator progress={message.progress} stage={message.stage} />
          ) : (
            <div className="markdown-body space-y-2 text-[15px] leading-[1.7]">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: (p) => <h1 className="text-lg font-semibold tracking-tight" {...p} />,
                  h2: (p) => <h2 className="text-base font-semibold tracking-tight" {...p} />,
                  p: (p) => <p className="my-2 whitespace-pre-wrap" {...p} />,
                  ul: (p) => <ul className="my-2 list-disc pl-5 space-y-1" {...p} />,
                  ol: (p) => <ol className="my-2 list-decimal pl-5 space-y-1" {...p} />,
                  strong: (p) => <strong className="font-semibold text-foreground" {...p} />,
                  em: (p) => <em className="italic" {...p} />,
                  code: (p) => (
                    <code className="rounded bg-muted px-1 py-0.5 font-mono text-[13px]" {...p} />
                  ),
                  pre: (p) => (
                    <pre className="my-3 overflow-x-auto rounded-xl border border-border bg-muted p-3 font-mono text-[13px] leading-relaxed" {...p} />
                  ),
                  table: (p) => (
                    <div className="my-3 overflow-x-auto rounded-xl border border-border">
                      <table className="w-full text-left text-sm" {...p} />
                    </div>
                  ),
                  th: (p) => <th className="border-b border-border bg-muted px-3 py-2 font-semibold" {...p} />,
                  td: (p) => <td className="border-b border-border px-3 py-2 last:border-b-0" {...p} />,
                  a: ({ href, ...p }) =>
                    href?.startsWith("#source-") ? (
                      <a
                        href={href}
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById(href.slice(1))?.scrollIntoView({ behavior: "smooth", block: "center" });
                        }}
                        className="rounded bg-primary/10 px-1 py-0.5 text-[12px] font-medium text-primary no-underline hover:bg-primary/20"
                        {...p}
                      />
                    ) : (
                      <a className="text-primary underline-offset-2 hover:underline" target="_blank" rel="noopener noreferrer" href={href} {...p} />
                    ),
                }}
              >
                {preprocessSourceLinks(message.content, message.id)}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {!isUser && !isError && !isClarification && !isProcessing && message.deepResearchUsed && (
          <div className="mt-2">
            <Badge variant="outline" className="gap-1 rounded-full border-violet-500/30 bg-violet-500/10 py-0.5 text-[10px] text-violet-600">
              <Microscope className="h-2.5 w-2.5" /> Deep Research
            </Badge>
          </div>
        )}

        {!isUser && !isError && !isClarification && !isProcessing && message.citations && message.citations.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {message.citations.map((c) => (
              <CitationChip key={c.id} citation={c} messageId={message.id} />
            ))}
          </div>
        )}

        {!isUser && !isError && !isProcessing && (
          <>
            <div className="mt-2 flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-7 gap-1.5 px-2 text-[11px] text-muted-foreground" onClick={handleCopy}>
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? "Copied" : "Copy"}
              </Button>
              {!isClarification && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1.5 px-2 text-[11px] text-muted-foreground"
                    >
                      {exporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                      Export
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={exportPdf} disabled={exporting !== null}>
                      <FileArchive className="mr-2 h-4 w-4" />
                      Export as PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={exportWord} disabled={exporting !== null}>
                      <FileText className="mr-2 h-4 w-4" />
                      Export as Word
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {!isClarification && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 px-2 text-[11px] text-muted-foreground"
                  disabled={!hasBackendId}
                  title={hasBackendId ? undefined : "Still saving — try again in a moment"}
                  onClick={() => setIsRefineOpen(true)}
                >
                  <Wand2 className="h-3 w-3" /> Refine
                </Button>
              )}
              {!isClarification && (
                <>
                  <span className="mx-1 h-3.5 w-px bg-border" />
                  <FeedbackButtons threadId={threadId} message={message} disabled={!hasBackendId} />
                </>
              )}
            </div>
            {!isClarification && (
              <RefineDialog open={isRefineOpen} onOpenChange={setIsRefineOpen} threadId={threadId} message={message} />
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

function CitationChip({ citation, messageId }: { citation: Citation; messageId: string }) {
  const Icon = citationIcon(citation.documentType);
  const content = (
    <Badge
      id={citation.sourceNo != null ? `source-${messageId}-${citation.sourceNo}` : undefined}
      variant="outline"
      className="gap-1.5 rounded-lg border-border/70 bg-card/60 py-1 pr-2 pl-1.5 font-medium transition-colors hover:border-primary/40"
      title={citation.snippet}
    >
      <Icon className="h-3 w-3" />
      <span className="text-[11px]">{citation.heading}</span>
      <span className="text-[10px] text-muted-foreground">{citation.documentType}</span>
    </Badge>
  );

  return citation.link ? (
    <a href={citation.link} target="_blank" rel="noopener noreferrer" className="no-underline">
      {content}
    </a>
  ) : (
    content
  );
}

function FeedbackButtons({
  threadId,
  message,
  disabled,
}: {
  threadId: string;
  message: ChatMessage;
  disabled: boolean;
}) {
  const updateMessage = useChatStore((s) => s.updateMessage);
  const [submitting, setSubmitting] = useState<"up" | "down" | null>(null);
  const alreadyGiven = message.feedback;

  const submit = async (rating: "up" | "down") => {
    if (disabled || alreadyGiven || submitting) return;
    setSubmitting(rating);
    try {
      await chatService.submitFeedback(message.id, rating);
      updateMessage(threadId, message.id, { feedback: rating });
    } catch {
      toast.error("Couldn't submit feedback — please try again.");
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        disabled={disabled || !!alreadyGiven || submitting === "down"}
        onClick={() => submit("up")}
        title="Good response"
        className={cn(
          "h-7 w-7",
          alreadyGiven === "up" ? "text-primary" : "text-muted-foreground",
        )}
      >
        {submitting === "up" ? <Loader2 className="h-3 w-3 animate-spin" /> : <ThumbsUp className="h-3 w-3" fill={alreadyGiven === "up" ? "currentColor" : "none"} />}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        disabled={disabled || !!alreadyGiven || submitting === "up"}
        onClick={() => submit("down")}
        title="Bad response"
        className={cn(
          "h-7 w-7",
          alreadyGiven === "down" ? "text-destructive" : "text-muted-foreground",
        )}
      >
        {submitting === "down" ? <Loader2 className="h-3 w-3 animate-spin" /> : <ThumbsDown className="h-3 w-3" fill={alreadyGiven === "down" ? "currentColor" : "none"} />}
      </Button>
    </>
  );
}

function RefineDialog({
  open,
  onOpenChange,
  threadId,
  message,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  threadId: string;
  message: ChatMessage;
}) {
  const [instruction, setInstruction] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const addMessage = useChatStore((s) => s.addMessage);

  const handleSubmit = async () => {
    const trimmed = instruction.trim();
    if (!trimmed || isRefining) return;
    setIsRefining(true);
    try {
      // Appended as a NEW assistant message — the original answer is never
      // overwritten, and the conversation history stays intact.
      const refined = await chatService.refineMessage(message.id, trimmed);
      addMessage(threadId, refined);
      setInstruction("");
      onOpenChange(false);
    } catch {
      toast.error("Couldn't refine that answer — please try again.");
    } finally {
      setIsRefining(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !isRefining && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Refine this answer</DialogTitle>
          <DialogDescription>How would you like to refine this answer?</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {REFINE_SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setInstruction(s)}
                className="rounded-full border border-border/60 bg-card/60 px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
          <Textarea
            autoFocus
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="e.g. Make it more formal, or add more case law…"
            rows={3}
            disabled={isRefining}
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isRefining}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!instruction.trim() || isRefining} className="gap-1.5">
            {isRefining && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isRefining ? "Refining…" : "Refine"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProcessingIndicator({ progress, stage }: { progress?: number; stage?: string }) {
  const pct = Math.round((progress ?? 0) * 100);
  return (
    <div className="py-1">
      <div className="mb-1.5 flex items-center gap-2 text-[13px] text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        {stage || "Processing your document…"}
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${Math.max(4, pct)}%` }}
        />
      </div>
      {progress != null && <p className="mt-1 text-[11px] text-muted-foreground">{pct}%</p>}
    </div>
  );
}


const THINKING_PHASES = [
  { after: 0, label: "Reading your question..." },
  { after: 8, label: "Searching statutes and case law..." },
  { after: 24, label: "Reviewing relevant precedents..." },
  { after: 40, label: "Cross-checking legal citations..." },
  { after: 70, label: "Verifying the analysis..." },
  { after: 110, label: "Preparing the final response..." },
  { after: 160, label: "Still working — complex queries may take a little longer..." },
];

export function TypingIndicator() {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(
      () => setElapsed(Math.floor((Date.now() - start) / 1000)),
      1000,
    );

    return () => clearInterval(id);
  }, []);

  const phase =
    [...THINKING_PHASES].reverse().find((p) => elapsed >= p.after) ??
    THINKING_PHASES[0];

  const MAX_THINKING_TIME = 240;

  const progressPct = Math.min(
    100,
    Math.round((1 - Math.exp(-elapsed / 80)) * 100),
  );

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const elapsedLabel =
    minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex items-start gap-3 px-1 py-2"
    >
      <div className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full gradient-primary text-xs font-bold text-primary-foreground shadow-md">
        ITL
      </div>
      <div className="min-w-[300px] max-w-md rounded-2xl border border-border bg-card px-5 py-4 shadow-lg">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />

          <span className="font-semibold text-foreground">
            Thinking
          </span>

          <div className="ml-auto flex gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span
              className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"
              style={{ animationDelay: "150ms" }}
            />
            <span
              className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"
              style={{ animationDelay: "300ms" }}
            />
          </div>
        </div>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {phase.label}
        </p>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
            style={{
              width: `${Math.max(5, progressPct)}%`,
            }}
          />
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>{elapsedLabel} elapsed</span>

          <span>{progressPct}%</span>
        </div>
      </div>
    </motion.div>
  );
}