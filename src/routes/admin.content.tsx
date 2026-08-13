/* eslint-disable prettier/prettier */

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  BookOpen,
  RefreshCcw,
  ChevronLeft,
  ChevronRight,
  FolderTree,
  FileText,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Badge } from "@/components/ui/badge";

import {
  Skeleton,
} from "@/components/ui/skeleton";

import { ScrollArea } from "@/components/ui/scroll-area";

import { Separator } from "@/components/ui/separator";

import { ContentTable } from "@/features/admin/content/ContentTable";
import { SectionNode } from "@/features/admin/content/SectionNode";
import { BookDialog } from "@/features/admin/content/dialogs/BookDialog";
import { SectionDialog } from "@/features/admin/content/dialogs/SectionDialog";
import { ContentDialog } from "@/features/admin/content/dialogs/ContentDialog";
import { DeleteConfirmDialog } from "@/features/admin/content/dialogs/DeleteConfirmDialog";
import { api, endpoints } from "@/services/api/api";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/admin/content")({
  component: AdminContentPage,
  head: () => ({ meta: [{ title: "Content Management — Admin" }] }),
});

interface Book {

    id: string;

    name: string;

    slug: string;

    description?: string;

    status: string;

    sort_order: number;

    created_at: string;

    updated_at: string;

}

interface Section {

    id: string;

    title: string;

    parent_id?: string | null;

    sort_order: number;

    status: string;

    children?: Section[];

}

interface ContentItem {

    id: string;

    title: string;

    reference_no?: string;

    status: string;

    version: number;

    updated_at: string;

    keywords?: string;

    summary?: string;

    body?: string;

}

function normalizeBooksResponse(response: {
    total?: number;
    page?: number;
    limit?: number;
    items?: Book[];
    results?: Book[];
}) {
    const items = Array.isArray(response?.items)
        ? response.items
        : Array.isArray(response?.results)
            ? response.results
            : [];

    return {
        ...response,
        total: response?.total ?? items.length,
        page: response?.page ?? 1,
        limit: response?.limit ?? items.length,
        items,
    };
}

async function fetchBooks(
    page: number,
    limit: number,
    search: string,
    status: string,
) {

    const { data } = await api.get(endpoints.books.list, {

        params: {

            page,

            limit,

            search: search || undefined,

            status: status === "ALL"
                ? undefined
                : status,

        },

    });

    return normalizeBooksResponse(data);

}
async function fetchSections(bookId: string) {

    if (!bookId) return [];

    const { data } = await api.get(
        endpoints.books.tree(bookId)
    );

    return data;

}

function countSections(nodes: Section[]): number {

    return nodes.reduce((count, node) => {

        const childCount = countSections(node.children ?? []);

        return count + 1 + childCount;

    }, 0);

}

function collectSectionIds(nodes: Section[]): string[] {

    return nodes.flatMap((node) => [

        node.id,

        ...collectSectionIds(node.children ?? []),

    ]);

}

function filterSections(nodes: Section[], query: string): Section[] {

    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {

        return nodes;

    }

    return nodes.reduce<Section[]>((filtered, node) => {

        const childMatches = filterSections(node.children ?? [], normalizedQuery);

        const matchesTitle = node.title.toLowerCase().includes(normalizedQuery);

        if (matchesTitle || childMatches.length > 0) {

            filtered.push({

                ...node,

                children: childMatches,

            });

        }

        return filtered;

    }, []);

}

function formatBookDate(value?: string) {

    if (!value) return "—";

    return new Date(value).toLocaleDateString(undefined, {

        year: "numeric",

        month: "short",

        day: "numeric",

    });

}

// NOT exported: exporting a route component opts the whole file out of
// TanStack Router's automatic code splitting ("These exports will not be code-split").
function AdminContentPage() {

    const queryClient = useQueryClient();

    const [page, setPage] = useState(1);

    const [limit] = useState(10);

    const [search, setSearch] = useState("");

    const [status, setStatus] = useState("ALL");

    const [selectedBook, setSelectedBook] =
        useState<Book | null>(null);
    
    const [selectedSection, setSelectedSection] =
        useState<Section | null>(null);

    const [sectionSearch, setSectionSearch] = useState("");

    const [expanded, setExpanded] =
        useState<Record<string, boolean>>({});

    const [bookDialogOpen, setBookDialogOpen] = useState(false);

    const [bookDialogMode, setBookDialogMode] = useState<"create" | "edit">("create");

    const [editingBook, setEditingBook] = useState<Book | null>(null);

    const [sectionDialogOpen, setSectionDialogOpen] = useState(false);

    const [sectionDialogMode, setSectionDialogMode] = useState<"create-root" | "create-child" | "edit">("create-root");

    const [editingSection, setEditingSection] = useState<Section | null>(null);

    const [contentDialogOpen, setContentDialogOpen] = useState(false);

    const [contentDialogMode, setContentDialogMode] = useState<"create" | "edit" | "view">("create");

    const [editingContent, setEditingContent] = useState<ContentItem | null>(null);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState<{

        type: "book" | "section" | "content";

        id: string;

        title: string;

        description: string;

    } | null>(null);

    const {

        data,

        isLoading,

        refetch,

    } = useQuery({

        queryKey: [

            "books",

            page,

            limit,

            search,

            status,

        ],

        queryFn: () => fetchBooks(

            page,

            limit,

            search,

            status,

        ),

    });

    const toggleSection = (
        id: string,
    ) => {
        setExpanded((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const {
        data: sectionTree = [],
        isLoading: sectionsLoading,
        refetch: refetchSections,
    } = useQuery({
        queryKey: [
            "book-sections",
            selectedBook?.id,
        ],
        queryFn: () =>
            fetchSections(selectedBook!.id),
        enabled: !!selectedBook,
    });

    const sectionCount = useMemo(
        () => countSections(sectionTree),
        [sectionTree],
    );

    const sectionIds = useMemo(
        () => collectSectionIds(sectionTree),
        [sectionTree],
    );

    const filteredSectionTree = useMemo(
        () => filterSections(sectionTree, sectionSearch),
        [sectionTree, sectionSearch],
    );

    useEffect(() => {
        if (!selectedBook) {
            return;
        }

        if (!selectedSection || !sectionIds.includes(selectedSection.id)) {
            setSelectedSection(sectionTree[0] ?? null);
        }
    }, [
        sectionTree,
        sectionIds,
        selectedBook,
        selectedSection,
    ]);

    const books = useMemo(() => data?.items ?? [], [data]);

    const bookDeleteMutation = useMutation({
        mutationFn: async (bookId: string) => {
            await api.delete(endpoints.books.delete(bookId));
        },
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["books"] }),
                queryClient.invalidateQueries({ queryKey: ["book-sections"] }),
            ]);

            toast.success("Book deleted successfully.");
            setSelectedBook(null);
            setDeleteDialogOpen(false);
            setDeleteTarget(null);
        },
        onError: () => {
            toast.error("Failed to delete book.");
        },
    });

    const sectionDeleteMutation = useMutation({
        mutationFn: async (sectionId: string) => {
            await api.delete(endpoints.books.deleteSection(sectionId));
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ["book-sections", selectedBook?.id],
            });
            toast.success("Section deleted successfully.");
            setSelectedSection(null);
            setDeleteDialogOpen(false);
            setDeleteTarget(null);
        },
        onError: () => {
            toast.error("Failed to delete section.");
        },
    });

    const contentDeleteMutation = useMutation({
        mutationFn: async (contentId: string) => {
            await api.delete(endpoints.books.deleteContent(contentId));
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ["section-contents", selectedSection?.id],
            });
            toast.success("Content deleted successfully.");
            setDeleteDialogOpen(false);
            setDeleteTarget(null);
        },
        onError: () => {
            toast.error("Failed to delete content.");
        },
    });

    useEffect(() => {
        if (!selectedBook && books.length) {
            setSelectedBook(books[0]);
        }
    }, [
        books,
        selectedBook,
    ]);

    useEffect(() => {
        setPage(1);
    }, [search, status]);

    const expandAllSections = () => {
        setExpanded((prev) => {
            const nextState = Object.fromEntries(
                sectionIds.map((id) => [id, true]),
            );

            return {
                ...prev,
                ...nextState,
            };
        });
    };

    const collapseAllSections = () => {
        setExpanded((prev) => {
            const nextState = Object.fromEntries(
                sectionIds.map((id) => [id, false]),
            );

            return {
                ...prev,
                ...nextState,
            };
        });
    };

    const openCreateBookDialog = () => {
        setEditingBook(null);
        setBookDialogMode("create");
        setBookDialogOpen(true);
    };

    const openEditBookDialog = () => {
        if (!selectedBook) return;
        setEditingBook(selectedBook);
        setBookDialogMode("edit");
        setBookDialogOpen(true);
    };

    const openDeleteBookDialog = () => {
        if (!selectedBook) return;
        setDeleteTarget({
            type: "book",
            id: selectedBook.id,
            title: selectedBook.name,
            description: `This will permanently delete the book "${selectedBook.name}" and its linked section structure.`,
        });
        setDeleteDialogOpen(true);
    };

    const openCreateSectionDialog = () => {
        setEditingSection(null);
        setSectionDialogMode("create-root");
        setSectionDialogOpen(true);
    };

    const openCreateChildSectionDialog = (node: Section) => {
        setEditingSection(node);
        setSectionDialogMode("create-child");
        setSectionDialogOpen(true);
    };

    const openEditSectionDialog = (node: Section) => {
        setEditingSection(node);
        setSectionDialogMode("edit");
        setSectionDialogOpen(true);
    };

    const openDeleteSectionDialog = (node: Section) => {
        setDeleteTarget({
            type: "section",
            id: node.id,
            title: node.title,
            description: `This will permanently delete the section "${node.title}" and any nested children.`,
        });
        setDeleteDialogOpen(true);
    };

    const openCreateContentDialog = () => {
        setEditingContent(null);
        setContentDialogMode("create");
        setContentDialogOpen(true);
    };

    const openEditContentDialog = (item: ContentItem) => {
        setEditingContent(item);
        setContentDialogMode("edit");
        setContentDialogOpen(true);
    };

    const openViewContentDialog = (item: ContentItem) => {
        setEditingContent(item);
        setContentDialogMode("view");
        setContentDialogOpen(true);
    };

    const openDeleteContentDialog = (item: ContentItem) => {
        setDeleteTarget({
            type: "content",
            id: item.id,
            title: item.title,
            description: `This will permanently delete the content item "${item.title}" from the current section.`,
        });
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;

        if (deleteTarget.type === "book") {
            await bookDeleteMutation.mutateAsync(deleteTarget.id);
            return;
        }

        if (deleteTarget.type === "section") {
            await sectionDeleteMutation.mutateAsync(deleteTarget.id);
            return;
        }

        await contentDeleteMutation.mutateAsync(deleteTarget.id);
    };

    const totalBooks = data?.total ?? books.length;

    return (
        <div className="space-y-5">

            {/* Page header */}
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                        Library Management
                    </p>
                    <h1 className="text-2xl font-semibold tracking-tight">Books, Sections &amp; Content</h1>
                    <p className="text-sm text-muted-foreground">
                        Build the structure here — everything you publish appears in the Knowledge Base.
                    </p>
                </div>
                <Button onClick={openCreateBookDialog} className="shrink-0">
                    <Plus className="mr-2 h-4 w-4" />
                    New Book
                </Button>
            </div>

            {/* 3-pane workspace: Books | Sections | Content */}
            <div className="grid gap-4 xl:grid-cols-[300px_320px_minmax(0,1fr)]">

                {/* Books pane */}
                <Card className="flex flex-col overflow-hidden border-border/60">
                    <div className="space-y-3 border-b border-border/60 p-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm font-semibold">
                                <BookOpen className="h-4 w-4 text-primary" />
                                Books
                                <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                    {totalBooks}
                                </span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => refetch()} aria-label="Refresh books">
                                <RefreshCcw className="h-3.5 w-3.5" />
                            </Button>
                        </div>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                className="h-9 pl-9 text-sm"
                                placeholder="Search books…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="h-9 text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All status</SelectItem>
                                <SelectItem value="ACTIVE">Active</SelectItem>
                                <SelectItem value="DRAFT">Draft</SelectItem>
                                <SelectItem value="ARCHIVED">Archived</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex-1 p-2">
                        {isLoading ? (
                            <div className="space-y-2 p-1">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <Skeleton key={`book-skeleton-${i}`} className="h-14 w-full" />
                                ))}
                            </div>
                        ) : books.length === 0 ? (
                            <div className="px-4 py-12 text-center">
                                <BookOpen className="mx-auto h-8 w-8 text-muted-foreground/60" />
                                <p className="mt-3 text-sm font-medium">No books yet</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Create your first book to start adding sections.
                                </p>
                            </div>
                        ) : (
                            <ScrollArea className="h-[440px] pr-2">
                                <div className="space-y-1">
                                    {books.map((book) => {
                                        const active = selectedBook?.id === book.id;
                                        return (
                                            <button
                                                type="button"
                                                key={book.id}
                                                onClick={() => setSelectedBook(book)}
                                                className={`w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${
                                                    active
                                                        ? "border-primary/40 bg-primary/8"
                                                        : "border-transparent hover:bg-secondary"
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <span className={`truncate text-sm font-medium ${active ? "text-primary" : ""}`}>
                                                        {book.name}
                                                    </span>
                                                    <Badge
                                                        variant={book.status === "ACTIVE" ? "default" : "secondary"}
                                                        className="shrink-0 text-[10px]"
                                                    >
                                                        {book.status}
                                                    </Badge>
                                                </div>
                                                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                                    {book.slug} • {formatBookDate(book.created_at)}
                                                </p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </ScrollArea>
                        )}
                    </div>

                    {data && totalBooks > limit && (
                        <div className="flex items-center justify-between gap-2 border-t border-border/60 px-3 py-2">
                            <span className="text-xs text-muted-foreground">
                                {books.length} of {totalBooks}
                            </span>
                            <div className="flex gap-1">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7"
                                    disabled={page === 1}
                                    onClick={() => setPage((p) => p - 1)}
                                    aria-label="Previous page"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7"
                                    disabled={page * limit >= totalBooks}
                                    onClick={() => setPage((p) => p + 1)}
                                    aria-label="Next page"
                                >
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>

                {/* Sections pane */}
                <Card className="flex flex-col overflow-hidden border-border/60">
                    <div className="space-y-3 border-b border-border/60 p-3">
                        <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 text-sm font-semibold">
                                    <FolderTree className="h-4 w-4 text-primary" />
                                    Sections
                                </div>
                                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                    {!selectedBook
                                        ? "Select a book first"
                                        : sectionsLoading
                                            ? "Loading…"
                                            : `${sectionCount} in ${selectedBook.name}`}
                                </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => refetchSections()}
                                    disabled={!selectedBook || sectionsLoading}
                                    aria-label="Refresh sections"
                                >
                                    <RefreshCcw className="h-3.5 w-3.5" />
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Book actions" disabled={!selectedBook}>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={openEditBookDialog}>
                                            <Pencil className="mr-2 h-3.5 w-3.5" /> Edit book
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={expandAllSections}>Expand all</DropdownMenuItem>
                                        <DropdownMenuItem onClick={collapseAllSections}>Collapse all</DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive" onClick={openDeleteBookDialog}>
                                            <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete book
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                className="h-9 pl-9 text-sm"
                                placeholder="Search sections…"
                                value={sectionSearch}
                                onChange={(e) => setSectionSearch(e.target.value)}
                                disabled={!selectedBook}
                            />
                        </div>

                        <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            disabled={!selectedBook}
                            onClick={openCreateSectionDialog}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Section
                        </Button>
                    </div>

                    <div className="flex-1 p-2">
                        {!selectedBook ? (
                            <div className="px-4 py-12 text-center text-xs text-muted-foreground">
                                Pick a book to see its section tree.
                            </div>
                        ) : sectionsLoading ? (
                            <div className="space-y-2 p-1">
                                {Array.from({ length: 6 }).map((_, index) => (
                                    <Skeleton key={`section-skeleton-${index}`} className="h-9 w-full" />
                                ))}
                            </div>
                        ) : filteredSectionTree.length === 0 ? (
                            <div className="px-4 py-12 text-center text-xs text-muted-foreground">
                                {sectionSearch ? "No sections match this search." : "No sections yet — add the first one."}
                            </div>
                        ) : (
                            <ScrollArea className="h-[520px] pr-2">
                                <div className="space-y-0.5">
                                    {filteredSectionTree.map((node) => (
                                        <SectionNode
                                            key={node.id}
                                            node={node}
                                            level={0}
                                            expanded={expanded}
                                            toggle={toggleSection}
                                            selectedId={selectedSection?.id}
                                            onSelect={(nextNode) => setSelectedSection(nextNode)}
                                            onAddChild={openCreateChildSectionDialog}
                                            onEdit={openEditSectionDialog}
                                            onDelete={openDeleteSectionDialog}
                                        />
                                    ))}
                                </div>
                            </ScrollArea>
                        )}
                    </div>
                </Card>

                {/* Content pane */}
                <Card className="flex flex-col overflow-hidden border-border/60">
                    <div className="flex flex-col gap-3 border-b border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 text-sm font-semibold">
                                <FileText className="h-4 w-4 text-primary" />
                                Content
                            </div>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                {selectedSection
                                    ? `${selectedBook?.name ?? ""} › ${selectedSection.title}`
                                    : "Select a section to manage its content."}
                            </p>
                        </div>
                        <Button size="sm" disabled={!selectedSection} onClick={openCreateContentDialog}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Content
                        </Button>
                    </div>

                    <div className="p-4">
                        {!selectedSection ? (
                            <div className="rounded-xl border border-dashed border-border/60 px-6 py-16 text-center">
                                <FileText className="mx-auto h-8 w-8 text-muted-foreground/60" />
                                <p className="mt-3 text-sm font-medium">Nothing selected</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Choose a book, then a section, to add PDFs, Word documents or written content.
                                </p>
                            </div>
                        ) : (
                            <ContentTable
                                selectedSection={selectedSection}
                                onAddContent={openCreateContentDialog}
                                onViewContent={openViewContentDialog}
                                onEditContent={openEditContentDialog}
                                onDeleteContent={openDeleteContentDialog}
                            />
                        )}
                    </div>
                </Card>

            </div>

            <BookDialog
                open={bookDialogOpen}
                mode={bookDialogMode}
                book={editingBook}
                onOpenChange={setBookDialogOpen}
                onSaved={(book) => setSelectedBook((current) => ({
                    ...(current ?? { created_at: "", updated_at: "" }),
                    ...book,
                    description: book.description ?? undefined,
                }))}
            />

            <SectionDialog
                open={sectionDialogOpen}
                mode={sectionDialogMode}
                bookId={selectedBook?.id ?? ""}
                bookName={selectedBook?.name}
                section={editingSection}
                parentOptions={sectionTree}
                onOpenChange={setSectionDialogOpen}
            />

            {contentDialogOpen && (
                <ContentDialog
                    key={`${contentDialogMode}-${editingContent?.id ?? "new"}-${selectedSection?.id ?? ""}`}
                    open={contentDialogOpen}
                    mode={contentDialogMode}
                    content={editingContent}
                    bookId={selectedBook?.id ?? ""}
                    sectionId={selectedSection?.id ?? ""}
                    bookName={selectedBook?.name}
                    sectionTitle={selectedSection?.title}
                    onOpenChange={setContentDialogOpen}
                />
            )}

            <DeleteConfirmDialog
                open={deleteDialogOpen}
                title={`Delete ${deleteTarget?.type ?? "item"}`}
                description={deleteTarget?.description ?? "Are you sure you want to delete this item?"}
                loading={
                    bookDeleteMutation.isPending ||
                    sectionDeleteMutation.isPending ||
                    contentDeleteMutation.isPending
                }
                onOpenChange={setDeleteDialogOpen}
                onConfirm={confirmDelete}
            />

        </div>
    );
}

