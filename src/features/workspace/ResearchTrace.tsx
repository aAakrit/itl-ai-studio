/* eslint-disable prettier/prettier */
import { useState } from "react";
import { ChevronDown, ChevronRight, Wrench, ListChecks, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ResearchStep, ResearchTrace } from "@/types";

/** One line of the live/collapsed research timeline. */
function StepLine({ step }: { step: ResearchStep }) {
  const [open, setOpen] = useState(false);

  if (step.kind === "tools") {
    const calls = step.calls ?? [];
    return (
      <li className="text-xs text-muted-foreground">
        <button
          type="button"
          onClick={() => calls.length > 0 && setOpen((o) => !o)}
          className={cn("flex items-center gap-1.5 text-left", calls.length > 0 && "hover:text-foreground")}
        >
          <Wrench className="h-3 w-3 shrink-0" />
          <span>{step.text}</span>
          {calls.length > 0 && (open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />)}
        </button>
        {open && (
          <ul className="mt-1 space-y-0.5 border-l border-border/60 pl-4">
            {calls.map((c, i) => (
              <li key={i} className="leading-snug">{c}</li>
            ))}
          </ul>
        )}
      </li>
    );
  }

  return (
    <li className="flex items-start gap-1.5 text-xs text-muted-foreground">
      {step.kind === "plan" ? <ListChecks className="mt-0.5 h-3 w-3 shrink-0" /> : <Search className="mt-0.5 h-3 w-3 shrink-0" />}
      <span className="leading-snug">{step.text}</span>
    </li>
  );
}

/** Live timeline shown under the question while the answer is being researched. */
export function ResearchTimeline({ steps }: { steps: ResearchStep[] }) {
  if (steps.length === 0) return null;
  return (
    <ul className="mt-3 max-h-40 space-y-1.5 overflow-y-auto border-t border-border/60 pt-3">
      {steps.map((s, i) => (
        <StepLine key={i} step={s} />
      ))}
    </ul>
  );
}

/** Collapsed "Researched in N rounds, M tools" kept on the finished message. */
export function ResearchTraceSummary({ trace }: { trace: ResearchTrace }) {
  const [open, setOpen] = useState(false);
  if (trace.steps.length === 0) return null;

  const parts = [
    trace.rounds > 0 ? `${trace.rounds} round${trace.rounds === 1 ? "" : "s"}` : null,
    trace.toolCount > 0 ? `${trace.toolCount} tool${trace.toolCount === 1 ? "" : "s"}` : null,
  ].filter(Boolean);

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        Researched{parts.length > 0 ? ` in ${parts.join(", ")}` : ""}
      </button>
      {open && (
        <ul className="mt-1.5 space-y-1.5 rounded-xl border border-border/60 bg-card/60 p-3">
          {trace.steps.map((s, i) => (
            <StepLine key={i} step={s} />
          ))}
        </ul>
      )}
    </div>
  );
}
