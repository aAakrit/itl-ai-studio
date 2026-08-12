/* eslint-disable prettier/prettier */
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, endpoints } from "@/services/api/api";
import { RichTextEditor } from "@/components/common/RichTextEditor";
import { PdfViewer } from "@/features/admin/knowledge/PdfViewer";
import { useContentPdf } from "@/features/admin/knowledge/useContentPdf";
import { importContentDocument } from "@/utils/export";

export interface ContentRecord {
  id: string;
  title: string;
  reference_no?: string;
  keywords?: string;
  summary?: string;
  status: string;
  version: number;
  updated_at: string;

  body?: string;
  content_html?: string;
  content_text?: string;

  document_path?: string | null;
  document_filename?: string | null;
  document_content_type?: string | null;
  document_size?: number | null;
  page_count?: number | null;

  // Keep these only if old API responses still use them
  file_name?: string;
  file_type?: string;
}

interface ContentDialogProps {
  open: boolean;
  mode: "create" | "edit" | "view";
  content?: ContentRecord | null;
  bookId: string;
  sectionId: string;
  bookName?: string;
  sectionTitle?: string;
  onOpenChange: (open: boolean) => void;
}

const contentSchema = z.object({
  book_id: z.string().min(1, "Book is required."),
  section_id: z.string().min(1, "Section is required."),
  title: z.string().min(1, "Title is required."),
  reference_no: z.string().min(1, "Reference number is required."),
  keywords: z.string().optional(),
  summary: z.string().optional(),
  status: z.string().min(1, "Status is required."),
  version: z.string().regex(/^[1-9]\d*$/, "Version must be at least 1."),
  content_html: z.string().optional(),
  content_text: z.string().optional(),
});
type ContentFormValues = z.infer<typeof contentSchema>;

export function ContentDialog({
  open,
  mode,
  content,
  bookId,
  sectionId,
  bookName,
  sectionTitle,
  onOpenChange,
}: ContentDialogProps) {
  const queryClient = useQueryClient();
  const { data: contentDetail } = useQuery({
    queryKey: ["book-content", content?.id],
    queryFn: async () => (await api.get<ContentRecord>(endpoints.books.content(content!.id))).data,
    enabled: open && Boolean(content?.id),
  });
  const currentContent = contentDetail ?? content;
  const form = useForm<ContentFormValues>({
    resolver: zodResolver(contentSchema),
    defaultValues: useMemo(
      () => ({
        book_id: bookId,
        section_id: sectionId,
        title: currentContent?.title ?? "",
        reference_no: currentContent?.reference_no ?? "",
        keywords: currentContent?.keywords ?? "",
        summary: currentContent?.summary ?? "",
        status: currentContent?.status ?? "ACTIVE",
        version: String(currentContent?.version ?? 1),
        content_html: currentContent?.content_html ?? currentContent?.body ?? "",
        content_text: currentContent?.content_text ?? "",
      }),
      [bookId, currentContent, sectionId],
    ),
  });

  const importMutation = useMutation({
      mutationFn: importContentDocument,
      onSuccess: (result) => {
      form.setValue("title", result.title);

      form.setValue(
        "content_html",
        result.html_content ?? "",
      );

      form.setValue(
        "content_text",
        result.plain_text ?? "",
      );

      setImportedDocument({
        fileName: result.file_name,
        fileType: result.file_type,
        pageCount: result.page_count,
        wordCount: result.word_count,

        attachmentPath: result.attachment_path,
        attachmentFilename: result.attachment_filename,
        attachmentContentType: result.attachment_content_type,
        attachmentSize: result.attachment_size,
      });

      setContentSource("upload");

      toast.success("Document imported successfully.");
    },
  });

  const handleImport = (
  event: React.ChangeEvent<HTMLInputElement>,
) => {
  const file = event.target.files?.[0];

  if (!file) {
    return;
  }

  // Optional validation
  const allowedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (!allowedTypes.includes(file.type)) {
    toast.error("Only PDF and DOCX files are supported.");
    event.target.value = "";
    return;
  }

  if (file.size > 20 * 1024 * 1024) {
    toast.error("Maximum file size is 20 MB.");
    event.target.value = "";
    return;
  }

  importMutation.mutate(file);

  // Allow selecting the same file again
  event.target.value = "";
};

  useEffect(() => {
    form.reset({
      book_id: bookId,
      section_id: sectionId,
      title: currentContent?.title ?? "",
      reference_no: currentContent?.reference_no ?? "",
      keywords: currentContent?.keywords ?? "",
      summary: currentContent?.summary ?? "",
      status: currentContent?.status ?? "DRAFT",
      version: String(currentContent?.version ?? 1),
      content_html: currentContent?.content_html ?? currentContent?.body ?? "",
      content_text: currentContent?.content_text ?? "",
    });
    setImportedDocument(null);
    if (currentContent?.content_html) {
        setContentSource("manual");
    } else {
        setContentSource(null);
    }
  }, [bookId, currentContent, form, sectionId]);

  const mutation = useMutation({
    mutationFn: async (values: ContentFormValues) => {
    const slugify = (value: string): string => {
      return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    };

    const payload = {
      book_id: values.book_id,
      section_id: values.section_id,

      title: values.title,

      slug: slugify(values.title),

      reference_no: values.reference_no || null,

      keywords: values.keywords
        ? values.keywords
            .split(",")
            .map((keyword) => keyword.trim())
            .filter(Boolean)
        : [],

      summary: values.summary || null,

      status: values.status,

      version: Number(values.version),

      sort_order: 0,
      html_content: values.content_html ?? "",

      plain_text: values.content_text ?? "",
      document_path:
        importedDocument?.attachmentPath ?? null,

      document_filename:
        importedDocument?.attachmentFilename ?? null,

      document_content_type:
        importedDocument?.attachmentContentType ?? null,

      document_size:
        importedDocument?.attachmentSize ?? null,

      page_count:
        importedDocument?.pageCount ?? null,
    };

    if (mode === "edit" && content?.id) {
      const { data } = await api.put(
        endpoints.books.updateContent(content.id),
        payload,
      );

      return data;
    }

    const { data } = await api.post(
      endpoints.books.createContent,
      payload,
    );

    return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["section-contents", sectionId],
      });
      toast.success(
        mode === "edit" ? "Content updated successfully." : "Content created successfully.",
      );
      onOpenChange(false);
      form.reset();
    },
    onError: () => {
      toast.error(mode === "edit" ? "Failed to update content." : "Failed to create content.");
    },
  });

  const onSubmit = (values: ContentFormValues) => mutation.mutate(values);

  const isReadOnly = mode === "view";

  const [contentSource, setContentSource] = useState<
    "manual" | "upload" | null
  >(null);

  const [importedDocument, setImportedDocument] = useState<{
    fileName: string;
    fileType: string;
    pageCount?: number | null;
    wordCount?: number | null;

    attachmentPath?: string | null;
    attachmentFilename?: string | null;
    attachmentContentType?: string | null;
    attachmentSize?: number | null;
  } | null>(null);

  const [editorTab, setEditorTab] = useState("editor");

  // The "Original PDF" tab only makes sense for a saved, PDF-backed record.
  // DOCX imports keep the extracted-HTML-only workflow.
  const savedFileType =
    currentContent?.document_content_type?.toLowerCase() ??
    currentContent?.file_type?.toLowerCase() ??
    "";
  const knownPdf = savedFileType.includes("pdf");
  const importedFileType = importedDocument?.fileType?.toLowerCase() ?? "";
  const combinedFileType = `${savedFileType} ${importedFileType}`;
  const knownDocx =
    combinedFileType.includes("docx") || combinedFileType.includes("word");

  // When the record does not expose a file type, probe the PDF endpoint once
  // (the result is shared with the embedded viewer through the query cache).
  const pdfProbe = useContentPdf(
    content?.id,
    open && Boolean(content?.id) && !knownPdf && !knownDocx,
  );

  const hasOriginalPdf =
  importedFileType.includes("pdf") ||
  knownPdf ||
  (Boolean(content?.id) && pdfProbe.hasPdf === true);

  useEffect(() => {
    setEditorTab("editor");
  }, [content?.id, open]);



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[95vh] w-[95vw] max-w-none overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {mode === "view" ? "View Content" : mode === "edit" ? "Edit Content" : "Create Content"}
          </DialogTitle>
          <DialogDescription>
            {mode === "view"
              ? "Read-only content details for the selected section."
              : "Create or update content with the section context already selected."}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border bg-muted/30 p-3 text-sm">
          <div className="grid gap-2 md:grid-cols-2">
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Book
              </div>
              <div className="mt-1 font-medium">{bookName || "—"}</div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Section
              </div>
              <div className="mt-1 font-medium">{sectionTitle || "—"}</div>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input
                        autoFocus
                        placeholder="Content title"
                        {...field}
                        readOnly={isReadOnly}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reference_no"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reference Number</FormLabel>
                    <FormControl>
                      <Input placeholder="REF-001" {...field} readOnly={isReadOnly} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="version"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Version</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} readOnly={isReadOnly} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isReadOnly || mode !== "edit"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="ARCHIVED">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="keywords"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Keywords</FormLabel>
                    <FormControl>
                      <Input placeholder="keyword, keyword" {...field} readOnly={isReadOnly} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="summary"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Summary</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Brief summary"
                        {...field}
                        readOnly={isReadOnly}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content_html"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Body</FormLabel>
                    <FormControl>
                      <div className="space-y-3">
                        {!isReadOnly && contentSource === null && (
                          <div className="grid gap-4 md:grid-cols-2">
                              <button
                                  type="button"
                                  onClick={() => setContentSource("manual")}
                                  className="rounded-xl border p-6 text-left transition hover:border-primary hover:bg-muted/40"
                              >
                                  <h3 className="font-semibold">
                                      📝 Write Manually
                                  </h3>
                                  <p className="mt-2 text-sm text-muted-foreground">
                                      Create and edit content using the rich text editor.
                                  </p>
                              </button>
                              <button
                                  type="button"
                                  onClick={() => setContentSource("upload")}
                                  className="rounded-xl border p-6 text-left transition hover:border-primary hover:bg-muted/40"
                              >
                                  <h3 className="font-semibold">
                                      📄 Import PDF / Word
                                  </h3>
                                  <p className="mt-2 text-sm text-muted-foreground">
                                      Upload a document and convert it into editable content.
                                  </p>
                              </button>
                          </div>
                          )}
                          {contentSource === "upload" && !importedDocument && (
                            importMutation.isPending ? (
                              <div className="rounded-xl border bg-muted/30 p-10 text-center">
                                <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />

                                <p className="text-lg font-semibold">
                                  Importing document...
                                </p>

                                <p className="mt-2 text-sm text-muted-foreground">
                                  Uploading and processing your document. Please wait.
                                </p>

                                <p className="mt-1 text-xs text-muted-foreground">
                                  Do not close this window.
                                </p>
                              </div>
                            ) : (
                              <div className="rounded-xl border-2 border-dashed p-10 text-center">
                                <input
                                  id="content-import"
                                  hidden
                                  type="file"
                                  accept=".pdf,.docx"
                                  onChange={handleImport}
                                />

                                <p className="text-lg font-semibold">
                                  Drag & Drop PDF or DOCX
                                </p>

                                <p className="mt-2 text-sm text-muted-foreground">
                                  or
                                </p>

                                <Button
                                  className="mt-4"
                                  type="button"
                                  disabled={importMutation.isPending}
                                  onClick={() =>
                                    document
                                      .getElementById("content-import")
                                      ?.click()
                                  }
                                >
                                  Browse Files
                                </Button>

                                <p className="mt-4 text-xs text-muted-foreground">
                                  Supported: PDF, DOCX • Max 20 MB
                                </p>
                              </div>
                            )
                          )}
                          {importedDocument && (
                            <div className="rounded-lg border bg-green-50 p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-medium text-foreground">
                                            ✓ {importedDocument.fileName}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {importedDocument.fileType.toUpperCase()}
                                            {importedDocument.pageCount
                                                ? ` • ${importedDocument.pageCount} pages`
                                                : ""}
                                            {/* {importedDocument.wordCount != null
                                                ? ` • ${importedDocument.wordCount.toLocaleString()} words`
                                                : ""} */}
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setImportedDocument(null);
                                            document
                                                .getElementById("content-import")
                                                ?.click();
                                        }}
                                    >
                                        Replace
                                    </Button>
                                </div>
                            </div>
                          )}
                          {(contentSource === "manual" || importedDocument) && (
                          <>
                            {hasOriginalPdf ? (
                              <div className="mt-3">
                                <PdfViewer
                                  contentId={content?.id}
                                  enabled={true}
                                  fileName={
                                    importedDocument?.attachmentFilename ??
                                    importedDocument?.fileName ??
                                    currentContent?.document_filename ??
                                    currentContent?.file_name
                                  }
                                />
                              </div>
                            ) : (
                              <RichTextEditor
                                content={field.value ?? ""}
                                onChange={(html, text) => {
                                  field.onChange(html);

                                  form.setValue("content_text", text, {
                                    shouldDirty: true,
                                  });
                                }}
                              />
                            )}
                          </>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {isReadOnly ? "Close" : "Cancel"}
              </Button>
              {!isReadOnly && (
                <Button type="submit" disabled={mutation.isPending || importMutation.isPending || contentSource === null}>
                  {mutation.isPending
                    ? "Saving..."
                    : mode === "edit"
                      ? "Save Changes"
                      : "Create Content"}
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
