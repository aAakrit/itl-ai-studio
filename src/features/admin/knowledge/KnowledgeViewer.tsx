/* eslint-disable prettier/prettier */
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, endpoints } from "@/services/api/api";

import { ContentHtmlView } from "./ContentHtmlView";
import { PdfViewer } from "./PdfViewer";
import { contentHasPdf, contentHtmlOf } from "./types";
import type { KnowledgeContentDetail, KnowledgeContentSummary } from "./types";

interface KnowledgeViewerProps {
  content: KnowledgeContentSummary | null;
}

/** Read-only content reader with HTML / Original PDF tabs. */
export function KnowledgeViewer({ content }: KnowledgeViewerProps) {
  const { data: detail, isLoading, isError } = useQuery({
    queryKey: ["book-content", content?.id],
    queryFn: async () =>
      (await api.get<KnowledgeContentDetail>(endpoints.books.content(content!.id))).data,
    enabled: Boolean(content?.id),
  });

  const current = detail ?? (content as KnowledgeContentDetail | null);
  const html = contentHtmlOf(current);
  const knownPdf = contentHasPdf(current);

  // When the record does not expose a file type, probe the endpoint once; the
  // blob is shared with the embedded viewer through the query cache.
  const pdfProbe = useContentPdf(current?.id, Boolean(current?.id) && knownPdf === undefined);
  const pdfAvailable = knownPdf === true || pdfProbe.hasPdf === true;

  const [tab, setTab] = useState<string>("html");

  useEffect(() => {
    setTab(pdfAvailable ? "pdf" : "html");
  }, [content?.id, pdfAvailable]);


  if (!content) {
    return (
      <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/20 p-10 text-center">
        <BookOpen className="h-10 w-10 text-muted-foreground" />
        <div>
          <p className="text-lg font-semibold">Open a document</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse the library on the left and select a content item to start reading.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3 rounded-xl border bg-muted/20 p-4">
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-[52vh] w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border bg-muted/20 p-10 text-center">
        <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="mt-3 font-semibold">Unable to load this document</p>
        <p className="mt-1 text-sm text-muted-foreground">Please try another item or refresh.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-muted/20 p-4">
      <div className="border-b pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold">{current?.title}</h2>
          {current?.status && <Badge variant="secondary">{current.status}</Badge>}
          {current?.version ? <Badge variant="outline">v{current.version}</Badge> : null}
        </div>
        <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-muted-foreground">
          {current?.reference_no && <span>Ref: {current.reference_no}</span>}
          {current?.file_name && <span>{current.file_name}</span>}
          {current?.keywords && <span>Keywords: {current.keywords}</span>}
        </div>
        {current?.summary && (
          <p className="mt-3 text-sm text-muted-foreground">{current.summary}</p>
        )}
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mt-4">
        <TabsList>
          <TabsTrigger value="html">HTML</TabsTrigger>
          {pdfPossible && <TabsTrigger value="pdf">Original PDF</TabsTrigger>}
        </TabsList>

        <TabsContent value="html" className="mt-4">
          <ContentHtmlView html={html} />
        </TabsContent>

        {pdfPossible && (
          <TabsContent value="pdf" className="mt-4">
            <PdfViewer
              contentId={current?.id}
              enabled={tab === "pdf"}
              fileName={current?.file_name}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
