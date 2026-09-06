/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef, useState } from "react";
import { BookOpen, CheckCircle2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";
import { useLegal } from "@/hooks";

/**
 * Shows the Terms & Conditions in a scrollable dialog. `onAccept` only
 * fires once the person has scrolled all the way to the bottom — accepting
 * before that isn't possible, the button stays disabled. A progress bar
 * and explicit instructions make that requirement obvious up front rather
 * than something the person has to discover by trying to click a disabled
 * button.
 */
export function TermsGateDialog({
  open,
  onOpenChange,
  onAccept,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
}) {
  const { data, isLoading } = useLegal("terms");
  const [progress, setProgress] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const reachedEnd = progress >= 100;

  const sections = (data?.sections ?? []) as { heading: string; body: string }[];

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const scrollable = el.scrollHeight - el.clientHeight;
    const pct = scrollable <= 0 ? 100 : Math.min(100, Math.round((el.scrollTop / scrollable) * 100));
    setProgress((prev) => Math.max(prev, pct)); // never regress if they scroll back up
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{(data as any)?.title ?? "Terms & Conditions"}</DialogTitle>
          <DialogDescription asChild>
            <div className="flex items-start gap-2 rounded-lg border border-border/60 bg-secondary/30 p-2.5 text-xs">
              <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <span>
                Please scroll through and read the entire document below. The <strong>"I have read and
                accept"</strong> button unlocks automatically once you reach the end — no separate confirmation
                needed.
              </span>
            </div>
          </DialogDescription>
        </DialogHeader>

        {/* Progress bar — continuous feedback instead of a binary "keep scrolling" message */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className={cn("h-full rounded-full transition-all duration-200", reachedEnd ? "bg-success" : "bg-primary")}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-border/60 bg-secondary/20 p-4"
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : sections.length === 0 ? (
            <p className="text-sm text-muted-foreground">Couldn't load the Terms & Conditions right now.</p>
          ) : (
            <div className="space-y-6">
              {sections.map((s, i) => (
                <section key={i}>
                  <h3 className="font-display text-sm font-semibold tracking-tight">{s.heading}</h3>
                  <div className="mt-2 space-y-3">
                    {s.body
                      .split(/\n{2,}/)
                      .filter(Boolean)
                      .map((p, pi) => (
                        <p key={pi} className="text-[13px] leading-6 text-muted-foreground">
                          {p.trim()}
                        </p>
                      ))}
                  </div>
                </section>
              ))}
              {/* Sentinel — reaching this element is what "read to the end" means */}
              <p className="pt-2 text-center text-[11px] font-medium text-muted-foreground">— End of document —</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-row items-center justify-between sm:justify-between">
          <p
            className={cn(
              "flex items-center gap-1.5 text-xs",
              reachedEnd ? "text-success" : "text-muted-foreground",
            )}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            {reachedEnd ? "Fully read — you can accept below" : `${progress}% read — keep scrolling to continue`}
          </p>
          <Button
            disabled={!reachedEnd}
            onClick={() => {
              onAccept();
              onOpenChange(false);
            }}
            className="gradient-primary text-primary-foreground"
          >
            I have read and accept
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
