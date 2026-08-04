/* eslint-disable prettier/prettier */
import { useCallback, useEffect, useRef, useState } from "react";
import { Paperclip, Send, StopCircle, Wand2, Loader2, X, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { usePromptSuggestions } from "@/hooks";
import { useWorkspaceStore } from "@/store";
import { chatService, isFileTool } from "@/services/workspace.service";

const MAX_TEXTAREA_HEIGHT_PX = 200;
const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024; // 20MB

export function PromptComposer({
  onSend,
  isStreaming = false,
  disabled = false,
  disabledReason,
  uploadProgress,
}: {
  onSend?: (prompt: string, file?: File | null) => void;
  isStreaming?: boolean;
  /** True when the active tool has no working backend yet (e.g. Draft Assistant). */
  disabled?: boolean;
  disabledReason?: string;
  /** 0-100 while a file is uploading, undefined otherwise. */
  uploadProgress?: number;
}) {
  const [value, setValue] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isClarifying, setIsClarifying] = useState(false);
  const [clarifyOptions, setClarifyOptions] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeModuleId = useWorkspaceStore((s) => s.activeModuleId);
  const activeToolId = useWorkspaceStore((s) => s.activeToolId);
  const { data: suggestions } = usePromptSuggestions(activeModuleId);
  const isInputDisabled = isStreaming || disabled || isClarifying;
  const canClarify = !isInputDisabled && !!value.trim();
  const acceptsFile = isFileTool(activeToolId);

  // Auto-grow: recalculate on every value change, capped so a huge paste
  // doesn't push the composer (or the messages above it) off screen.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT_PX)}px`;
  }, [value]);

  // Switching tools mid-draft: drop an attachment that no longer makes sense
  // (Notice Reply's PDF isn't meaningful once you've switched to Ask Bot).
  useEffect(() => {
    if (!acceptsFile) setFile(null);
  }, [acceptsFile]);

  const submit = useCallback(() => {
    const trimmed = value.trim();
    if ((!trimmed && !file) || isInputDisabled) return; // guards against duplicate/mid-flight/disabled-tool submissions
    onSend?.(trimmed, file);
    setValue("");
    setFile(null);
  }, [value, file, isInputDisabled, onSend]);

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file later
    if (!picked) return;
    if (picked.size > MAX_ATTACHMENT_BYTES) {
      toast.error("That file is too large — max 20MB.");
      return;
    }
    setFile(picked);
  };

  const handleClarify = useCallback(async () => {
    const trimmed = value.trim();
    if (!trimmed || isClarifying) return;
    setIsClarifying(true);
    setClarifyOptions([]);
    try {
      const { needsClarification, options } = await chatService.clarify(trimmed, activeToolId);
      if (!needsClarification || options.length === 0) {
        toast.success("Your prompt is already clear — nothing to refine.");
        return;
      }
      setClarifyOptions(options);
    } catch {
      toast.error("Couldn't clarify that prompt — please try again.");
    } finally {
      setIsClarifying(false);
    }
  }, [value, isClarifying, activeToolId]);

  const pickOption = (option: string) => {
    setValue(option);
    setClarifyOptions([]);
    textareaRef.current?.focus();
  };

  return (
    <div className="w-full">
      {/* {disabled ? (
        <p className="mb-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center text-[12px] text-amber-700 dark:text-amber-400">
          {disabledReason ?? "This tool isn't available yet."}
        </p>
      ) : (
        suggestions &&
        suggestions.length > 0 && (
          <div className="mb-3 flex flex-wrap justify-center gap-2">
            {suggestions.map((s) => (
              <button
                key={s.id}
                type="button"
                disabled={isInputDisabled}
                onClick={() => setValue(s.prompt)}
                className="rounded-full border border-border/60 bg-card/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
              >
                <span className="mr-1.5 text-primary">✦</span>
                {s.title}
              </button>
            ))}
          </div>
        )
      )} */}

      {file && (
        <div className="mb-2 flex items-center gap-2 rounded-lg border border-border/60 bg-card/60 px-3 py-2 text-[12px]">
          <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate">{file.name}</span>
          <span className="shrink-0 text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</span>
          {uploadProgress != null ? (
            <span className="shrink-0 text-muted-foreground">{uploadProgress}%</span>
          ) : (
            <button
              type="button"
              onClick={() => setFile(null)}
              disabled={isInputDisabled}
              className="shrink-0 text-muted-foreground hover:text-destructive disabled:pointer-events-none"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="glass-strong flex items-end gap-2 rounded-2xl p-2.5 shadow-float"
      >
        <input ref={fileInputRef} type="file" hidden onChange={handleFilePick} />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={isInputDisabled || !acceptsFile}
          onClick={() => fileInputRef.current?.click()}
          title={acceptsFile ? "Attach a document" : "Attachments aren't used by this tool"}
          className="h-9 w-9 shrink-0 rounded-xl"
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        <textarea
          ref={textareaRef}
          value={value}
          disabled={isInputDisabled}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            // Enter = send, Shift+Enter = newline.
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder={
            disabled
              ? "This tool isn't available yet…"
              : acceptsFile
                ? "Paste the notice text, or attach a document, and add any instructions…"
                : "Ask ITL AI about Income Tax or GST — statute, case law, circulars, notice replies…"
          }
          className={cn(
            "min-h-[36px] flex-1 resize-none bg-transparent px-2 py-2 text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-60",
          )}
          style={{ maxHeight: MAX_TEXTAREA_HEIGHT_PX }}
        />
        <Popover open={clarifyOptions.length > 0} onOpenChange={(open) => !open && setClarifyOptions([])}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={!canClarify}
              onClick={handleClarify}
              title="Clarify prompt"
              className="h-9 w-9 shrink-0 rounded-xl"
            >
              {isClarifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-2">
            <p className="mb-2 px-1 text-[11px] font-medium text-muted-foreground">
              Your prompt could mean a few things — pick one:
            </p>
            <div className="flex flex-col gap-1">
              {clarifyOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => pickOption(option)}
                  className="rounded-lg px-2.5 py-1.5 text-left text-[13px] text-foreground transition-colors hover:bg-secondary"
                >
                  {option}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        {isStreaming ? (
          <Button type="button" size="icon" variant="destructive" disabled className="h-9 w-9 shrink-0 rounded-xl" title="Stopping mid-response isn't supported yet">
            <StopCircle className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="submit"
            size="icon"
            disabled={(!value.trim() && !file) || isInputDisabled}
            className="h-9 w-9 shrink-0 rounded-xl gradient-primary text-primary-foreground shadow-soft"
          >
            <Send className="h-4 w-4" />
          </Button>
        )}
      </form>
      <p className="mt-2 text-center text-[11px] text-foreground">
        ITL AI is an assistive tool and may produce inaccurate or incomplete information. Please verify independently.
      </p>
    </div>
  );
}