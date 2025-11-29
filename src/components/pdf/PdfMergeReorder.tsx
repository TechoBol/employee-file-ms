import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.mjs?url';
import {
  closestCenter,
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { SortableDocument } from './SortableDocument';
import { DocumentCard } from './DocumentCard';
import { FileText } from 'lucide-react';
import {
  DEFAULT_SEPARATOR_PAGE_SIZE,
  type DocumentGroup,
  type PagePreview,
  type StaticSectionConfig,
} from './Pdf.interface';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export interface PdfMergeReorderRef {
  loadPdf: (file: File, targetDocumentId?: string) => Promise<void>;
  loadPdfFromUrl: (
    url: string,
    targetDocumentId?: string,
    fileName?: string
  ) => Promise<void>;
  addSeparator: (title: string) => void;
  addSection: (title: string) => void;
  exportMergedPdf: (filename?: string) => Promise<void>;
  exportSectionsPdfs: () => Promise<SectionPdfExport[]>;
  uploadSectionsToEndpoint: (
    config: UploadSectionsConfig
  ) => Promise<UploadSectionsResult>;
  getMergedPdfFromSections: (
    config: MergeSectionsConfig
  ) => Promise<MergeSectionsResult>;
  getDocuments: () => DocumentGroup[];
  getTotalPages: () => number;
}

export interface MergeSectionsConfig {
  sections: Array<{
    title: string;
    pdfUrl: string;
    includeSeparatorPage?: boolean;
  }>;
  includeCoverPage?: boolean;
  coverPageTitle?: string;
}

export interface MergeSectionsResult {
  success: boolean;
  blob?: Blob;
  error?: Error;
  totalPages?: number;
}

export interface UploadSectionsConfig {
  url: string;
  headers?: Record<string, string>;
  onlyStaticSections?: boolean;
  onlyWithPages?: boolean;
}

export interface UploadSectionsResult {
  success: boolean;
  response?: any;
  error?: Error;
}

export interface SectionPdfExport {
  sectionId: string;
  sectionTitle: string;
  blob: Blob;
  pageCount: number;
}

export interface PdfMergeReorderProps {
  documentTitle?: string;
  includeCoverPage?: boolean;
  staticSections?: StaticSectionConfig[];
  onDocumentsChange?: (documents: DocumentGroup[]) => void;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onLoadError?: (error: Error) => void;
  onExportStart?: () => void;
  onExportEnd?: () => void;
  onExportError?: (error: Error) => void;
}

export const PdfMergeReorder = forwardRef<
  PdfMergeReorderRef,
  PdfMergeReorderProps
>(
  (
    {
      documentTitle,
      includeCoverPage = false,
      staticSections = [],
      onDocumentsChange,
      onLoadStart,
      onLoadEnd,
      onLoadError,
      onExportStart,
      onExportEnd,
      onExportError,
    },
    ref
  ) => {
    const [documents, setDocuments] = useState<DocumentGroup[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(false);
    const initializedRef = useRef(false);

    const sensors = useSensors(
      useSensor(PointerSensor, {
        activationConstraint: { distance: 3 },
      })
    );

    // Notificar cambios en documentos
    const updateDocuments = (
      newDocs: DocumentGroup[] | ((prev: DocumentGroup[]) => DocumentGroup[])
    ) => {
      setDocuments((prev) => {
        const updated = typeof newDocs === 'function' ? newDocs(prev) : newDocs;
        onDocumentsChange?.(updated);
        return updated;
      });
    };

    // Cargar PDF desde URL
    const loadPdfFromUrl = async (
      url: string,
      targetDocumentId?: string,
      fileName?: string
    ) => {
      setLoading(true);
      onLoadStart?.();

      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Error fetching PDF: ${response.status}`);
        }

        const blob = await response.blob();
        const file = new File(
          [blob],
          fileName || url.split('/').pop() || 'document.pdf',
          {
            type: 'application/pdf',
          }
        );

        await loadPdfInternal(file, targetDocumentId);
        onLoadEnd?.();
      } catch (error) {
        console.error('Error loading PDF from URL:', error);
        onLoadError?.(
          error instanceof Error
            ? error
            : new Error('Error loading PDF from URL')
        );
      } finally {
        setLoading(false);
      }
    };

    // Función interna para procesar el PDF
    const loadPdfInternal = async (file: File, targetDocumentId?: string) => {
      const buffer = await file.arrayBuffer();
      const pdfData = new Uint8Array(buffer);

      const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
      const documentId = targetDocumentId || crypto.randomUUID();

      const pages: PagePreview[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.3 });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: false })!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({
          canvasContext: ctx,
          viewport,
          background: 'white',
          canvas,
        }).promise;

        const thumbnail = canvas.toDataURL('image/jpeg', 0.85);

        pages.push({
          id: crypto.randomUUID(),
          pdfFile: file,
          pageNumber: i,
          thumbnail,
          fileName: file.name,
          documentId,
        });
      }

      if (targetDocumentId) {
        updateDocuments((docs) =>
          docs.map((doc) =>
            doc.id === targetDocumentId
              ? {
                  ...doc,
                  pages: [...doc.pages, ...pages],
                }
              : doc
          )
        );
      } else {
        const newDocument: DocumentGroup = {
          id: documentId,
          sectionTitle: file.name,
          pages,
          isExpanded: false,
          type: 'section',
          includeSeparatorPage: false,
          isStatic: false,
        };
        updateDocuments((prev) => [...prev, newDocument]);
      }
    };

    // Inicializar secciones estáticas
    const initializeStaticSections = async () => {
      if (initializedRef.current || staticSections.length === 0) return;
      initializedRef.current = true;
      setInitializing(true);

      try {
        // Crear las secciones estáticas
        const newSections: DocumentGroup[] = staticSections.map((config) => ({
          id: config.id,
          sectionTitle: config.title,
          pages: [],
          isExpanded: true,
          type: 'section' as const,
          includeSeparatorPage: config.includeSeparatorPage ?? false,
          isStatic: true,
        }));

        updateDocuments(newSections);

        // Cargar PDFs de las secciones que tienen URL
        for (const config of staticSections) {
          if (config.pdfUrl) {
            await loadPdfFromUrl(
              config.pdfUrl,
              config.id,
              `${config.title}.pdf`
            );
          }
        }
      } catch (error) {
        console.error('Error initializing static sections:', error);
      } finally {
        setInitializing(false);
      }
    };

    // Inicializar al montar
    useEffect(() => {
      initializeStaticSections();
    }, []);

    const loadPdf = async (file: File, targetDocumentId?: string) => {
      setLoading(true);
      onLoadStart?.();

      try {
        await loadPdfInternal(file, targetDocumentId);
        onLoadEnd?.();
      } catch (error) {
        console.error('Error loading PDF:', error);
        onLoadError?.(
          error instanceof Error ? error : new Error('Error loading PDF')
        );
      } finally {
        setLoading(false);
      }
    };

    const addSeparator = (title: string) => {
      const newSeparator: DocumentGroup = {
        id: crypto.randomUUID(),
        sectionTitle: title,
        pages: [],
        isExpanded: false,
        type: 'separator',
        includeSeparatorPage: false,
      };

      updateDocuments((prev) => [...prev, newSeparator]);
    };

    const addSection = (title: string) => {
      const newSection: DocumentGroup = {
        id: crypto.randomUUID(),
        sectionTitle: title,
        pages: [],
        isExpanded: true,
        type: 'section',
        includeSeparatorPage: false,
      };

      updateDocuments((prev) => [...prev, newSection]);
    };

    const handleToggleExpand = (documentId: string) => {
      updateDocuments((docs) =>
        docs.map((doc) =>
          doc.id === documentId ? { ...doc, isExpanded: !doc.isExpanded } : doc
        )
      );
    };

    const handlePageReorder = (
      documentId: string,
      oldIndex: number,
      newIndex: number
    ) => {
      updateDocuments((docs) =>
        docs.map((doc) => {
          if (doc.id === documentId) {
            const newPages = [...doc.pages];
            const [movedPage] = newPages.splice(oldIndex, 1);
            newPages.splice(newIndex, 0, movedPage);
            return { ...doc, pages: newPages };
          }
          return doc;
        })
      );
    };

    const handleDocumentDragEnd = (event: any) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        updateDocuments((docs) => {
          const oldIndex = docs.findIndex((doc) => doc.id === active.id);
          const newIndex = docs.findIndex((doc) => doc.id === over.id);
          return arrayMove(docs, oldIndex, newIndex);
        });
      }
      setActiveId(null);
    };

    const handleDeleteDocument = (documentId: string) => {
      // No permitir eliminar secciones estáticas
      const doc = documents.find((d) => d.id === documentId);
      if (doc?.isStatic) {
        alert('Esta sección no se puede eliminar');
        return;
      }

      if (confirm('¿Estás seguro de eliminar este elemento?')) {
        updateDocuments((docs) => docs.filter((doc) => doc.id !== documentId));
      }
    };

    const handleDeletePage = (documentId: string, pageId: string) => {
      updateDocuments((docs) =>
        docs.map((doc) => {
          if (doc.id === documentId) {
            const newPages = doc.pages.filter((page) => page.id !== pageId);
            return { ...doc, pages: newPages };
          }
          return doc;
        })
      );
    };

    const handleToggleSeparatorPage = (documentId: string) => {
      updateDocuments((docs) =>
        docs.map((doc) =>
          doc.id === documentId
            ? { ...doc, includeSeparatorPage: !doc.includeSeparatorPage }
            : doc
        )
      );
    };

    const createSeparatorPage = async (
      mergedPdf: PDFDocument,
      title: string,
      fontSize = 36
    ) => {
      const page = mergedPdf.addPage([
        DEFAULT_SEPARATOR_PAGE_SIZE.width,
        DEFAULT_SEPARATOR_PAGE_SIZE.height,
      ]);
      const { height, width } = page.getSize();

      const helveticaBold = await mergedPdf.embedFont(
        StandardFonts.HelveticaBold
      );
      const textWidth = helveticaBold.widthOfTextAtSize(title, fontSize);

      page.drawText(title, {
        x: (width - textWidth) / 2,
        y: height / 2,
        size: fontSize,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      });
    };

    const exportMergedPdf = async (filename = 'merged.pdf') => {
      onExportStart?.();

      try {
        const merged = await PDFDocument.create();
        const pdfCache = new Map<string, PDFDocument>();

        // Cover page
        if (includeCoverPage) {
          const title =
            documentTitle ||
            new Date().toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });
          await createSeparatorPage(merged, title, 48);
        }

        // Process documents
        for (const doc of documents) {
          if (doc.type === 'separator') {
            await createSeparatorPage(merged, doc.sectionTitle || 'Separación');
          } else {
            if (doc.includeSeparatorPage) {
              await createSeparatorPage(merged, doc.sectionTitle || 'Sección');
            }

            for (const pageItem of doc.pages) {
              if (!pdfCache.has(doc.id)) {
                const buffer = await pageItem.pdfFile.arrayBuffer();
                const pdfDoc = await PDFDocument.load(buffer);
                pdfCache.set(doc.id, pdfDoc);
              }

              const pdfDoc = pdfCache.get(doc.id)!;
              const [copiedPage] = await merged.copyPages(pdfDoc, [
                pageItem.pageNumber - 1,
              ]);
              merged.addPage(copiedPage);
            }
          }
        }

        const bytes = await merged.save();
        const blob = new Blob([new Uint8Array(bytes).buffer as ArrayBuffer], {
          type: 'application/pdf',
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);

        onExportEnd?.();
      } catch (error) {
        console.error('Error exporting PDF:', error);
        onExportError?.(
          error instanceof Error ? error : new Error('Error exporting PDF')
        );
      }
    };

    const exportSectionsPdfs = async (): Promise<SectionPdfExport[]> => {
      onExportStart?.();

      try {
        const exports: SectionPdfExport[] = [];
        const pdfCache = new Map<string, PDFDocument>();

        for (const doc of documents) {
          if (doc.type === 'section' && doc.pages.length > 0) {
            const sectionPdf = await PDFDocument.create();

            if (doc.includeSeparatorPage) {
              await createSeparatorPage(
                sectionPdf,
                doc.sectionTitle || 'Sección'
              );
            }

            for (const pageItem of doc.pages) {
              if (!pdfCache.has(doc.id)) {
                const buffer = await pageItem.pdfFile.arrayBuffer();
                const pdfDoc = await PDFDocument.load(buffer);
                pdfCache.set(doc.id, pdfDoc);
              }

              const pdfDoc = pdfCache.get(doc.id)!;
              const [copiedPage] = await sectionPdf.copyPages(pdfDoc, [
                pageItem.pageNumber - 1,
              ]);
              sectionPdf.addPage(copiedPage);
            }

            const bytes = await sectionPdf.save();
            const blob = new Blob(
              [new Uint8Array(bytes).buffer as ArrayBuffer],
              { type: 'application/pdf' }
            );

            exports.push({
              sectionId: doc.id,
              sectionTitle: doc.sectionTitle,
              blob,
              pageCount: doc.pages.length + (doc.includeSeparatorPage ? 1 : 0),
            });
          }
        }

        onExportEnd?.();
        return exports;
      } catch (error) {
        console.error('Error exporting sections:', error);
        onExportError?.(
          error instanceof Error ? error : new Error('Error exporting sections')
        );
        return [];
      }
    };

    const uploadSectionsToEndpoint = async (
      config: UploadSectionsConfig
    ): Promise<UploadSectionsResult> => {
      onExportStart?.();

      try {
        const formData = new FormData();
        const sectionNames: string[] = [];

        // Filtrar secciones según configuración
        let sectionsToUpload = documents.filter(
          (doc) => doc.type === 'section'
        );

        if (config.onlyStaticSections) {
          sectionsToUpload = sectionsToUpload.filter((doc) => doc.isStatic);
        }

        if (config.onlyWithPages) {
          sectionsToUpload = sectionsToUpload.filter(
            (doc) => doc.pages.length > 0
          );
        }

        // Generar PDF para cada sección y agregarlo al FormData
        const pdfCache = new Map<string, PDFDocument>();

        for (const doc of sectionsToUpload) {
          if (doc.pages.length === 0) {
            // Sección vacía - crear PDF con una página en blanco
            sectionNames.push(doc.sectionTitle);
            const emptyPdf = await PDFDocument.create();
            emptyPdf.addPage();
            const bytes = await emptyPdf.save();
            const blob = new Blob(
              [new Uint8Array(bytes).buffer as ArrayBuffer],
              { type: 'application/pdf' }
            );
            const file = new File([blob], `${doc.sectionTitle}.pdf`, {
              type: 'application/pdf',
            });
            formData.append('files', file);
            continue;
          }

          const sectionPdf = await PDFDocument.create();

          if (doc.includeSeparatorPage) {
            await createSeparatorPage(
              sectionPdf,
              doc.sectionTitle || 'Sección'
            );
          }

          for (const pageItem of doc.pages) {
            const cacheKey = `${pageItem.fileName}-${pageItem.documentId}`;
            if (!pdfCache.has(cacheKey)) {
              const buffer = await pageItem.pdfFile.arrayBuffer();
              const pdfDoc = await PDFDocument.load(buffer);
              pdfCache.set(cacheKey, pdfDoc);
            }

            const pdfDoc = pdfCache.get(cacheKey)!;
            const [copiedPage] = await sectionPdf.copyPages(pdfDoc, [
              pageItem.pageNumber - 1,
            ]);
            sectionPdf.addPage(copiedPage);
          }

          const bytes = await sectionPdf.save();
          const blob = new Blob([new Uint8Array(bytes).buffer as ArrayBuffer], {
            type: 'application/pdf',
          });
          const file = new File([blob], `${doc.sectionTitle}.pdf`, {
            type: 'application/pdf',
          });

          formData.append('files', file);
          sectionNames.push(doc.sectionTitle);
        }

        // Construir URL con query params para sections
        const url = new URL(config.url);
        sectionNames.forEach((name) =>
          url.searchParams.append('sections', name)
        );

        const response = await fetch(url.toString(), {
          method: 'POST',
          headers: config.headers || {},
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        onExportEnd?.();

        return {
          success: true,
          response: data,
        };
      } catch (error) {
        console.error('Error uploading sections:', error);
        onExportError?.(
          error instanceof Error ? error : new Error('Error uploading sections')
        );

        return {
          success: false,
          error:
            error instanceof Error
              ? error
              : new Error('Error uploading sections'),
        };
      }
    };

    const getTotalPages = () => {
      return (
        documents.reduce(
          (sum, doc) =>
            sum +
            (doc.type === 'separator' ? 1 : doc.pages.length) +
            (doc.type === 'section' && doc.includeSeparatorPage ? 1 : 0),
          0
        ) + (includeCoverPage ? 1 : 0)
      );
    };

    const getMergedPdfFromSections = async (
      config: MergeSectionsConfig
    ): Promise<MergeSectionsResult> => {
      onExportStart?.();

      try {
        const merged = await PDFDocument.create();
        let totalPages = 0;

        console.log('Merging sections:', config);
        // Cover page opcional
        if (config.includeCoverPage) {
          const title =
            config.coverPageTitle ||
            new Date().toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });
          await createSeparatorPage(merged, title, 48);
          totalPages++;
        }

        // Procesar cada sección
        for (const section of config.sections) {
          try {
            // Cargar PDF desde URL primero
            const response = await fetch(section.pdfUrl);
            if (!response.ok) {
              console.error(
                `Error fetching PDF from ${section.pdfUrl}: ${response.status}`
              );
              continue; // Saltar esta sección si falla
            }

            const arrayBuffer = await response.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);

            // Página separadora de sección DESPUÉS de verificar que el PDF existe
            if (section.includeSeparatorPage) {
              await createSeparatorPage(merged, section.title);
              totalPages++;
            }

            // Copiar todas las páginas del PDF
            const pageCount = pdfDoc.getPageCount();
            const copiedPages = await merged.copyPages(
              pdfDoc,
              Array.from({ length: pageCount }, (_, i) => i)
            );

            copiedPages.forEach((page) => {
              merged.addPage(page);
            });

            totalPages += pageCount;
          } catch (error) {
            console.error(
              `Error loading PDF for section "${section.title}":`,
              error
            );
            // Continuar con las demás secciones
          }
        }

        const bytes = await merged.save();
        const blob = new Blob([new Uint8Array(bytes).buffer as ArrayBuffer], {
          type: 'application/pdf',
        });

        onExportEnd?.();

        return {
          success: true,
          blob,
          totalPages,
        };
      } catch (error) {
        console.error('Error merging PDFs from sections:', error);
        onExportError?.(
          error instanceof Error ? error : new Error('Error merging PDFs')
        );

        return {
          success: false,
          error:
            error instanceof Error ? error : new Error('Error merging PDFs'),
        };
      }
    };

    // Exponer métodos al componente padre
    useImperativeHandle(ref, () => ({
      loadPdf,
      loadPdfFromUrl,
      addSeparator,
      addSection,
      exportMergedPdf,
      exportSectionsPdfs,
      uploadSectionsToEndpoint,
      getMergedPdfFromSections,
      getDocuments: () => documents,
      getTotalPages,
    }));

    const activeDocument = documents.find((doc) => doc.id === activeId);

    return (
      <div className="w-full">
        {documents.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={(event) => setActiveId(event.active.id as string)}
            onDragEnd={handleDocumentDragEnd}
          >
            <SortableContext
              items={documents.map((d) => d.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {documents.map((doc, index) => (
                  <SortableDocument
                    key={doc.id}
                    document={doc}
                    index={index}
                    onToggleExpand={handleToggleExpand}
                    onPageReorder={handlePageReorder}
                    onLoadPdfInSection={(id, file) => loadPdf(file, id)}
                    onDeleteDocument={handleDeleteDocument}
                    onDeletePage={handleDeletePage}
                    onToggleSeparatorPage={handleToggleSeparatorPage}
                  />
                ))}
              </div>
            </SortableContext>

            <DragOverlay dropAnimation={null}>
              {activeId && activeDocument ? (
                <DocumentCard
                  document={activeDocument}
                  index={documents.findIndex((d) => d.id === activeId)}
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : (
          !loading && (
            <div className="text-center py-20 text-gray-400">
              <FileText className="w-20 h-20 mx-auto mb-4 opacity-50" />
              <p className="text-xl">
                Comienza creando una sección o cargando un PDF
              </p>
              <p className="text-sm mt-2">
                Las <strong>secciones</strong> agrupan PDFs • Las{' '}
                <strong>separaciones</strong> crean páginas divisorias
              </p>
            </div>
          )
        )}

        {(loading || initializing) && (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">
              {initializing
                ? 'Inicializando secciones...'
                : 'Procesando PDF...'}
            </p>
          </div>
        )}
      </div>
    );
  }
);

PdfMergeReorder.displayName = 'PdfMergeReorder';
