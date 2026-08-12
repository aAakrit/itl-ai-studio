/* eslint-disable prettier/prettier */
import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { BookOpen, FileText, PanelLeft, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { api, endpoints } from "@/services/api/api";
import { KnowledgeTree } from "@/features/admin/knowledge/KnowledgeTree";
import { KnowledgeViewer } from "@/features/admin/knowledge/KnowledgeViewer";
import type { KnowledgeContentSummary } from "@/features/admin/knowledge/types";

export const Route = createFileRoute("/admin/knowledge")({
  component: AdminKnowledgePage,
  head: () => ({
    meta: [
      { title: "Knowledge Base — Admin" },
      {
        name: "description",
        content:
          "Browse the ITL AI digital library: Acts, rules, circulars and case law with HTML and original PDF views.",
      },
    ],
  }),
});

async function searchContents(term: string) {
  const { data } = await api.get<{
    items?: KnowledgeContentSummary[];
    results?: KnowledgeContentSummary[];
  }>(endpoints.books.contents, {
    params: { search: term, page: 1, limit: 20 },
  });

  return data.items ?? data.results ?? [];
}

function AdminKnowledgePage() {
  const [selected, setSelected] = useState<KnowledgeContentSummary | null>(null);
  const [term, setTerm] = useState("");
  const [treeOpen, setTreeOpen] = useState(false);

  const trimmed = term.trim();

  const { data: results = [], isFetching } = useQuery({
    queryKey: ["knowledge-search", trimmed],
    queryFn: () => searchContents(trimmed),
    enabled: trimmed.length > 1,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const openContent = (content: KnowledgeContentSummary) => {
    setSelected(content);
    setTreeOpen(false);
  };

  const tree = useMemo(
    () => <KnowledgeTree selectedContentId={selected?.id} onSelectContent={openContent} />,
    [selected?.id],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Knowledge Base</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Read-only library of Acts, rules, circulars and case law.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full lg:w-[320px]">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Search title, summary, keywords, text..."
              value={term}
              onChange={(event) => setTerm(event.target.value)}
            />
          </div>

          <Sheet open={treeOpen} onOpenChange={setTreeOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden">
                <PanelLeft className="h-4 w-4" />
                <span className="sr-only">Open library</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[86vw] p-0 sm:w-[380px]">
              <SheetHeader className="px-4 pt-4">
                <SheetTitle>Library</SheetTitle>
              </SheetHeader>
              <div className="h-[calc(100vh-72px)]">{tree}</div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {trimmed.length > 1 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              Search results for “{trimmed}”
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isFetching && !results.length ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={`search-skeleton-${index}`} className="h-10 w-full" />
                ))}
              </div>
            ) : results.length ? (
              <ul className="divide-y">
                {results.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => openContent(item)}
                      className="flex w-full items-start gap-3 px-1 py-2.5 text-left transition-colors hover:bg-secondary/60"
                    >
                      <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{item.title}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {item.reference_no ? `${item.reference_no} · ` : ""}
                          {item.summary || item.keywords || "Open in viewer"}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No matching documents found.</p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="hidden overflow-hidden lg:block">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <BookOpen className="h-4 w-4 text-primary" />
              Library
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[74vh]">{tree}</div>
          </CardContent>
        </Card>

        <div className="min-w-0">
          <KnowledgeViewer content={selected} />
        </div>
      </div>
    </div>
  );
}
