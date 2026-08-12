/* eslint-disable prettier/prettier */
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, FileText, Pencil, Plus, RefreshCcw, Search, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
import { Skeleton } from "@/components/ui/skeleton";
import { api, endpoints } from "@/services/api/api";
import { useNavigate } from "@tanstack/react-router";

export interface SectionSummary {
  id: string;
  title: string;
  status?: string;
}

export interface ContentItem {
  id: string;
  title: string;
  reference_no?: string;
  status: string;
  version: number;
  updated_at: string;
}

interface ContentTableProps {
  selectedSection: SectionSummary | null;
  onAddContent?: () => void;
  onViewContent?: (item: ContentItem) => void;
  onEditContent?: (item: ContentItem) => void;
  onDeleteContent?: (item: ContentItem) => void;
}

async function fetchContents(
  sectionId: string,
  page: number,
  limit: number,
  search: string,
  status: string,
) {
  const { data } = await api.get<{ items?: ContentItem[]; results?: ContentItem[]; total?: number }>(endpoints.books.contents, {
    params: {
      page,
      limit,
      section_id: sectionId,
      search: search || undefined,
      status: status === "ALL" ? undefined : status,
    },
  });

  const items = data.items ?? data.results ?? [];
  return { items, total: data.total ?? items.length };
}

function formatUpdated(value?: string) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ContentTable({
  selectedSection,
  onAddContent,
  onViewContent,
  onEditContent,
  onDeleteContent,
}: ContentTableProps) {
  const [page, setPage] = useState(1);
  const limit = 10;
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const navigate = useNavigate();
  // Section changes represent a new result set, so pagination must start over.
  useEffect(() => { setPage(1); }, [selectedSection?.id, search, status]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["section-contents", selectedSection?.id, page, limit, search, status],
    queryFn: () => fetchContents(selectedSection!.id, page, limit, search, status),
    enabled: !!selectedSection,
  });

  const contents = useMemo(() => data?.items ?? [], [data]);

  if (!selectedSection) {
    return (
      <div className="rounded-xl border bg-muted/20 p-6">
        <div className="mx-auto max-w-md rounded-xl border border-dashed border-border/60 bg-background/60 p-8 text-center">
          <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Select a section</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose a section from the left tree to load its content items.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-muted/20 p-4">
      <div className="flex flex-col gap-3 border-b pb-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold">Content Workspace</p>
            <p className="text-xs text-muted-foreground">{selectedSection.title}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>

            <Button size="sm" onClick={onAddContent}>
              <Plus className="mr-2 h-4 w-4" />
              Add Content
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Search content..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={`content-skeleton-${index}`} className="h-12 w-full" />
            ))}
          </div>
        ) : contents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 bg-background/60 px-6 py-12 text-center">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No contents found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              This section does not have any content items yet.
            </p>
            <Button className="mt-4" size="sm" onClick={onAddContent}>
              <Plus className="mr-2 h-4 w-4" />
              Add Content
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg border bg-background/60">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Reference No</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contents.map((item: ContentItem) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell>{item.reference_no || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={item.status === "ACTIVE" ? "default" : "secondary"}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.version}</TableCell>
                      <TableCell>{formatUpdated(item.updated_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="View content"
                            onClick={() => {navigate({to:`/admin/knowledge?content=${item.id}`});}}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Edit content"
                            onClick={() => onEditContent?.(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            title="Delete content"
                            onClick={() => onDeleteContent?.(item)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {data && (
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {contents.length} of {data.total} content items
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={page === 1}
                    onClick={() => setPage((current) => current - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    disabled={page * limit >= data.total}
                    onClick={() => setPage((current) => current + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
