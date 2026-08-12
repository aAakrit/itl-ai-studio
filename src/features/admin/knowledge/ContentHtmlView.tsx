/* eslint-disable prettier/prettier */
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ContentHtmlViewProps {
  html: string;
  className?: string;
}

/**
 * Read-only presentation of the stored HTML. Deliberately not CKEditor — this is
 * the reading surface for the Knowledge Base.
 */
export function ContentHtmlView({ html, className }: ContentHtmlViewProps) {
  if (!html.trim()) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/20 px-6 py-12 text-center text-sm text-muted-foreground">
        No HTML content stored for this item.
      </div>
    );
  }

  return (
    <ScrollArea className={cn("h-[62vh] rounded-lg border bg-background", className)}>
      <article
        className="content-html px-6 py-6"
        // Content is authored by administrators through the CMS editor.
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </ScrollArea>
  );
}
