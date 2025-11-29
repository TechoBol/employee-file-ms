import { useEffect, useRef, useState } from 'react';
import {
  PdfMergeReorder,
  type MergeSectionsConfig,
  type PdfMergeReorderRef,
} from './PdfMergeReorder';
import { Download, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { FileWithUrlResponse } from '@/rest-client/interface/response/FileResponse';

interface PdfViewerComponentProps {
  fileData: FileWithUrlResponse;
  showDownloadButton?: boolean;
  downloadFileName?: string;
}

export const PdfViewerComponent = ({
  fileData,
  showDownloadButton = true,
  downloadFileName = 'file-empleado.pdf',
}: PdfViewerComponentProps) => {
  const pdfMergeRef = useRef<PdfMergeReorderRef>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);

  useEffect(() => {
    generatePdfPreview();

    // Cleanup: revoke object URL when component unmounts
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [fileData]);

  const generatePdfPreview = async () => {
    if (!pdfMergeRef.current) return;

    try {
      setIsGenerating(true);
      setError(null);

      // Preparar las secciones desde fileData
      const sections = fileData.sections
        .filter((section) => section.url) // Solo secciones con PDF
        .map((section) => ({
          title: section.section || section.originalName,
          pdfUrl: section.url,
          includeSeparatorPage: true,
        }));

      if (sections.length === 0) {
        setError('No hay documentos para mostrar');
        setIsGenerating(false);
        return;
      }

      const config: MergeSectionsConfig = {
        sections,
        includeCoverPage: true,
      };

      const result = await pdfMergeRef.current.getMergedPdfFromSections(config);

      if (result.success && result.blob) {
        // Revoke previous URL if exists
        if (pdfUrl) {
          URL.revokeObjectURL(pdfUrl);
        }

        const url = URL.createObjectURL(result.blob);
        setPdfUrl(url);
        setTotalPages(result.totalPages || 0);
      } else {
        setError(result.error?.message || 'Error al generar el PDF');
      }
    } catch (err) {
      console.error('Error generating PDF preview:', err);
      setError('Error al generar la vista previa del PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!pdfUrl) return;

    try {
      const response = await fetch(pdfUrl);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = downloadFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert('Error al descargar el PDF');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                <Eye className="w-8 h-8" />
                Visualización de File
              </h1>
              {totalPages > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  {totalPages} página{totalPages !== 1 ? 's' : ''} •{' '}
                  {fileData.sections.length} sección
                  {fileData.sections.length !== 1 ? 'es' : ''}
                </p>
              )}
            </div>

            {showDownloadButton && pdfUrl && !isGenerating && (
              <Button
                onClick={handleDownload}
                className="bg-green-600 hover:bg-green-700"
              >
                <Download className="w-5 h-5 mr-2" />
                Descargar PDF
              </Button>
            )}
          </div>

          {/* Loading State */}
          {isGenerating && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
              <p className="text-gray-600">Generando vista previa del PDF...</p>
            </div>
          )}

          {/* Error State */}
          {error && !isGenerating && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-600 font-medium">{error}</p>
              <Button
                onClick={generatePdfPreview}
                variant="outline"
                className="mt-4"
              >
                Reintentar
              </Button>
            </div>
          )}

          {/* PDF Viewer */}
          {pdfUrl && !isGenerating && !error && (
            <div className="border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
              <iframe
                src={pdfUrl}
                className="w-full"
                style={{ height: 'calc(100vh - 300px)', minHeight: '600px' }}
                title="Vista previa del PDF"
              />
            </div>
          )}

          {/* Hidden PdfMergeReorder component (only for PDF generation) */}
          <div className="hidden">
            <PdfMergeReorder
              ref={pdfMergeRef}
              documentTitle="File Empleado"
              includeCoverPage={false}
              staticSections={[]}
              onDocumentsChange={() => {}}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
