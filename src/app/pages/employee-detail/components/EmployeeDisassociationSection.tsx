import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { UserX, Calendar, AlertTriangle, Clock } from 'lucide-react';
import { EmployeeService } from '@/rest-client/services/EmployeeService';
import type { EmployeeResponse } from '@/rest-client/interface/response/EmployeeResponse';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type EmployeeDisassociationSectionProps = {
  employee: EmployeeResponse;
  onDisassociate?: (updatedEmployee: EmployeeResponse) => void;
};

const employeeService = new EmployeeService();

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-BO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const calculateDaysRemaining = (disassociatedAt: string): number => {
  const disassociatedDate = new Date(disassociatedAt);
  const deletionDate = new Date(disassociatedDate);
  deletionDate.setMonth(deletionDate.getMonth() + 1);

  const today = new Date();
  const diffTime = deletionDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
};

const calculateDeletionDate = (disassociatedAt: string): string => {
  const disassociatedDate = new Date(disassociatedAt);
  const deletionDate = new Date(disassociatedDate);
  deletionDate.setMonth(deletionDate.getMonth() + 1);

  return formatDate(deletionDate.toISOString());
};

export function EmployeeDisassociationSection({
  employee,
  onDisassociate,
}: EmployeeDisassociationSectionProps) {
  const [disassociateDialogOpen, setDisassociateDialogOpen] = useState(false);
  const [disassociating, setDisassociating] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState<number>(0);

  const isDisassociated = employee.disassociated;

  useEffect(() => {
    if (isDisassociated && employee.disassociatedAt) {
      // Actualizar contador cada segundo
      const updateCounter = () => {
        setDaysRemaining(calculateDaysRemaining(employee.disassociatedAt!));
      };

      updateCounter();
      const interval = setInterval(updateCounter, 60000); // Actualizar cada minuto

      return () => clearInterval(interval);
    }
  }, [isDisassociated, employee.disassociatedAt]);

  const handleDisassociateClick = () => {
    setDisassociateDialogOpen(true);
  };

  const handleDisassociateConfirm = async () => {
    try {
      setDisassociating(true);

      const updatedEmployee = await employeeService.disassociateEmployee(
        employee.id
      );

      toast.success('Empleado desvinculado', {
        description: (
          <p className="text-slate-700 select-none">
            {`${employee.firstName} ${employee.lastName} ha sido desvinculado correctamente`}
          </p>
        ),
      });

      if (onDisassociate) {
        onDisassociate(updatedEmployee);
      }
    } catch (error) {
      console.error('Error al desvincular empleado:', error);
      toast.error('Error al desvincular', {
        description: (
          <p className="text-slate-700 select-none">
            No se pudo desvincular al empleado
          </p>
        ),
      });
    } finally {
      setDisassociating(false);
      setDisassociateDialogOpen(false);
    }
  };

  if (isDisassociated) {
    const deletionDate = employee.disassociatedAt
      ? calculateDeletionDate(employee.disassociatedAt)
      : 'N/A';

    return (
      <section className="flex flex-col gap-6 p-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <span className="text-xl font-bold text-red-600">
            Empleado Desvinculado
          </span>
        </div>

        <Card className="rounded-2xl shadow-md border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <UserX className="h-8 w-8 text-red-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-red-900">
                      Estado de Desvinculación
                    </h3>
                    <p className="text-sm text-red-700">
                      Este empleado está en proceso de desvinculación
                    </p>
                  </div>
                </div>
                <Badge variant="destructive" className="text-sm">
                  Desvinculado
                </Badge>
              </div>

              <Separator className="bg-red-200" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-900">
                      Fecha de Desvinculación
                    </p>
                    <p className="text-sm text-red-700">
                      {employee.disassociatedAt
                        ? formatDate(employee.disassociatedAt)
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-900">
                      Fecha de Eliminación
                    </p>
                    <p className="text-sm text-red-700">{deletionDate}</p>
                  </div>
                </div>
              </div>

              <Separator className="bg-red-200" />

              <div className="bg-white rounded-lg p-4 border border-red-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-6 w-6 text-amber-600" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Días restantes para eliminación
                      </p>
                      <p className="text-xs text-gray-600">
                        Los datos del empleado serán eliminados automáticamente
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-red-600">
                      {daysRemaining}
                    </p>
                    <p className="text-xs text-gray-600">
                      {daysRemaining === 1 ? 'día' : 'días'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium mb-1">Aviso importante:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>
                        Los datos del empleado serán eliminados permanentemente
                        después de 30 días
                      </li>
                      <li>
                        No se podrán recuperar los registros una vez eliminados
                      </li>
                      <li>
                        Se recomienda descargar o respaldar cualquier
                        información necesaria antes de la eliminación
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6 p-4">
      <AlertDialog
        open={disassociateDialogOpen}
        onOpenChange={setDisassociateDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desvincular empleado?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción marcará al empleado{' '}
              <span className="font-semibold">
                {employee.firstName} {employee.lastName}
              </span>{' '}
              como desvinculado. Los datos del empleado se eliminarán
              automáticamente después de 30 días. Esta acción no se puede
              deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={disassociating}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisassociateConfirm}
              disabled={disassociating}
              className="bg-destructive/85 text-destructive-foreground hover:bg-destructive text-slate-100"
            >
              {disassociating ? 'Desvinculando...' : 'Desvincular'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-center gap-2">
        <UserX className="h-5 w-5 text-gray-600" />
        <span className="text-xl font-bold">Desvinculación de Empleado</span>
      </div>

      <Card className="rounded-2xl shadow-md">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <UserX className="h-8 w-8 text-gray-600" />
                <div>
                  <h3 className="text-lg font-semibold">
                    Gestión de Desvinculación
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Administra el proceso de desvinculación del empleado
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="text-sm">
                {employee.status === 'ACTIVE' ? 'Activo' : employee.status}
              </Badge>
            </div>

            <Separator />

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">
                    Advertencia sobre la desvinculación:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>
                      El empleado será marcado como desvinculado en el sistema
                    </li>
                    <li>
                      Se iniciará un período de 30 días antes de la eliminación
                      permanente
                    </li>
                    <li>
                      Durante este período, los datos aún estarán disponibles
                      pero el empleado no estará activo
                    </li>
                    <li>
                      Después de 30 días, todos los datos serán eliminados
                      permanentemente
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                variant="destructive"
                onClick={handleDisassociateClick}
                className="gap-2"
              >
                <UserX className="h-4 w-4" />
                Desvincular Empleado
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
