import PdfUploader from '@/app/shared/components/PdfUploader';
import { ReusableDialog } from '@/app/shared/components/ReusableDialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { PersonalInfoTexts } from '@/constants/localize';
import {
  Calendar,
  CircuitBoard,
  Download,
  FileText,
  FileUp,
  MapPin,
  NotebookText,
  Phone,
  Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { PersonalInfoForm } from './forms/PersonalInfoForm';

type DialogContentType = 'EDIT_PERSONAL_INFO' | 'UPLOAD_CONTRACT' | null;

// TODO: Receive user data as props and display resume information
export function PersonalInfo() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState<DialogContentType>(null);

  const handleOpen = (type: DialogContentType) => {
    setDialogContent(type);
    setDialogOpen(true);
  };

  const renderDialogContent = useMemo(() => {
    switch (dialogContent) {
      case 'EDIT_PERSONAL_INFO':
        return <PersonalInfoForm />;
      case 'UPLOAD_CONTRACT':
        return (
          <PdfUploader
            onFileAccepted={(file) => {
              console.log('File accepted:', file);
            }}
          />
        );
      default:
        return null;
    }
  }, [dialogContent]);

  return (
    <section className="flex flex-col gap-6 p-4">
      <ReusableDialog
        title={
          dialogContent === 'EDIT_PERSONAL_INFO'
            ? 'Editar información personal'
            : 'Subir Documento'
        }
        description={
          dialogContent === 'EDIT_PERSONAL_INFO'
            ? 'Modifica la información del empleado'
            : 'Sube el documento de contrato del empleado'
        }
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      >
        {renderDialogContent}
      </ReusableDialog>
      <div className="flex justify-between">
        <span className="text-xl font-bold">{PersonalInfoTexts.title}</span>
        <section className="flex gap-4">
          <Button
            className="w-60"
            variant="outline"
            onClick={() => handleOpen('EDIT_PERSONAL_INFO')}
          >
            <NotebookText />
            <span>{PersonalInfoTexts.editPersonalInfo}</span>
          </Button>
          <Button className="w-40" disabled>
            <CircuitBoard />
            <span>{PersonalInfoTexts.generateContract}</span>
          </Button>
          <Button
            className="w-40"
            onClick={() => handleOpen('UPLOAD_CONTRACT')}
          >
            <FileUp />
            <span>{PersonalInfoTexts.uploadContract}</span>
          </Button>
        </section>
      </div>
      <section className="flex p-4 justify-between items-center rounded-lg border border-gray-200">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[#DBEAFE] text-[#2563EB]">
            <span className="w-10 h-10">
              <FileText className="w-full h-full" />
            </span>
          </div>
          <span className="flex flex-col">
            <span className="text-lg font-semibold">
              {PersonalInfoTexts.resume}
            </span>
            <span>{`${PersonalInfoTexts.lastUpdated}: 28/09/2023`}</span>
          </span>
        </div>
        <section className="flex flex-col items-center gap-2">
          <Button variant="outline" className="w-48" disabled>
            <Download />
            <span>{PersonalInfoTexts.download}</span>
          </Button>
          <Button variant="outline" className="w-48" disabled>
            <FileUp />
            <span>{PersonalInfoTexts.upload}</span>
          </Button>
        </section>
      </section>
      <section className="flex justify-end">
        <Button variant="destructive" className="w-48" disabled>
          <Trash2 />
          <span>{PersonalInfoTexts.delete}</span>
        </Button>
      </section>
      <section className="flex gap-8">
        <section className="flex flex-col gap-4 w-full">
          <span className="text-lg font-semibold">
            {PersonalInfoTexts.details}
          </span>
          <Separator decorative className="p-[1px]" />
          <section className="flex gap-4 items-center">
            <MapPin className="text-gray-400" />
            <p className="flex flex-col">
              <span className="text-md font-medium">
                {PersonalInfoTexts.address}
              </span>
              <span className="font-light">
                123 Main St, Springfield, IL 62701
              </span>
            </p>
          </section>
          <section className="flex gap-4 items-center">
            <Calendar className="text-gray-400" />
            <p className="flex flex-col">
              <span className="text-md font-medium">
                {PersonalInfoTexts.birthDate}
              </span>
              <span className="font-light">04/07/2001 (24)</span>
            </p>
          </section>
        </section>
        <section className="flex flex-col gap-4 w-full">
          <span className="text-lg font-semibold">
            {PersonalInfoTexts.details}
          </span>
          <Separator decorative className="p-[1px]" />
          <section className="flex gap-4 items-center">
            <Phone className="text-gray-400" />
            <p className="flex flex-col">
              <span className="text-md font-medium">Jacob Covington</span>
              <span className="font-light">+1 (555) 123-4567</span>
            </p>
          </section>
        </section>
      </section>
    </section>
  );
}
