import { Upload } from "lucide-react";

interface EmptyStateProps {
  onLoadPdf: (file: File) => void;
}

export function EmptyState({ onLoadPdf }: EmptyStateProps) {
  return (
    <label className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
      <Upload className="w-12 h-12 text-gray-400 mb-3" />
      <span className="text-lg font-medium text-gray-600 mb-1">
        Arrastra un PDF aquí o haz clic para cargar
      </span>
      <span className="text-sm text-gray-500">Esta sección está vacía</span>
      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => e.target.files && onLoadPdf(e.target.files[0])}
        className="hidden"
      />
    </label>
  );
}