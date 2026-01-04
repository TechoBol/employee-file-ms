export const DEFAULT_SEPARATOR_PAGE_SIZE = {
  width: 612,
  height: 792,
};

export interface PagePreview {
  id: string;
  pdfFile: File;
  pageNumber: number;
  thumbnail: string;
  fileName: string;
  documentId: string;
}

export interface DocumentGroup {
  id: string;
  sectionTitle: string;
  pages: PagePreview[];
  isExpanded: boolean;
  type: 'section' | 'separator';
  includeSeparatorPage: boolean;
  isStatic?: boolean;
}

export interface StaticSectionConfig {
  id: string;
  title: string;
  pdfUrl?: string;
  includeSeparatorPage?: boolean;
}