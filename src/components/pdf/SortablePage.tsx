import { Trash2 } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { PagePreview } from './Pdf.interface';

interface SortablePageProps {
  page: PagePreview;
  onDeletePage?: (pageId: string) => void;
}

export function SortablePage({ page, onDeletePage }: SortablePageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition || undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  const truncateFileName = (name: string, maxLength = 15) => {
    const nameWithoutExt = name.substring(0, name.lastIndexOf('.')) || name;
    if (nameWithoutExt.length <= maxLength) return nameWithoutExt;
    return nameWithoutExt.substring(0, maxLength - 3) + '...';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-lg shadow-md border-2 border-gray-200 hover:border-blue-400 p-3 transition-colors duration-150 group relative"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
      >
        <div className="relative overflow-hidden rounded-md bg-gray-100">
          <img
            src={page.thumbnail}
            alt={`Page ${page.pageNumber}`}
            className="w-full rounded transition-transform duration-200 group-hover:scale-110"
          />
        </div>

        <div className="mt-2">
          <p
            className="text-xs font-semibold text-blue-600 truncate"
            title={page.fileName}
          >
            {truncateFileName(page.fileName)} {page.pageNumber}
          </p>
        </div>
      </div>

      {onDeletePage && (
        <button
          onClick={() => onDeletePage(page.id)}
          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
          title="Eliminar página"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
