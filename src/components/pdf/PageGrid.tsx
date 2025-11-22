import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { rectSortingStrategy, SortableContext } from '@dnd-kit/sortable';
import type { PagePreview } from './Pdf.interface';
import { SortablePage } from './SortablePage';

interface PageGridProps {
  pages: PagePreview[];
  documentId: string;
  onPageReorder: (
    documentId: string,
    oldIndex: number,
    newIndex: number
  ) => void;
  onDeletePage: (documentId: string, pageId: string) => void;
}

export function PageGrid({ pages, documentId, onPageReorder, onDeletePage }: PageGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 3 },
    })
  );

  const handlePageDragEnd = (event: any) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = pages.findIndex((p) => p.id === active.id);
      const newIndex = pages.findIndex((p) => p.id === over.id);
      onPageReorder(documentId, oldIndex, newIndex);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handlePageDragEnd}
    >
      <SortableContext items={pages.map(p => p.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {pages.map((page) => (
            <SortablePage
              key={page.id}
              page={page}
              onDeletePage={(pageId) => onDeletePage(documentId, pageId)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
