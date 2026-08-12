/* eslint-disable prettier/prettier */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, FileText, Folder, FolderOpen } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { api, endpoints } from "@/services/api/api";
import { cn } from "@/lib/utils";

import type { KnowledgeContentSummary, KnowledgeSection } from "./types";

interface KnowledgeSectionNodeProps {
  bookId: string;
  section: KnowledgeSection;
  level: number;
  selectedContentId?: string;
  onSelectContent(content: KnowledgeContentSummary): void;
}

async function fetchSectionContents(sectionId: string) {
  const { data } = await api.get<{
    items?: KnowledgeContentSummary[];
    results?: KnowledgeContentSummary[];
  }>(endpoints.books.contents, {
    params: { section_id: sectionId, page: 1, limit: 100 },
  });

  return data.items ?? data.results ?? [];
}

/** Documentation-style disclosure node: child sections first, then content leaves. */
export function KnowledgeSectionNode({
  bookId,
  section,
  level,
  selectedContentId,
  onSelectContent,
}: KnowledgeSectionNodeProps) {
  const [open, setOpen] = useState(level === 0);

  const { data: contents = [], isLoading } = useQuery({
    queryKey: ["knowledge-section-contents", section.id],
    queryFn: () => fetchSectionContents(section.id),
    enabled: open,
    staleTime: 60_000,
  });

  const children = section.children ?? [];

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        style={{ paddingLeft: 8 + level * 14 }}
        aria-expanded={open}
      >
        {open ? (
          <ChevronDown className="mr-1 h-4 w-4 shrink-0" />
        ) : (
          <ChevronRight className="mr-1 h-4 w-4 shrink-0" />
        )}
        {open ? (
          <FolderOpen className="mr-2 h-4 w-4 shrink-0" />
        ) : (
          <Folder className="mr-2 h-4 w-4 shrink-0" />
        )}
        <span className="truncate font-medium">{section.title}</span>
      </button>

      {open && (
        <div>
          {children.map((child) => (
            <KnowledgeSectionNode
              key={child.id}
              bookId={bookId}
              section={child}
              level={level + 1}
              selectedContentId={selectedContentId}
              onSelectContent={onSelectContent}
            />
          ))}

          {isLoading && (
            <div className="space-y-1.5 px-2 py-1" style={{ paddingLeft: 22 + level * 14 }}>
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-5 w-2/3" />
            </div>
          )}

          {!isLoading &&
            contents.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectContent({ ...item, book_id: bookId, section_id: section.id })}
                className={cn(
                  "flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                  selectedContentId === item.id
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
                style={{ paddingLeft: 22 + level * 14 }}
              >
                <FileText className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate">{item.title}</span>
              </button>
            ))}

          {!isLoading && !contents.length && !children.length && (
            <p
              className="px-2 py-1.5 text-xs text-muted-foreground"
              style={{ paddingLeft: 22 + level * 14 }}
            >
              Empty section
            </p>
          )}
        </div>
      )}
    </div>
  );
}
