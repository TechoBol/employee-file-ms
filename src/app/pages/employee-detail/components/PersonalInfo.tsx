import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  MapPin,
  Calendar,
  Phone,
  FileText,
  Download,
  FileUp,
  Trash2,
  CircuitBoard,
  UserPlus,
  Edit,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { PersonalInfoTexts } from '@/constants/localize';
import type { EmployeeResponse } from '@/rest-client/interface/response/EmployeeResponse';
import { PersonalInfoForm } from './forms/PersonalInfoForm';
import EmergencyContactForm from './forms/EmergencyContactForm';
import PdfUploader from '@/app/shared/components/PdfUploader';
import { ReusableDialog } from '@/app/shared/components/ReusableDialog';

type DialogContentType =
  | 'EDIT_PERSONAL_INFO'
  | 'UPLOAD_CONTRACT'
  | 'EMERGENCY_CONTACT'
  | null;

interface PersonalInfoProps {
  employeeId: string;
}

const employeeService = new (
  await import('@/rest-client/services/EmployeeService')
).EmployeeService();

export function PersonalInfo({ employeeId }: PersonalInfoProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState<DialogContentType>(null);
  const [employee, setEmployee] = useState<EmployeeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployee = async () => {
    try {
      setLoading(true);
      const data = await employeeService.getEmployeeById(employeeId);
      setEmployee(data);
      setError(null);
    } catch (e) {
      setError(
        'Error al cargar información del empleado' +
          (e instanceof Error ? `: ${e.message}` : '')
      );
      setEmployee(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployee();
  }, [employeeId]);

  const handleOpen = (type: DialogContentType) => {
    setDialogContent(type);
    setDialogOpen(true);
  };

  const handleEmergencyContactSave = () => {
    fetchEmployee();
    setDialogOpen(false);
  };

  const renderDialogContent = useMemo(() => {
    switch (dialogContent) {
      case 'EDIT_PERSONAL_INFO':
        return <PersonalInfoForm />;
      case 'UPLOAD_CONTRACT':
        return (
          <PdfUploader
            onFileAccepted={(file: File) => {
              console.log('File accepted:', file);
            }}
          />
        );
      case 'EMERGENCY_CONTACT':
        return (
          <EmergencyContactForm
            employeeId={employeeId}
            initialData={employee?.emergencyContact}
            onSave={handleEmergencyContactSave}
          />
        );
      default:
        return null;
    }
  }, [dialogContent, employeeId, employee?.emergencyContact]);

  const getDialogTitle = () => {
    switch (dialogContent) {
      case 'EDIT_PERSONAL_INFO':
        return 'Editar información personal';
      case 'UPLOAD_CONTRACT':
        return 'Subir Documento';
      case 'EMERGENCY_CONTACT':
        return employee?.emergencyContact
          ? 'Editar contacto de emergencia'
          : 'Agregar contacto de emergencia';
      default:
        return '';
    }
  };

  const getDialogDescription = () => {
    switch (dialogContent) {
      case 'EDIT_PERSONAL_INFO':
        return 'Modifica la información del empleado';
      case 'UPLOAD_CONTRACT':
        return 'Sube el documento de contrato del empleado';
      case 'EMERGENCY_CONTACT':
        return employee?.emergencyContact
          ? 'Actualiza la información del contacto de emergencia'
          : 'Agrega un contacto de emergencia para el empleado';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <section className="flex flex-col gap-6 p-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </section>
    );
  }

  if (error || !employee) {
    return (
      <section className="flex flex-col gap-6 p-4">
        <div className="text-center text-destructive">
          <p>{error || 'No se pudo cargar la información'}</p>
        </div>
      </section>
    );
  }

  const hasEmergencyContact = !!employee.emergencyContact;

  return (
    <section className="flex flex-col gap-6 p-4">
      <ReusableDialog
        title={getDialogTitle()}
        description={getDialogDescription()}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      >
        {renderDialogContent}
      </ReusableDialog>

      <div className="flex justify-between">
        <span className="text-xl font-bold">{PersonalInfoTexts.title}</span>
        <section className="flex gap-4">
          {/* <Button
            className="w-60"
            variant="outline"
            onClick={() => handleOpen('EDIT_PERSONAL_INFO')}
          >
            <NotebookText />
            <span>{PersonalInfoTexts.editPersonalInfo}</span>
          </Button> */}
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
          <span className="text-2xl font-semibold">
            {PersonalInfoTexts.details}
          </span>
          <Separator decorative className="p-[1px]" />
          <section className="flex gap-4 items-center">
            <MapPin className="text-gray-400" />
            <p className="flex flex-col">
              <span className="text-md font-medium">Dirección</span>
              <span className="text-md font-light">{employee.address}</span>
            </p>
          </section>
          <section className="flex gap-4 items-center">
            <Calendar className="text-gray-400" />
            <p className="flex flex-col">
              <span className="text-md font-medium">Fecha de Nacimiento</span>
              <span className="text-md font-light">{employee.birthDate}</span>
              <span className="font-light"></span>
            </p>
          </section>
        </section>

        {/* Contacto de emergencia */}
        <section className="flex flex-col gap-4 w-full">
          <div className="flex justify-between items-center">
            <span className="text-2xl font-semibold">
              Contacto de emergencia
            </span>
            <Button
              variant={hasEmergencyContact ? 'outline' : 'default'}
              size="sm"
              onClick={() => handleOpen('EMERGENCY_CONTACT')}
            >
              {hasEmergencyContact ? (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Agregar
                </>
              )}
            </Button>
          </div>
          <Separator decorative className="p-[1px]" />

          {hasEmergencyContact ? (
            <>
              <section className="flex gap-4 items-center">
                <Phone className="text-gray-400" />
                <p className="flex flex-col">
                  <span>
                    <span className="text-md font-medium">
                      {`${employee.emergencyContact.fullName} (${employee.emergencyContact.relation})`}
                    </span>
                    <span className="font-light text-sm"></span>
                  </span>

                  <span className="font-light">
                    {employee.emergencyContact.phone}
                  </span>
                </p>
              </section>
              <section className="flex gap-4 items-center">
                <MapPin className="text-gray-400" />
                <p className="flex flex-col">
                  <span className="text-md font-medium">Dirección</span>
                  <span className="font-light">
                    {employee.emergencyContact.address}
                  </span>
                </p>
              </section>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">
              No hay contacto de emergencia registrado
            </p>
          )}
        </section>
      </section>
    </section>
  );
}
