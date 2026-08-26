/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLegal } from "@/hooks";
import { cn } from "@/lib/utils";

/**
 * Shows the Terms & Conditions in a scrollable dialog. `onAccept` only
 * fires once the person has scrolled all the way to the bottom — accepting
 * before that isn't possible, the button stays disabled.
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
  const [reachedEnd, setReachedEnd] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const sections = (data?.sections ?? []) as { heading: string; body: string }[];

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 24;
    if (atBottom) setReachedEnd(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{(data as any)?.title ?? "Terms & Conditions"}</DialogTitle>
          <DialogDescription>
            {reachedEnd
              ? "You've read the full document — you can close this and accept."
              : "Scroll to the end to unlock acceptance."}
          </DialogDescription>
        </DialogHeader>

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
            {reachedEnd ? "Fully read" : "Keep scrolling…"}
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