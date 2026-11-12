/* eslint-disable prettier/prettier */
import { useMemo } from "react";
import { BookOpen, Scale, FileText, Bell, Paperclip, ChevronsRight, Gavel, ListOrdered, FileType, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSidebarStore } from "@/store";
import type { ChatThread, Citation, MessageAttachment, RelatedJudgement } from "@/types";

function citationIcon(documentType: string) {
  const key = documentType.toLowerCase();
  if (key.includes("judgement") || key.includes("judgment") || key.includes("case")) return Scale;
  if (key.includes("circular")) return FileText;
  if (key.includes("notification")) return Bell;
  if (key.includes("rule")) return Gavel;
  if (key.includes("section")) return ListOrdered;
  if (key.includes("order")) return FileType;
  return BookOpen;
}

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    result.push(item);
  }
  return result;
}

export function ContextPanel({ thread }: { thread: ChatThread | null }) {
  const toggleRight = useSidebarStore((s) => s.toggleRight);

  // Vendor ordering is preserved (dedupe only drops exact repeats across
  // messages, it doesn't re-sort).
  const sources = useMemo<Citation[]>(() => {
    if (!thread) return [];
    return dedupeById(thread.messages.flatMap((m) => m.citations ?? []));
  }, [thread]);

  const relatedJudgements = useMemo<RelatedJudgement[]>(() => {
    if (!thread) return [];
    return dedupeById(thread.messages.flatMap((m) => m.relatedJudgements ?? []));
  }, [thread]);

  const files = useMemo<MessageAttachment[]>(() => {
    if (!thread) return [];
    return thread.messages.map((m) => m.attachment).filter((a): a is MessageAttachment => !!a);
  }, [thread]);

  return (
    <aside className="flex h-full flex-col border-l border-border/60 bg-sidebar/40">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h3 className="text-sm font-semibold">Context</h3>
        <Button variant="ghost" size="icon" onClick={toggleRight} className="h-8 w-8">
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
      <Tabs defaultValue="sources" className="flex flex-1 flex-col overflow-hidden">
        <TabsList className="mx-4 grid grid-cols-3 bg-secondary/60">
          <TabsTrigger value="sources" className="text-xs">
            Sources
          </TabsTrigger>
          <TabsTrigger value="related" className="text-xs">
            Related Cases
          </TabsTrigger>
          <TabsTrigger value="files" className="text-xs">
            Files
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sources" className="scrollbar-thin flex-1 space-y-2 overflow-y-auto px-3 pt-3 pb-4">
          {sources.length > 0 ? (
            <>
              <p className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Referenced in this chat
              </p>
              {sources.map((c) => {
                const Icon = citationIcon(c.documentType);
                const Wrapper = c.link ? "a" : "div";
                return (
                  <Card key={c.id} id={c.sourceNo != null ? `source-panel-${c.id}` : undefined} className="p-3 shadow-soft transition-shadow hover:shadow-elevated">
                    <Wrapper
                      {...(c.link ? { href: c.link, target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="flex items-start gap-2.5"
                    >
                      <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/8 text-primary">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <p className="min-w-0 flex-1 truncate text-[13px] font-semibold leading-tight text-foreground">
                            {c.heading}
                          </p>
                          {c.link && <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />}
                        </div>
                        {c.citation && <p className="truncate text-[11px] text-muted-foreground">{c.citation}</p>}
                        {c.court && <p className="truncate text-[11px] text-muted-foreground">{c.court}</p>}
                        {c.reference && <p className="truncate text-[10px] text-muted-foreground/80">Ref: {c.reference}</p>}
                      </div>
                      <span className="shrink-0 rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {c.documentType}
                      </span>
                    </Wrapper>
                  </Card>
                );
              })}
            </>
          ) : (
            <EmptyState
              icon={BookOpen}
              message={thread ? "No sources cited in this chat yet." : "Start a conversation to see citations here."}
            />
          )}
        </TabsContent>

        <TabsContent value="related" className="scrollbar-thin flex-1 space-y-2 overflow-y-auto px-3 pt-3 pb-4">
          {relatedJudgements.length > 0 ? (
            relatedJudgements.map((j) => (
              <Card key={j.id} className="p-3 shadow-soft transition-shadow hover:shadow-elevated">
                <a
                  {...(j.link ? { href: j.link, target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="block"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/8 text-primary">
                      <Scale className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <p className="min-w-0 flex-1 text-[13px] font-semibold leading-tight text-foreground">{j.partyName}</p>
                        {j.link && <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />}
                      </div>
                      {j.court && <p className="text-[11px] text-muted-foreground">{j.court}</p>}
                      {j.bindingStatus && <p className="text-[10px] font-medium text-primary">{j.bindingStatus}</p>}
                      {j.crossAct && <p className="text-[10px] leading-snug text-muted-foreground">{j.crossAct}</p>}
                      {j.ratio && <p className="text-[11px] leading-relaxed text-foreground/80">{j.ratio}</p>}
                      {!j.ratio && j.held && <p className="text-[11px] leading-relaxed text-foreground/80">{j.held}</p>}
                    </div>
                  </div>
                </a>
              </Card>
            ))
          ) : (
            <EmptyState
              icon={Scale}
              message={thread ? "No related cases surfaced in this chat yet." : "Start a conversation to see related cases here."}
            />
          )}
        </TabsContent>

        <TabsContent value="files" className="scrollbar-thin flex-1 space-y-2 overflow-y-auto px-3 pt-3 pb-4">
          {files.length > 0 ? (
            files.map((f) => (
              <Card key={f.downloadUrl} className="p-3 shadow-soft">
                <div className="flex items-start gap-2.5">
                  <Paperclip className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold">{f.filename}</p>
                    {f.size != null && (
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{(f.size / 1024).toFixed(0)} KB</p>
                    )}
                  </div>
                  <a href={f.downloadUrl} target="_blank" rel="noopener noreferrer" title="Download">
                    <Download className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </a>
                </div>
              </Card>
            ))
          ) : (
            <EmptyState icon={Paperclip} message="No files in this conversation." />
          )}
        </TabsContent>
      </Tabs>
    </aside>
  );
}

function EmptyState({ icon: Icon, message }: { icon: typeof BookOpen; message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
      <div className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-[12px] text-muted-foreground">{message}</p>
    </div>
  );
}
