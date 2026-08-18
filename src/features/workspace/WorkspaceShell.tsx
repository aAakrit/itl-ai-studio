/* eslint-disable prettier/prettier */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { PanelLeftOpen, PanelRightOpen, Share2, MoreHorizontal, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/common/Icon";
import { WorkspaceSidebar } from "./WorkspaceSidebar";
import { ContextPanel } from "./ContextPanel";
import { PromptComposer } from "./PromptComposer";
import { ChatMessageBubble, TypingIndicator } from "./ChatMessage";
import { useSidebarStore, useWorkspaceStore, useChatStore } from "@/store";
import { useWorkspaceModules } from "@/hooks";
import { chatService, isFileTool } from "@/services/workspace.service";
import { cn, generateId } from "@/lib/utils";
import type { ChatMessage } from "@/types";
import { Logo } from "@/components/common/Logo";
import { siteConfig } from "@/config/site";

const ERROR_MESSAGE_CONTENT = "⚠ Unable to generate a response.\n\nPlease try again.";

const createOptimisticMessage = (content: string, file?: File | null): ChatMessage => ({
  id: `local-${generateId()}`,
  role: "user",
  content: content || (file ? `Attached: ${file.name}` : ""),
  createdAt: new Date().toISOString(),
  status: "pending",
  attachments: file ? [{ id: `local-${file.name}`, name: file.name, size: file.size, type: file.type }] : [],
});

const createErrorMessage = (): ChatMessage => ({
  id: `local-${generateId()}`,
  role: "assistant",
  content: ERROR_MESSAGE_CONTENT,
  createdAt: new Date().toISOString(),
  status: "error",
});

export function WorkspaceShell() {
  const leftOpen = useSidebarStore((s) => s.leftOpen);
  const rightOpen = useSidebarStore((s) => s.rightOpen);
  const toggleLeft = useSidebarStore((s) => s.toggleLeft);
  const toggleRight = useSidebarStore((s) => s.toggleRight);

  const activeThreadId = useWorkspaceStore((s) => s.activeThreadId);
  const activeToolId = useWorkspaceStore((s) => s.activeToolId);
  const setTool = useWorkspaceStore((s) => s.setTool);
  const activeModuleId = useWorkspaceStore((s) => s.activeModuleId);
  const setThread = useWorkspaceStore((s) => s.setThread);

  const { data: modules } = useWorkspaceModules();

  const threads = useChatStore((s) => s.threads);
  const addMessage = useChatStore((s) => s.addMessage);
  const replaceMessage = useChatStore((s) => s.replaceMessage);
  const updateMessage = useChatStore((s) => s.updateMessage);
  const createThread = useChatStore((s) => s.createThread);
  const deleteThread = useChatStore((s) => s.deleteThread);
  const upsertThread = useChatStore((s) => s.upsertThread);

  const activeModule = modules?.find((m) => m.id === activeModuleId);
  const activeTool = activeModule?.tools.find((t) => t.id === activeToolId);
  const thread = useMemo(
    () => threads.find((t) => t.id === activeThreadId) ?? null,
    [threads, activeThreadId],
  );

  // "sending" covers the single request/response round trip. Kept separate from
  // transport concerns so a future SSE/WebSocket implementation only needs to
  // change how these flags get flipped, not anything that reads them.
  const [isSending, setIsSending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | undefined>(undefined);
  const submissionInFlight = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // If the user switches Module or Tool while a request is still in flight,
  // that request now belongs to a workspace they've navigated away from —
  // abort it. handleSend's catch block checks `aborted` and skips showing
  // an error bubble for this case (it's not a failure, it's a cancellation).
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeModuleId, activeToolId]);

  // Tracks which thread ids we've already requested full message history for,
  // so we don't refetch on every render and don't confuse "genuinely empty
  // brand-new thread" with "history not loaded yet".
  const loadingHistoryFor = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!thread) return;
    if (thread.hasLoadedMessages) return;
    if (thread.id.startsWith("local-")) return; // optimistic thread, nothing to fetch yet
    if (loadingHistoryFor.current.has(thread.id)) return;

    loadingHistoryFor.current.add(thread.id);

    chatService
      .getThread(thread.id)
      .then((fullThread) => {
        if (fullThread) {
          upsertThread(fullThread);
        }
      })
      .catch(() => {
        // Leave the thread as-is; the user can still send new messages.
      })
      .finally(() => {
        loadingHistoryFor.current.delete(thread.id);
      });
  }, [thread, upsertThread]);

  // ------------------------------------------------------------------
  // Async job polling (Summarizer large-document flow) — any message
  // that comes back with status "processing" + a jobId gets polled here
  // automatically until it resolves, regardless of which thread it's on.
  // ------------------------------------------------------------------
  const pollingJobsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const processingMessages = threads.flatMap((t) =>
      t.messages.filter((m) => m.status === "processing" && m.jobId).map((m) => ({ threadId: t.id, message: m })),
    );

    for (const { threadId: msgThreadId, message } of processingMessages) {
      const jobId = message.jobId!;
      if (pollingJobsRef.current.has(jobId)) continue;
      pollingJobsRef.current.add(jobId);

      (async () => {
        try {
          // eslint-disable-next-line no-constant-condition
          while (true) {
            const s = await chatService.getSummarizeStatus(jobId);
            updateMessage(msgThreadId, message.id, { progress: s.progress, stage: s.stage });

            if (s.status === "done") {
              const result = await chatService.getSummarizeResult(jobId);
              if (result.ready) {
                replaceMessage(msgThreadId, message.id, result.message);
              } else {
                // Vendor said done but result isn't ready yet — one more pass.
                continue;
              }
              break;
            }

            if (s.status === "error") {
              replaceMessage(msgThreadId, message.id, createErrorMessage());
              break;
            }

            await new Promise((r) => setTimeout(r, 2500));
          }
        } catch {
          replaceMessage(msgThreadId, message.id, createErrorMessage());
        } finally {
          pollingJobsRef.current.delete(jobId);
        }
      })();
    }
  }, [threads, updateMessage, replaceMessage]);

  // ------------------------------------------------------------------
  // Auto-scroll — fires on every state change that can move the bottom
  // of the message list: new user message, new assistant reply,
  // switching conversations, and the thinking indicator appearing/disappearing.
  // ------------------------------------------------------------------
  const scrollAnchorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [thread?.id, thread?.messages.length, isSending]);

  const handleSend = useCallback(
    async (prompt: string, file?: File | null) => {
      if (submissionInFlight.current) return;
      if (activeTool?.disabled || activeModule?.disabled) return; // composer is disabled for these too; this is a hard backstop
      if (!prompt.trim() && !file) return;
      submissionInFlight.current = true;

      // Snapshot the workspace this message is being sent in. If the user
      // switches module/tool before the response comes back, we still want
      // the conversation saved correctly — we just must not yank them back
      // into a workspace they've since navigated away from.
      const requestModuleId = activeModuleId;
      const requestToolId = activeToolId;
      const isSameWorkspace = () => {
        const live = useWorkspaceStore.getState();
        return live.activeModuleId === requestModuleId && live.activeToolId === requestToolId;
      };

      // A thread only counts as "existing" once it has a real backend id —
      // a thread still sitting on its optimistic "local-" id (e.g. because
      // the very first analyze/query call for it failed and the user is
      // retrying) must be treated as a new conversation again, not routed
      // through askNotice/sendMessage's "existing conversation" branch with
      // a non-numeric id. Number("local-xxx") is NaN, which JSON.stringify
      // silently turns into null — that was surfacing as a 422
      // "conversation_id: none is not an allowed value" on /notice/ask.
      const isNewConversation = !thread || thread.id.startsWith("local-");
      const optimisticUserMessage = createOptimisticMessage(prompt, file);

      // Optimistic UI: the user's message appears instantly, before the backend
      // has even been asked. New conversations switch to their (temporary) thread
      // immediately rather than waiting on a round trip.
      let localThreadId = thread?.id ?? null;
      if (isNewConversation) {
        localThreadId = `local-${generateId()}`;
        createThread({
          id: localThreadId,
          title: (prompt || file?.name || "New chat").slice(0, 60),
          moduleId: requestModuleId,
          toolId: requestToolId,
          updatedAt: new Date().toISOString(),
          messages: [optimisticUserMessage],
          hasLoadedMessages: true,
        });
        setThread(localThreadId);
      } else {
        addMessage(localThreadId!, optimisticUserMessage);
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsSending(true);
      if (file) setUploadProgress(0);
      try {
        const backendConversationId = isNewConversation ? null : localThreadId;
        const context = { moduleId: requestModuleId, toolId: requestToolId };

        // Notice Reply now runs the staged workflow (analyse -> draft ->
        // refine): the composer's first message in a new conversation
        // always analyses the pasted/attached notice; a typed follow-up in
        // an existing notice conversation is a grounded question (§B5),
        // never a redraft — drafting/refining happen from the dedicated
        // controls on the notice card itself, not free text here.
        const { userMessage, assistantMessage, thread: backendThread } =
          requestToolId === "notice-reply"
            ? isNewConversation
              ? await chatService.analyzeNotice(
                  backendConversationId,
                  prompt,
                  context,
                  file,
                  setUploadProgress,
                  controller.signal,
                )
              : await chatService.askNotice(localThreadId!, prompt, context, controller.signal)
            : isFileTool(requestToolId)
              ? await chatService.sendFileMessage(
                  backendConversationId,
                  prompt,
                  context,
                  file,
                  setUploadProgress,
                  controller.signal,
                )
              : await chatService.sendMessage(backendConversationId, prompt, context, controller.signal);

        if (isNewConversation && backendThread) {
          // Swap the temporary local thread for the real, backend-assigned one.
          deleteThread(localThreadId!);
          upsertThread({ ...backendThread, messages: [userMessage, assistantMessage], hasLoadedMessages: true });
          // Only force-navigate if the user is still looking at the workspace
          // this reply belongs to — otherwise it just quietly lands in the
          // sidebar for whenever they come back to it.
          if (isSameWorkspace()) setThread(backendThread.id);
        } else if (localThreadId) {
          replaceMessage(localThreadId, optimisticUserMessage.id, userMessage);
          addMessage(localThreadId, assistantMessage);
          if (backendThread) {
            // Metadata only (title/updatedAt) — messages are omitted so the
            // store's merge logic preserves what's already on screen.
            upsertThread({ id: backendThread.id, title: backendThread.title, updatedAt: backendThread.updatedAt });
          }
        }
      } catch (error) {
        if (axios.isCancel(error)) {
          // User navigated away from this workspace — not a failure, no error bubble.
          return;
        }
        if (localThreadId) {
          if (isNewConversation) {
            // Keep the optimistic message but mark it settled so it doesn't look
            // permanently "pending"; the conversation only really exists locally
            // until a message succeeds, but we still surface the failure in place.
            replaceMessage(localThreadId, optimisticUserMessage.id, { ...optimisticUserMessage, status: undefined });
          }
          addMessage(localThreadId, createErrorMessage());
        }
      } finally {
        setIsSending(false);
        setUploadProgress(undefined);
        submissionInFlight.current = false;
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      }
    },
    [
      thread,
      activeModuleId,
      activeToolId,
      activeTool,
      activeModule,
      createThread,
      setThread,
      addMessage,
      deleteThread,
      upsertThread,
      replaceMessage,
    ],
  );

  // Stage 2/3 of the Notice Agent workflow (draft / refine) are triggered
  // from controls inside the notice card itself (NoticeWorkflowCard), not
  // the composer — these are the handlers it calls. Kept close to
  // handleSend's error/append pattern but simpler: no optimistic user
  // bubble is needed since the triggering action (a button click / mini
  // form submit) is already visible feedback.
  const handleNoticeDraft = useCallback(
    async (threadId: string, userInputs?: Record<string, unknown>) => {
      setIsSending(true);
      try {
        const { assistantMessage, thread: backendThread } = await chatService.draftNotice(threadId, userInputs, {
          moduleId: activeModuleId,
          toolId: activeToolId,
        });
        addMessage(threadId, assistantMessage);
        if (backendThread) {
          upsertThread({ id: backendThread.id, title: backendThread.title, updatedAt: backendThread.updatedAt });
        }
      } catch {
        addMessage(threadId, createErrorMessage());
      } finally {
        setIsSending(false);
      }
    },
    [activeModuleId, activeToolId, addMessage, upsertThread],
  );

  const handleNoticeRefine = useCallback(
    async (threadId: string, instruction: string) => {
      setIsSending(true);
      try {
        const { assistantMessage, thread: backendThread } = await chatService.refineNoticeReply(
          threadId,
          instruction,
          { moduleId: activeModuleId, toolId: activeToolId },
        );
        addMessage(threadId, assistantMessage);
        if (backendThread) {
          upsertThread({ id: backendThread.id, title: backendThread.title, updatedAt: backendThread.updatedAt });
        }
      } catch {
        addMessage(threadId, createErrorMessage());
      } finally {
        setIsSending(false);
      }
    },
    [activeModuleId, activeToolId, addMessage, upsertThread],
  );

  return (
    <div
      className={cn(
        "grid h-screen overflow-hidden bg-background transition-[grid-template-columns] duration-300",
      )}
      style={{
        gridTemplateColumns: `${leftOpen ? "280px" : "0px"} minmax(0,1fr) ${rightOpen ? "340px" : "0px"}`,
      }}
    >
      <div className={cn("overflow-hidden", !leftOpen && "invisible")}>
        {leftOpen && <WorkspaceSidebar />}
      </div>

      {/* Main */}
      <div className="flex min-h-0 min-w-0 flex-col">
        {/* Header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/60 bg-background/80 px-4 backdrop-blur">
          <div className="flex min-w-0 items-center gap-2">
            {!leftOpen && (
              <Button variant="ghost" size="icon" onClick={toggleLeft} className="h-8 w-8">
                <PanelLeftOpen className="h-4 w-4" />
              </Button>
            )}
            <div className="flex min-w-0 items-center gap-2">
              {activeModule && (
                <span
                  className="grid h-6 w-6 shrink-0 place-items-center rounded-lg text-primary-foreground"
                  style={{ background: activeModule.color }}
                >
                  <Icon name={activeModule.icon} className="h-3.5 w-3.5" />
                </span>
              )}
              <h2 className="truncate text-sm font-semibold">
                {thread?.title ?? "New chat"}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Tool tabs */}
            <div className="mr-2 hidden gap-0.5 rounded-lg border border-border/60 bg-secondary/60 p-0.5 md:flex">
              {(activeModule?.tools ?? []).map((t) => (
                <button
                  key={t.id}
                  onClick={() => !t.disabled && setTool(t.id)}
                  disabled={t.disabled}
                  title={t.disabled ? t.disabledReason ?? "Coming soon" : undefined}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
                    t.disabled
                      ? "cursor-not-allowed text-muted-foreground/40"
                      : activeToolId === t.id
                        ? "bg-card text-foreground shadow-soft"
                        : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon name={t.icon} className="h-3 w-3" />
                  {t.name}
                </button>
              ))}
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            {!rightOpen && (
              <Button variant="ghost" size="icon" onClick={toggleRight} className="h-8 w-8">
                <PanelRightOpen className="h-4 w-4" />
              </Button>
            )}
          </div>
        </header>

        {/* Messages — the only independently scrolling region in this column */}
        <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto px-4 py-8">
            {thread && thread.messages.length > 0 ? (
              <div className="space-y-5">
                {thread.messages.map((m, i) => (
                  <ChatMessageBubble
                    key={m.id}
                    message={m}
                    threadId={thread.id}
                    isLatest={i === thread.messages.length - 1}
                    onNoticeDraft={handleNoticeDraft}
                    onNoticeRefine={handleNoticeRefine}
                    noticeActionPending={isSending}
                  />
                ))}
                {isSending && <TypingIndicator />}
                <div ref={scrollAnchorRef} />
              </div>
            ) : (
              <EmptyState moduleName={activeModule?.name ?? ""} />
            )}
          </div>
        </div>

        {/* Composer — always pinned, never scrolls */}
        <div className="shrink-0 border-t border-border/60 bg-background/60 px-4 pb-5 pt-4 backdrop-blur">
          <div className="mx-auto max-w-3xl">
            <PromptComposer
              onSend={handleSend}
              isStreaming={isSending}
              disabled={activeModule?.disabled || activeTool?.disabled}
              disabledReason={activeModule?.disabled ? activeModule?.disabledReason : activeTool?.disabledReason}
              uploadProgress={uploadProgress}
            />
          </div>
        </div>
      </div>

      <div className={cn("overflow-hidden", !rightOpen && "invisible")}>
        {rightOpen && <ContextPanel thread={thread} />}
      </div>
    </div>
  );
}

function EmptyState({ moduleName }: { moduleName: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto mt-8 max-w-xl text-center"
    >
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl text-primary-foreground shadow-float">
        {/* <Sparkles className="h-6 w-6" /> */}
        <img
                src={siteConfig.logo}
                alt={`${siteConfig.name} logo`}
                width={12}
                height={12}
                className="rounded-md object-contain"
                style={{ width: 48, height: 32 }}
              />
      </div>
      <h1 className="text-2xl font-bold tracking-tight">
        How can I assist you with <span className="text-gradient">{moduleName}</span> today?
      </h1>
      {/* <p className="mt-2 text-sm text-muted-foreground">
        Ask a question, paste a query, or drop a notice PDF. Answers come with verifiable citations.
      </p> */}
    </motion.div>
  );
}