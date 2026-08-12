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
  content_html?: string;
  content_text?: string;
  plain_text?: string;
  file_name?: string;
  file_type?: string;
  page_count?: number;
  word_count?: number;
}

/** A content record is PDF-backed when the import stored a PDF source. */
export function contentHasPdf(content?: KnowledgeContentDetail | null): boolean | undefined {
  if (!content) return undefined;
  const type = content.file_type?.toLowerCase();
  if (!type) return undefined;
  return type.includes("pdf");
}

export function contentHtmlOf(content?: KnowledgeContentDetail | null): string {
  return content?.content_html ?? content?.body ?? "";
}
