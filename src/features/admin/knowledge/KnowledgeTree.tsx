/* eslint-disable prettier/prettier */
import { useQuery } from "@tanstack/react-query";
import { BookOpen, ChevronDown, ChevronRight, Search } from "lucide-react";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { api, endpoints } from "@/services/api/api";
import { cn } from "@/lib/utils";

import { KnowledgeSectionNode } from "./KnowledgeSectionNode";
import type { KnowledgeBook, KnowledgeContentSummary, KnowledgeSection } from "./types";

interface KnowledgeTreeProps {
  selectedContentId?: string;
  onSelectContent(content: KnowledgeContentSummary): void;
}

async function fetchBooks() {
  const { data } = await api.get<{ items?: KnowledgeBook[]; results?: KnowledgeBook[] }>(
    endpoints.books.list,
    { params: { page: 1, limit: 100 } },
  );
  return data.items ?? data.results ?? [];
}

async function fetchTree(bookId: string) {
  const { data } = await api.get<KnowledgeSection[]>(endpoints.books.tree(bookId));
  return Array.isArray(data) ? data : [];
}

function BookBranch({
  book,
  selectedContentId,
  onSelectContent,
  defaultOpen,
}: {
  book: KnowledgeBook;
  selectedContentId?: string;
  onSelectContent(content: KnowledgeContentSummary): void;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  const { data: sections = [], isLoading } = useQuery({
    queryKey: ["knowledge-book-tree", book.id],
    queryFn: () => fetchTree(book.id),
    enabled: open,
    staleTime: 60_000,
  });

  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center rounded-md px-2 py-2 text-left text-sm font-semibold transition-colors hover:bg-secondary"
        aria-expanded={open}
      >
        {open ? (
          <ChevronDown className="mr-1 h-4 w-4 shrink-0" />
        ) : (
          <ChevronRight className="mr-1 h-4 w-4 shrink-0" />
        )}
        <BookOpen className="mr-2 h-4 w-4 shrink-0 text-primary" />
        <span className="truncate">{book.name}</span>
      </button>

      {open && (
        <div className="mt-0.5">
          {isLoading ? (
            <div className="space-y-1.5 px-4 py-1">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-5 w-2/3" />
            </div>
          ) : sections.length ? (
            sections.map((section) => (
              <KnowledgeSectionNode
                key={section.id}
                bookId={book.id}
                section={section}
                level={0}
                selectedContentId={selectedContentId}
                onSelectContent={onSelectContent}
              />
            ))
          ) : (
            <p className="px-4 py-1.5 text-xs text-muted-foreground">No sections yet</p>
          )}
        </div>
      )}
    </div>
  );
}

/** Left-hand library hierarchy: Book → Section → Child Section → Contents. */
export function KnowledgeTree({ selectedContentId, onSelectContent }: KnowledgeTreeProps) {
  const [filter, setFilter] = useState("");

  const { data: books = [], isLoading, isError } = useQuery({
    queryKey: ["knowledge-books"],
    queryFn: fetchBooks,
    staleTime: 60_000,
  });

  const visible = books.filter((book) =>
    book.name.toLowerCase().includes(filter.trim().toLowerCase()),
  );

  return (
    <div className="flex h-full flex-col">
      <div className="relative p-3">
        <Search className="absolute left-6 top-6 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-10"
          placeholder="Filter books..."
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        />
      </div>

      <ScrollArea className={cn("flex-1 px-2 pb-3")}>
        {isLoading ? (
          <div className="space-y-2 px-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={`book-skeleton-${index}`} className="h-8 w-full" />
            ))}
          </div>
        ) : isError ? (
          <p className="px-2 py-4 text-sm text-muted-foreground">
            Unable to load the library right now.
          </p>
        ) : visible.length ? (
          visible.map((book, index) => (
            <BookBranch
              key={book.id}
              book={book}
              defaultOpen={index === 0 && !filter}
              selectedContentId={selectedContentId}
              onSelectContent={onSelectContent}
            />
          ))
        ) : (
          <p className="px-2 py-4 text-sm text-muted-foreground">No books match your filter.</p>
        )}
      </ScrollArea>
    </div>
  );
}
