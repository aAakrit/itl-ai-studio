/* eslint-disable prettier/prettier */

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, BookOpen, LayoutGrid, RefreshCcw } from "lucide-react";

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

        return (

        <div className="space-y-6">

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

                <div>

                    <h1 className="text-3xl font-bold">

                        Books Management

                    </h1>

                    <p className="text-muted-foreground">

                        Manage Books, Sections and Contents

                    </p>

                </div>

                <Button onClick={openCreateBookDialog}>

                    <Plus className="mr-2 h-4 w-4"/>

                    New Book

                </Button>

            </div>

            <Card>

                <CardHeader>

                    <CardTitle>

                        Books

                    </CardTitle>

                </CardHeader>

                <CardContent>

                  <div className="space-y-6">

    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div className="flex flex-1 gap-3">

            <div className="relative flex-1 max-w-md">

                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/>

                <Input
                    className="pl-10"
                    placeholder="Search books..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

            </div>

            <Select
                value={status}
                onValueChange={setStatus}
            >

                <SelectTrigger className="w-[180px]">

                    <SelectValue/>

                </SelectTrigger>

                <SelectContent>

                    <SelectItem value="ALL">

                        All Status

                    </SelectItem>

                    <SelectItem value="ACTIVE">

                        Active

                    </SelectItem>

                    <SelectItem value="DRAFT">

                        Draft

                    </SelectItem>

                    <SelectItem value="ARCHIVED">

                        Archived

                    </SelectItem>

                </SelectContent>

            </Select>

        </div>

        <Button
            variant="outline"
            onClick={() => refetch()}
        >

            Refresh

        </Button>

    </div>

    <Separator/>

    {
        isLoading ? (

            <div className="space-y-3">

                {Array.from({ length: 8 }).map((_, i) => (

                    <Skeleton
                        key={i}
                        className="h-12 w-full"
                    />

                ))}

            </div>

        ) : books.length === 0 ? (

            <div className="py-16 text-center">

                <BookOpen className="mx-auto h-14 w-14 text-muted-foreground"/>

                <h3 className="mt-4 text-lg font-semibold">

                    No Books Found

                </h3>

                <p className="text-muted-foreground">

                    Click "New Book" to create your first book.

                </p>

            </div>

        ) : (

            <Table>

                <TableHeader>

                    <TableRow>

                        <TableHead>

                            Book

                        </TableHead>

                        <TableHead>

                            Slug

                        </TableHead>

                        <TableHead>

                            Status

                        </TableHead>

                        <TableHead>

                            Created

                        </TableHead>

                    </TableRow>

                </TableHeader>

                <TableBody>

                    {

                        books.map((book) => (

                            <TableRow
                                key={book.id}
                                className={`cursor-pointer transition-colors hover:bg-muted/60 ${
                                    selectedBook?.id === book.id
                                        ? "bg-muted"
                                        : ""
                                }`}
                                onClick={() => setSelectedBook(book)}
                            >

                                <TableCell>

                                    <div>

                                        <div className="font-medium">

                                            {book.name}

                                        </div>

                                        <div className="text-xs text-muted-foreground">

                                            {book.description || "-"}

                                        </div>

                                    </div>

                                </TableCell>

                                <TableCell>

                                    {book.slug}

                                </TableCell>

                                <TableCell>

                                    <Badge
                                        variant={
                                            book.status === "ACTIVE"
                                                ? "default"
                                                : "secondary"
                                        }
                                    >

                                        {book.status}

                                    </Badge>

                                </TableCell>

                                <TableCell>

                                    {

                                        new Date(book.created_at)
                                            .toLocaleDateString()

                                    }

                                </TableCell>

                            </TableRow>

                        ))

                    }

                </TableBody>

            </Table>

        )

    }

    {

        data && (

            <div className="flex items-center justify-between pt-4">

                <div className="text-sm text-muted-foreground">

                    Showing {books.length} of {data.total} books

                </div>

                <div className="flex gap-2">

                    <Button
                        variant="outline"
                        disabled={page === 1}
                        onClick={() => setPage((p) => p - 1)}
                    >

                        Previous

                    </Button>

                    <Button
                        variant="outline"
                        disabled={page * limit >= data.total}
                        onClick={() => setPage((p) => p + 1)}
                    >

                        Next

                    </Button>

                </div>

            </div>

        )

    }

</div>

                </CardContent>

            </Card>

            <Card className="overflow-hidden border-border/60">

                <div className="flex flex-col gap-4 border-b p-4 lg:flex-row lg:items-center lg:justify-between">

                    <div>

                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">

                            Selected Book Workspace

                        </p>

                        <h2 className="mt-1 text-xl font-semibold">

                            {

                                selectedBook?.name ?? "Choose a book"

                            }

                        </h2>

                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">

                            <span>

                                {selectedBook?.slug ?? "—"}

                            </span>

                            <span>•</span>

                            <span>

                                {selectedBook
                                    ? formatBookDate(selectedBook.updated_at)
                                    : "No book selected"}

                            </span>

                        </div>

                    </div>

                    <div className="flex flex-wrap gap-2">

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => refetchSections()}
                            disabled={!selectedBook}
                        >

                            <RefreshCcw className="mr-2 h-4 w-4"/>

                            Refresh

                        </Button>

                        <Button
                            size="sm"
                            disabled={!selectedBook}
                            onClick={openCreateSectionDialog}
                        >

                            <Plus className="mr-2 h-4 w-4"/>

                            Add Section

                        </Button>

                        <Button
                            size="sm"
                            variant="secondary"
                            disabled={!selectedSection}
                            onClick={openCreateContentDialog}
                        >

                            <Plus className="mr-2 h-4 w-4"/>

                            Add Content

                        </Button>

                        <Button
                            size="sm"
                            variant="outline"
                            disabled={!selectedBook}
                            onClick={openEditBookDialog}
                        >

                            Edit Book

                        </Button>

                        <Button
                            size="sm"
                            variant="destructive"
                            disabled={!selectedBook}
                            onClick={openDeleteBookDialog}
                        >

                            Delete Book

                        </Button>

                    </div>

                </div>

                {

                    !selectedBook ? (

                        <div className="p-8 text-center text-sm text-muted-foreground">

                            Select a book from the table above to open the workspace.

                        </div>

                    ) : (

                        <div className="grid gap-4 p-4 lg:grid-cols-[320px_minmax(0,1fr)]">

                            <div className="rounded-xl border bg-muted/20 p-4">

                                <div className="flex flex-col gap-3">

                                    <div className="flex items-start justify-between gap-2">

                                        <div>

                                            <p className="text-sm font-semibold">

                                                Section Tree

                                            </p>

                                            <p className="text-xs text-muted-foreground">

                                                {

                                                    sectionsLoading
                                                        ? "Loading sections..."
                                                        : `${sectionCount} sections`

                                                }

                                            </p>

                                        </div>

                                        <div className="rounded-full bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border/60">

                                            {selectedBook.status}

                                        </div>

                                    </div>

                                    <div className="flex flex-wrap gap-2">

                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={expandAllSections}
                                            disabled={!selectedBook || sectionsLoading || sectionIds.length === 0}
                                        >

                                            Expand All

                                        </Button>

                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={collapseAllSections}
                                            disabled={!selectedBook || sectionsLoading || sectionIds.length === 0}
                                        >

                                            Collapse All

                                        </Button>

                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => refetchSections()}
                                            disabled={!selectedBook || sectionsLoading}
                                        >

                                            <RefreshCcw className="mr-2 h-4 w-4"/>

                                            Refresh

                                        </Button>

                                    </div>

                                    <div className="relative">

                                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/>

                                        <Input
                                            className="pl-10"
                                            placeholder="Search sections..."
                                            value={sectionSearch}
                                            onChange={(e) => setSectionSearch(e.target.value)}
                                        />

                                    </div>

                                    <div className="flex items-center justify-between gap-2">

                                        <Button
                                            size="sm"
                                            className="w-full"
                                            disabled={!selectedBook}
                                            onClick={openCreateSectionDialog}
                                        >

                                            <Plus className="mr-2 h-4 w-4"/>

                                            Add Root Section

                                        </Button>

                                    </div>

                                </div>

                                <div className="mt-4">

                                    {

                                        sectionsLoading ? (

                                            <div className="space-y-3">

                                                {Array.from({ length: 5 }).map((_, index) => (

                                                    <Skeleton
                                                        key={`section-skeleton-${index}`}
                                                        className="h-10 w-full"
                                                    />

                                                ))}

                                            </div>

                                        ) : filteredSectionTree.length === 0 ? (

                                            <div className="rounded-lg border border-dashed border-border/60 bg-background/50 px-4 py-10 text-center text-sm text-muted-foreground">

                                                No sections match this search.

                                            </div>

                                        ) : (

                                            <ScrollArea className="h-[420px] pr-2">

                                                <div className="space-y-1">

                                                    {

                                                        filteredSectionTree.map((node) => (

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

                                                        ))

                                                    }

                                                </div>

                                            </ScrollArea>

                                        )

                                    }

                                </div>

                            </div>

                            <div className="rounded-xl border bg-muted/20 p-4">

                                <div className="flex items-center justify-between gap-2">

                                    <div>

                                        <p className="text-sm font-semibold">

                                            Content Workspace

                                        </p>

                                        <p className="text-xs text-muted-foreground">

                                            Connected to the selected section.

                                        </p>

                                    </div>

                                    <div className="flex items-center gap-2 rounded-md bg-background px-2 py-1 text-xs font-medium text-muted-foreground">

                                        <LayoutGrid className="h-3.5 w-3.5"/>

                                        2-column layout

                                    </div>

                                </div>

                                <div className="mt-4">

                                    <ContentTable
                                        selectedSection={selectedSection}
                                        onAddContent={openCreateContentDialog}
                                        onViewContent={openViewContentDialog}
                                        onEditContent={openEditContentDialog}
                                        onDeleteContent={openDeleteContentDialog}
                                    />

                                </div>

                            </div>

                        </div>

                    )

                }

            </Card>

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

            <ContentDialog
                open={contentDialogOpen}
                mode={contentDialogMode}
                content={editingContent}
                bookId={selectedBook?.id ?? ""}
                sectionId={selectedSection?.id ?? ""}
                bookName={selectedBook?.name}
                sectionTitle={selectedSection?.title}
                onOpenChange={setContentDialogOpen}
            />

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
