import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  MapPin,
  Calendar,
  Phone,
  FileText,
  Download,
  UserPlus,
  Edit,
  FolderOpen,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { PersonalInfoTexts } from '@/constants/localize';
import type { EmployeeResponse } from '@/rest-client/interface/response/EmployeeResponse';
import { PersonalInfoForm } from './forms/PersonalInfoForm';
import EmergencyContactForm from './forms/EmergencyContactForm';
import { ReusableDialog } from '@/app/shared/components/ReusableDialog';
import { EmployeeService } from '@/rest-client/services/EmployeeService';
import { FileService } from '@/rest-client/services/FileService';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import type { FileWithUrlResponse } from '@/rest-client/interface/response/FileResponse';
import { PdfManagerComponent } from '@/components/pdf/PdfManagerComponent';

type DialogContentType = 'EDIT_PERSONAL_INFO' | 'EMERGENCY_CONTACT' | null;

interface PersonalInfoProps {
  employeeId: string;
  companyId: string;
}

const employeeService = new EmployeeService();
const fileService = new FileService();

export function PersonalInfo({ employeeId, companyId }: PersonalInfoProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState<DialogContentType>(null);
  const [employee, setEmployee] = useState<EmployeeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileDrawerOpen, setFileDrawerOpen] = useState(false);
  const [fileData, setFileData] = useState<FileWithUrlResponse | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);

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

  const fetchEmployeeFile = async () => {
    try {
      setLoadingFile(true);
      const response = await fileService.getEmployeeFiles(employeeId);
      setFileData(response);
    } catch (e) {
      console.error('Error al cargar file del empleado:', e);
      setFileData(null);
    } finally {
      setLoadingFile(false);
    }
  };

  useEffect(() => {
    fetchEmployee();
  }, [employeeId]);

  const handleOpenFileDrawer = () => {
    fetchEmployeeFile();
    setFileDrawerOpen(true);
  };

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

      {/* Drawer para File Manager */}
      <Drawer open={fileDrawerOpen} onOpenChange={setFileDrawerOpen} shouldScaleBackground={true}>
        <DrawerContent className="">
          <DrawerHeader>
            <DrawerTitle>Administrar File del Empleado</DrawerTitle>
            <DrawerDescription>
              Gestiona todos los documentos y secciones del file del empleado
            </DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto flex-1 px-4">
            {loadingFile ? (
              <div className="flex items-center justify-center h-full">
                <Skeleton className="h-96 w-full" />
              </div>
            ) : (
              <PdfManagerComponent
                fileData={fileData || undefined}
                employeeId={employeeId}
                companyId={companyId}
              />
            )}
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Cerrar</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <div className="flex justify-between">
        <span className="text-xl font-bold">{PersonalInfoTexts.title}</span>
      </div>

      {/* Sección dedicada al File del empleado */}
      <section className="flex p-6 justify-between items-center rounded-lg border-2 border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[#DBEAFE] text-[#2563EB]">
            <span className="w-10 h-10">
              <FileText className="w-full h-full" />
            </span>
          </div>
          <span className="flex flex-col">
            <span className="text-lg font-semibold">File del Empleado</span>
            <span className="text-sm text-gray-600">
              Gestiona todos los documentos del empleado
            </span>
            {fileData && (
              <span className="text-xs text-gray-500 mt-1">
                {`Última actualización: ${new Date(
                  fileData.updatedAt
                ).toLocaleDateString()}`}
              </span>
            )}
          </span>
        </div>
        <section className="flex gap-3">
          <Button
            variant="outline"
            className="w-48"
            onClick={handleOpenFileDrawer}
          >
            <FolderOpen className="mr-2" />
            <span>Administrar File</span>
          </Button>
          <Button variant="outline" className="w-48" disabled>
            <Download className="mr-2" />
            <span>Descargar File</span>
          </Button>
        </section>
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
