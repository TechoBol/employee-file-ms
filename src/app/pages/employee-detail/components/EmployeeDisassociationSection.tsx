import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Calendar as CalendarIcon,
  UserX,
  AlertTriangle,
  Clock,
  UserCheck,
  Edit2,
} from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn, formatDate } from '@/lib/utils';

type EmployeeDisassociationSectionProps = {
  employee: EmployeeResponse;
  onDisassociate?: (updatedEmployee: EmployeeResponse) => void;
  onAssociate?: (updatedEmployee: EmployeeResponse) => void;
};

const employeeService = new EmployeeService();

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
  onAssociate,
}: EmployeeDisassociationSectionProps) {
  const [disassociateDialogOpen, setDisassociateDialogOpen] = useState(false);
  const [associateDialogOpen, setAssociateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [disassociating, setDisassociating] = useState(false);
  const [associating, setAssociating] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState<number>(0);

  const [disassociationDate, setDisassociationDate] = useState<
    Date | undefined
  >(undefined);
  const [disassociationReason, setDisassociationReason] = useState<string>('');
  const [editing, setEditing] = useState(false);

  const isDisassociated = employee.isDisassociated;

  useEffect(() => {
    if (isDisassociated && employee.disassociatedAt) {
      const updateCounter = () => {
        setDaysRemaining(calculateDaysRemaining(employee.disassociatedAt!));
      };

      updateCounter();
      const interval = setInterval(updateCounter, 60000);

      return () => clearInterval(interval);
    }
  }, [isDisassociated, employee.disassociatedAt]);

  useEffect(() => {
    if (disassociateDialogOpen && !isDisassociated) {
      setDisassociationDate(new Date());
      setDisassociationReason('');
    }
  }, [disassociateDialogOpen, isDisassociated]);

  useEffect(() => {
    if (editDialogOpen && employee.disassociationDate) {
      setDisassociationDate(new Date(employee.disassociationDate));
      setDisassociationReason(employee.disassociationReason || '');
    }
  }, [
    editDialogOpen,
    employee.disassociationDate,
    employee.disassociationReason,
  ]);

  const handleDisassociateClick = () => {
    setDisassociateDialogOpen(true);
  };

  const handleDisassociateConfirm = async () => {
    if (!disassociationDate || !disassociationReason.trim()) {
      toast.error('Campos requeridos', {
        description: (
          <p className="text-slate-700 select-none">
            Debes especificar la fecha y razón de desvinculación
          </p>
        ),
      });
      return;
    }

    try {
      setDisassociating(true);

      const updatedEmployee = await employeeService.disassociateEmployee(
        employee.id,
        {
          disassociationDate: disassociationDate,
          disassociationReason: disassociationReason.trim(),
        }
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

  const handleAssociateClick = () => {
    setAssociateDialogOpen(true);
  };

  const handleAssociateConfirm = async () => {
    try {
      setAssociating(true);

      const updatedEmployee = await employeeService.associateEmployee(
        employee.id
      );

      toast.success('Empleado re-asociado', {
        description: (
          <p className="text-slate-700 select-none">
            {`${employee.firstName} ${employee.lastName} ha sido re-asociado correctamente`}
          </p>
        ),
      });

      if (onAssociate) {
        onAssociate(updatedEmployee);
      }
    } catch (error) {
      console.error('Error al re-asociar empleado:', error);
      toast.error('Error al re-asociar', {
        description: (
          <p className="text-slate-700 select-none">
            No se pudo re-asociar al empleado
          </p>
        ),
      });
    } finally {
      setAssociating(false);
      setAssociateDialogOpen(false);
    }
  };

  const handleEditClick = () => {
    setEditDialogOpen(true);
  };

  const handleEditConfirm = async () => {
    if (!disassociationDate || !disassociationReason.trim()) {
      toast.error('Campos requeridos', {
        description: (
          <p className="text-slate-700 select-none">
            Debes especificar la fecha y razón de desvinculación
          </p>
        ),
      });
      return;
    }

    try {
      setEditing(true);

      const updatedEmployee = await employeeService.associateEmployee(
        employee.id
      );

      toast.success('Información actualizada', {
        description: (
          <p className="text-slate-700 select-none">
            La fecha y razón de desvinculación han sido actualizadas
          </p>
        ),
      });

      if (onAssociate) {
        onAssociate(updatedEmployee);
      }
    } catch (error) {
      console.error('Error al actualizar información:', error);
      toast.error('Error al actualizar', {
        description: (
          <p className="text-slate-700 select-none">
            No se pudo actualizar la información
          </p>
        ),
      });
    } finally {
      setEditing(false);
      setEditDialogOpen(false);
    }
  };

  if (isDisassociated) {
    const deletionDate = employee.disassociatedAt
      ? calculateDeletionDate(employee.disassociatedAt)
      : 'N/A';

    return (
      <section className="flex flex-col gap-6 p-4">
        <AlertDialog
          open={associateDialogOpen}
          onOpenChange={setAssociateDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Cancelar desvinculación?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción reactivará al empleado{' '}
                <span className="font-semibold">
                  {employee.firstName} {employee.lastName}
                </span>{' '}
                y cancelará el proceso de eliminación automática. El empleado
                volverá a estar activo en el sistema.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={associating}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleAssociateConfirm}
                disabled={associating}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                {associating ? 'Re-asociando...' : 'Re-asociar Empleado'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Información de Desvinculación</DialogTitle>
              <DialogDescription>
                Modifica la fecha y razón de desvinculación del empleado.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-date">Fecha de Desvinculación</Label>
                <Popover modal>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !disassociationDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {disassociationDate ? (
                        formatDate(disassociationDate.toISOString())
                      ) : (
                        <span>Selecciona una fecha</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={disassociationDate}
                      onSelect={setDisassociationDate}
                      disabled={(date) =>
                        date > new Date() || date < new Date('1900-01-01')
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-reason">
                  Razón de Desvinculación
                  <span className="text-xs text-muted-foreground ml-2">
                    ({disassociationReason.length}/800)
                  </span>
                </Label>
                <Textarea
                  id="edit-reason"
                  placeholder="Especifica la razón de la desvinculación..."
                  value={disassociationReason}
                  onChange={(e) => setDisassociationReason(e.target.value)}
                  maxLength={800}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={editing}
              >
                Cancelar
              </Button>
              <Button onClick={handleEditConfirm} disabled={editing}>
                {editing ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
                  <CalendarIcon className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-900">
                      Fecha de Desvinculación
                    </p>
                    <p className="text-sm text-red-700">
                      {employee.disassociationDate
                        ? formatDate(employee.disassociationDate)
                        : employee.disassociatedAt
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

              {employee.disassociationReason && (
                <>
                  <Separator className="bg-red-200" />
                  <div className="bg-white rounded-lg p-4 border border-red-200">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 mb-2">
                          Razón de Desvinculación
                        </p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {employee.disassociationReason}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleEditClick}
                        className="h-8 w-8 flex-shrink-0"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}

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

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <UserCheck className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900 mb-1">
                      ¿Deseas cancelar la desvinculación?
                    </p>
                    <p className="text-xs text-green-700 mb-3">
                      Puedes re-asociar al empleado antes de que se eliminen sus
                      datos. Esto cancelará el proceso de eliminación y
                      reactivará al empleado en el sistema.
                    </p>
                    <Button
                      variant="outline"
                      onClick={handleAssociateClick}
                      className="gap-2 border-green-600 text-green-700 hover:bg-green-50 hover:text-green-800"
                      disabled={associating}
                    >
                      <UserCheck className="h-4 w-4" />
                      {associating
                        ? 'Re-asociando...'
                        : 'Cancelar Desvinculación'}
                    </Button>
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
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desvincular empleado?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción marcará al empleado{' '}
              <span className="font-semibold">
                {employee.firstName} {employee.lastName}
              </span>{' '}
              como desvinculado. Los datos del empleado se eliminarán
              automáticamente después de 30 días.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="disassociation-date">
                Fecha de Desvinculación *
              </Label>
              <Popover modal>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !disassociationDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {disassociationDate ? (
                      formatDate(disassociationDate.toISOString())
                    ) : (
                      <span>Selecciona una fecha</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={disassociationDate}
                    onSelect={setDisassociationDate}
                    disabled={(date) =>
                      date > new Date() || date < new Date('1900-01-01')
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="disassociation-reason">
                Razón de Desvinculación *
                <span className="text-xs text-muted-foreground ml-2">
                  ({disassociationReason.length}/800)
                </span>
              </Label>
              <Textarea
                id="disassociation-reason"
                placeholder="Especifica la razón de la desvinculación..."
                value={disassociationReason}
                onChange={(e) => setDisassociationReason(e.target.value)}
                maxLength={800}
                rows={4}
                required
              />
            </div>
          </div>

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
