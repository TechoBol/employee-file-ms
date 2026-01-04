import { useMemo, useRef, useState } from 'react';
import { PdfMergeReorder, type PdfMergeReorderRef } from './PdfMergeReorder';
import type { DocumentGroup, StaticSectionConfig } from './Pdf.interface';
import { Modal } from './Modal';
import { Download, Plus, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { FileWithUrlResponse } from '@/rest-client/interface/response/FileResponse';
import { format } from 'date-fns';

const PREDEFINED_SECTIONS = [
  { key: 'informacion-personal', title: 'Información Personal' },
  { key: 'permisos-faltas', title: 'Permisos y Faltas' },
  { key: 'pagos', title: 'Pagos' },
  { key: 'otros', title: 'Otros' },
  { key: 'desvinculacion', title: 'Desvinculación' },
];

const mapFileToStaticSections = (
  fileData: FileWithUrlResponse
): StaticSectionConfig[] => {
  // Crear mapa de secciones predefinidas (título en minúsculas -> key)
  // const predefinedMap = new Map(
  //   PREDEFINED_SECTIONS.map((section) => [
  //     section.title.toLowerCase(),
  //     section.key,
  //   ])
  // );

  // Crear mapa de secciones existentes
  const existingSectionsMap = new Map(
    fileData.sections.map((section) => {
      const sectionTitle = section.section || section.originalName;
      return [
        sectionTitle.toLowerCase(),
        {
          id: section.id,
          title: sectionTitle,
          pdfUrl: section.url,
          includeSeparatorPage: false,
        },
      ];
    })
  );

  // 1. Primero agregar las secciones predefinidas
  const sections: StaticSectionConfig[] = PREDEFINED_SECTIONS.map(
    (predefinedSection) => {
      const existingSection = existingSectionsMap.get(
        predefinedSection.title.toLowerCase()
      );

      if (existingSection) {
        // Marcar como procesada
        existingSectionsMap.delete(predefinedSection.title.toLowerCase());
        return existingSection;
      }

      // Si no existe, crear una sección vacía
      return {
        id: `empty-${predefinedSection.key}`,
        title: predefinedSection.title,
        pdfUrl: undefined,
        includeSeparatorPage: false,
      };
    }
  );

  // 2. Agregar las secciones adicionales que no están en las predefinidas
  const additionalSections = Array.from(existingSectionsMap.values());

  return [...sections, ...additionalSections];
};

interface PdfManagerComponentProps {
  fileData?: FileWithUrlResponse;
  employeeId?: string;
  employeeName?: string;
}

export const PdfManagerComponent = ({
  fileData,
  employeeId,
  employeeName,
}: PdfManagerComponentProps) => {
  const pdfMergeRef = useRef<PdfMergeReorderRef>(null);
  const [documents, setDocuments] = useState<DocumentGroup[]>([]);
  const [showSeparatorModal, setShowSeparatorModal] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [separatorTitle, setSeparatorTitle] = useState('');
  const [sectionTitle, setSectionTitle] = useState('');

  const staticSections = useMemo(() => {
    if (!fileData) {
      // Si no hay datos del empleado, crear todas las secciones vacías
      return PREDEFINED_SECTIONS.map((section) => ({
        id: `empty-${section.key}`,
        title: section.title,
        pdfUrl: undefined,
        includeSeparatorPage: false,
      }));
    }
    return mapFileToStaticSections(fileData);
  }, [fileData]);

  const handleAddSeparator = () => {
    if (!separatorTitle.trim()) {
      alert('Por favor ingresa un título');
      return;
    }
    pdfMergeRef.current?.addSeparator(separatorTitle);
    setSeparatorTitle('');
    setShowSeparatorModal(false);
  };

  const handleAddSection = () => {
    if (!sectionTitle.trim()) {
      alert('Por favor ingresa un título');
      return;
    }
    pdfMergeRef.current?.addSection(sectionTitle);
    setSectionTitle('');
    setShowSectionModal(false);
  };

  const handleExportMerged = async () => {
    if (pdfMergeRef.current) {
      try {
        await pdfMergeRef.current.exportMergedPdf(`FILE-${employeeName ?? employeeId ?? 'unknown'}-${format(new Date(), 'yyyyMMdd')}.pdf`);
      } catch (error) {
        console.error('Error exporting:', error);
      }
    }
  };

  const handleUploadSections = async () => {
    if (!pdfMergeRef.current) return;

    const targetEmployeeId = employeeId || fileData?.employeeId;

    const companyId = localStorage.getItem('company_id');

    const result = await pdfMergeRef.current.uploadSectionsToEndpoint({
      url: `${
        import.meta.env.VITE_API_URL
      }/files/employees/${targetEmployeeId}`,
      headers: {
        'X-COMPANY-ID': companyId!,
      },
      onlyStaticSections: false,
      onlyWithPages: false,
    });

    if (result.success) {
      console.log('Subido exitosamente:', result.response);
      alert('Archivos subidos correctamente');
    } else {
      console.error('Error:', result.error);
      alert(`Error al subir: ${result.error?.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header con botones */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">File</h1>

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={() => setShowSectionModal(true)}
                variant="secondary"
              >
                <Plus className="w-5 h-5 mr-2" />
                Nueva Sección
              </Button>

              <Button onClick={handleUploadSections}>
                <Upload className="w-5 h-5 mr-2" />
                Guardar File
              </Button>
            </div>
            {documents.length > 0 && (
              <div className="flex gap-2">
                <Button
                  onClick={handleExportMerged}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Exportar File
                </Button>
              </div>
            )}
          </div>

          {/* Componente PdfMergeReorder con secciones estáticas */}
          <PdfMergeReorder
            ref={pdfMergeRef}
            documentTitle="Mi Documento"
            includeCoverPage={false}
            staticSections={staticSections}
            onDocumentsChange={setDocuments}
            onLoadError={(error) => alert(`Error: ${error.message}`)}
            onExportError={(error) =>
              alert(`Error al exportar: ${error.message}`)
            }
          />

          {/* Modals */}
          {showSeparatorModal && (
            <Modal
              open={showSeparatorModal}
              onOpenChange={(open) => {
                setShowSeparatorModal(open);
                if (!open) setSeparatorTitle('');
              }}
              title="Nueva Separación"
              value={separatorTitle}
              onChange={setSeparatorTitle}
              onSubmit={handleAddSeparator}
              placeholder="Título de la separación"
              submitText="Crear Separación"
              label="Título"
            />
          )}

          {showSectionModal && (
            <Modal
              open={showSectionModal}
              onOpenChange={(open) => {
                setShowSectionModal(open);
                if (!open) setSectionTitle('');
              }}
              title="Nueva Sección"
              description="Crea una sección vacía donde podrás cargar PDFs posteriormente"
              value={sectionTitle}
              onChange={setSectionTitle}
              onSubmit={handleAddSection}
              placeholder="Título de la sección"
              submitText="Crear Sección"
              label="Título"
            />
          )}
        </div>
      </div>
    </div>
  );
};
