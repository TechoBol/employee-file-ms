import { FileText, GripVertical } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import type { DocumentGroup } from './Pdf.interface';

interface DocumentCardProps {
  document: DocumentGroup;
  index: number;
}

export function DocumentCard({ document, index }: DocumentCardProps) {
  const isSeparator = document.type === 'separator';

  return (
    <div
      className={`rounded-xl shadow-lg border-2 overflow-hidden ${
        isSeparator
          ? 'bg-linear-to-r from-amber-50 to-orange-50 border-amber-300'
          : 'bg-white border-gray-300'
      }`}
    >
      <div
        className={`p-4 ${
          isSeparator
            ? 'bg-linear-to-r from-amber-100 to-orange-100'
            : 'bg-linear-to-r from-blue-50 to-indigo-50'
        }`}
      >
        <div className="flex items-center gap-3">
          <GripVertical className="w-5 h-5 text-gray-400" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {isSeparator ? (
                <Separator className="w-4 h-4 text-amber-600" />
              ) : (
                <FileText className="w-4 h-4 text-blue-600" />
              )}
              <span className="font-semibold text-gray-700">
                {isSeparator ? 'Separación' : `Sección ${index + 1}`}
              </span>
            </div>
            <p className="text-sm text-gray-600 truncate">
              {document.sectionTitle}
            </p>
          </div>
          {!isSeparator && (
            <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
              {document.pages.length}{' '}
              {document.pages.length === 1 ? 'página' : 'páginas'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
