/* eslint-disable prettier/prettier */
import { useRef, useState } from "react";
import { AlertTriangle, FileWarning, Maximize2, Minimize2, RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { useContentPdf } from "./useContentPdf";

interface PdfViewerProps {
  contentId?: string;
  /** Set false to defer the network request until the tab is actually opened. */
  enabled?: boolean;
  className?: string;
  fileName?: string;
}

/**
 * Embedded PDF reader. The document is streamed through the API layer and shown
 * with the platform PDF engine, which already provides zoom, text search, print,
 * page navigation and fit-width. Full screen is handled on the wrapper so the
 * surrounding editor/HTML tab is never affected.
 */
export function PdfViewer({ contentId, enabled = true, className, fileName }: PdfViewerProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const { objectUrl, isLoading, isError, refetch } = useContentPdf(contentId, enabled);

  const toggleFullScreen = async () => {
    const node = wrapperRef.current;
    if (!node) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        setIsFullScreen(false);
      } else {
        await node.requestFullscreen();
        setIsFullScreen(true);
      }
    } catch {
      // Full screen can be blocked by the browser; the inline viewer still works.
      setIsFullScreen(Boolean(document.fullscreenElement));
    }
  };

  return (
    <div
      ref={wrapperRef}
      className={cn(
        "flex min-h-[520px] flex-col overflow-hidden rounded-lg border bg-muted/20",
        isFullScreen && "min-h-screen rounded-none",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b bg-background/80 px-3 py-2">
        <p className="truncate text-xs text-muted-foreground">
          {fileName || "Original document"}
        </p>
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={() => refetch()}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Reload
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={toggleFullScreen}>
            {isFullScreen ? (
              <Minimize2 className="mr-2 h-4 w-4" />
            ) : (
              <Maximize2 className="mr-2 h-4 w-4" />
            )}
            {isFullScreen ? "Exit" : "Full screen"}
          </Button>
        </div>
      </div>

      <div className="relative flex-1">
        {isLoading && (
          <div className="space-y-3 p-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-[420px] w-full" />
          </div>
        )}

        {isError && (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-10 text-center">
            <AlertTriangle className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-semibold">PDF unavailable</p>
              <p className="mt-1 text-sm text-muted-foreground">
                The original document could not be loaded for this content item.
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        )}

        {!isLoading && !isError && !objectUrl && (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-10 text-center">
            <FileWarning className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No PDF attached to this content.</p>
          </div>
        )}

        {objectUrl && (
          <iframe
            key={objectUrl}
            src={`${objectUrl}#view=FitH&toolbar=1&navpanes=0`}
            title={fileName || "Original PDF"}
            className="h-full min-h-[520px] w-full border-0 bg-background"
          />
        )}
      </div>
    </div>
  );
}
