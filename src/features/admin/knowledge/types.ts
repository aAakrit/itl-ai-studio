/* eslint-disable prettier/prettier */

/** Shared, read-only shapes for the Knowledge Base reading experience. */

export interface KnowledgeBook {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  status: string;
  sort_order?: number;
}

export interface KnowledgeSection {
  id: string;
  title: string;
  parent_id?: string | null;
  sort_order?: number;
  status?: string;
  children?: KnowledgeSection[];
}

export interface KnowledgeContentSummary {
  id: string;
  title: string;
  reference_no?: string;
  status?: string;
  version?: number;
  updated_at?: string;
  summary?: string;
  keywords?: string;
  section_id?: string;
  book_id?: string;
}

export interface KnowledgeContentDetail extends KnowledgeContentSummary {
  body?: string;
  content_html?: string | null;
  content_text?: string | null;
  plain_text?: string | null;

  // Original uploaded document
  document_path?: string | null;
  document_filename?: string | null;
  document_content_type?: string | null;
  document_size?: number | null;
  page_count?: number | null;

  // Keep temporarily if older records/API responses use these
  file_name?: string | null;
  file_type?: string | null;
}

export function contentHasPdf(
  content?: KnowledgeContentDetail | null
): boolean | undefined {
  if (!content) {
    return undefined;
  }

  const contentType =
    content.document_content_type?.toLowerCase();

  if (contentType) {
    return contentType.includes("pdf");
  }

  const filename =
    content.document_filename?.toLowerCase();

  if (filename) {
    return filename.endsWith(".pdf");
  }

  // Backward compatibility
  const oldType =
    content.file_type?.toLowerCase();

  if (oldType) {
    return oldType.includes("pdf");
  }

  const oldFilename =
    content.file_name?.toLowerCase();

  if (oldFilename) {
    return oldFilename.endsWith(".pdf");
  }

  return undefined;
}

export function contentHtmlOf(content?: KnowledgeContentDetail | null): string {
  return content?.content_html ?? content?.body ?? "";
}
