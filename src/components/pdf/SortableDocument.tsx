import {
  ChevronDown,
  ChevronRight,
  FileText,
  GripVertical,
  Plus,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CSS } from '@dnd-kit/utilities';
import { Separator } from '@/components/ui/separator';
import { EmptyState } from './EmptyState';
import { useSortable } from '@dnd-kit/sortable';
import type { DocumentGroup } from './Pdf.interface';
import { PageGrid } from './PageGrid';

interface SortableDocumentProps {
  document: DocumentGroup;
  index: number;
  onToggleExpand: (id: string) => void;
  onPageReorder: (
    documentId: string,
    oldIndex: number,
    newIndex: number
  ) => void;
  onLoadPdfInSection: (documentId: string, file: File) => void;
  onDeleteDocument: (documentId: string) => void;
  onDeletePage: (documentId: string, pageId: string) => void;
  onToggleSeparatorPage: (documentId: string) => void;
}

export function SortableDocument({
  document,
  onToggleExpand,
  onPageReorder,
  onLoadPdfInSection,
  onDeleteDocument,
  onDeletePage,
  onToggleSeparatorPage,
}: SortableDocumentProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: document.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || undefined,
  };

  const isSeparator = document.type === 'separator';
  const isEmpty = document.pages.length === 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl shadow-lg border-2 overflow-hidden ${
        isSeparator
          ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300'
          : 'bg-white border-gray-300'
      }`}
    >
      <div
        className={`p-4 border-b ${
          isSeparator
            ? 'bg-slate-100 border-amber-200'
            : 'bg-slate-100 border-gray-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            {...attributes}
            {...listeners}
            className={`cursor-grab active:cursor-grabbing p-1 rounded transition-colors ${
              isSeparator ? 'hover:bg-amber-200' : 'hover:bg-blue-100'
            }`}
          >
            <GripVertical className="w-5 h-5 text-gray-400" />
          </div>

          {document.type === 'section' && (
            <button
              onClick={() => onToggleExpand(document.id)}
              className="p-1 hover:bg-blue-100 rounded transition-colors"
            >
              {document.isExpanded ? (
                <ChevronDown className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-600" />
              )}
            </button>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {isSeparator ? (
                <>
                  <Separator className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span className="font-semibold text-gray-700">
                    Separación
                  </span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="font-semibold text-gray-700 truncate">
                    {document.sectionTitle}
                  </span>
                </>
              )}
            </div>
            {isSeparator && (
              <p
                className="text-sm text-gray-600 truncate"
                title={document.sectionTitle}
              >
                {document.sectionTitle}
              </p>
            )}
            {document.type === 'section' && (
              <div className="mt-1 flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={document.includeSeparatorPage}
                    onChange={() => onToggleSeparatorPage(document.id)}
                    className="w-3 h-3 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-600">
                    Incluir página de separación al inicio
                  </span>
                </label>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isSeparator && (
              <>
                <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                  {document.pages.length}{' '}
                  {document.pages.length === 1 ? 'página' : 'páginas'}
                </span>

                {!isEmpty && (
                  <label>
                    <Button
                      size="sm"
                      variant="default"
                      className="bg-green-600 hover:bg-green-700 h-7 text-xs gap-1"
                      asChild
                    >
                      <span className="cursor-pointer">
                        <Plus className="w-3 h-3" />
                        PDF
                      </span>
                    </Button>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) =>
                        e.target.files &&
                        onLoadPdfInSection(document.id, e.target.files[0])
                      }
                      className="hidden"
                    />
                  </label>
                )}
              </>
            )}
            {isSeparator && (
              <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-medium">
                Página de separación
              </span>
            )}
            {!document.isStatic && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onDeleteDocument(document.id)}
                className="h-7 w-7 hover:bg-red-100"
                title="Eliminar"
              >
                <X className="w-4 h-4 text-red-600" />
              </Button>
            )}
            {document.isStatic && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                Fija
              </span>
            )}
          </div>
        </div>

        {!isSeparator && !document.isExpanded && document.pages.length > 0 && (
          <div className="mt-3 flex gap-2 overflow-x-auto">
            <div className="relative flex-shrink-0 w-20 h-24 rounded-md overflow-hidden border-2 border-gray-200">
              <img
                src={document.pages[0].thumbnail}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
            {document.pages.length > 1 && (
              <div className="flex items-center text-xs text-gray-500">
                +{document.pages.length - 1} más
              </div>
            )}
          </div>
        )}
      </div>

      {!isSeparator && document.isExpanded && (
        <div className="p-4 bg-gray-50">
          {isEmpty ? (
            <EmptyState
              onLoadPdf={(file) => onLoadPdfInSection(document.id, file)}
            />
          ) : (
            <PageGrid
              pages={document.pages}
              documentId={document.id}
              onPageReorder={onPageReorder}
              onDeletePage={onDeletePage}
            />
          )}
        </div>
      )}
    </div>
  );
}
