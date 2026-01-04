import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Clock,
  CalendarX,
  Loader2,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { AbsenceService } from '@/rest-client/services/AbsenceService';
import type { AbsenceResponse } from '@/rest-client/interface/response/AbsenceResponse';
import { ReusableDialog } from '@/app/shared/components/ReusableDialog';
import { AbsencePermissionForm } from './forms/AbsencePermissionForm';
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
import { formatDate } from '@/lib/utils';
import { getMonthRange } from '@/lib/date-utils';

export const AbsencePermissionType = {
  PERMISSION: 'PERMISSION',
  ABSENCE: 'ABSENCE',
} as const;
export type AbsencePermissionType =
  (typeof AbsencePermissionType)[keyof typeof AbsencePermissionType];

export const PermissionDuration = {
  HALF_DAY: 'HALF_DAY',
  FULL_DAY: 'FULL_DAY',
} as const;
export type PermissionDuration =
  (typeof PermissionDuration)[keyof typeof PermissionDuration];

type AbsencePermissionSectionProps = {
  employeeId: string;
  employeeName?: string;
  isDisassociated?: boolean;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
    minimumFractionDigits: 2,
  }).format(value);

const isPermission = (description: string): boolean => {
  return description.toLowerCase().includes('permiso');
};

const isAbsence = (description: string): boolean => {
  return description.toLowerCase().includes('falta');
};

const getDurationFromDescription = (
  description: string
): PermissionDuration => {
  return description.toLowerCase().includes('medio')
    ? PermissionDuration.HALF_DAY
    : PermissionDuration.FULL_DAY;
};

const getMonthsAgoFromDate = (dateString: string): number => {
  const absenceDate = new Date(dateString);
  const now = new Date();

  const yearDiff = now.getFullYear() - absenceDate.getFullYear();
  const monthDiff = now.getMonth() - absenceDate.getMonth();

  return yearDiff * 12 + monthDiff;
};

const absenceService = new AbsenceService();

export function AbsencePermissionSection({
  employeeId,
  employeeName,
  isDisassociated,
}: AbsencePermissionSectionProps) {
  const applyCutoff = !isDisassociated;
  const [absenceEvents, setAbsenceEvents] = useState<AbsenceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAbsence, setEditingAbsence] = useState<AbsenceResponse | null>(
    null
  );
  const [useReplaceMode, setUseReplaceMode] = useState(false);
  const [expandedMonths, setExpandedMonths] = useState<Set<number>>(new Set());
  const [monthlyAbsences, setMonthlyAbsences] = useState<
    Map<number, AbsenceResponse[] | null>
  >(new Map());
  const [loadingMonths, setLoadingMonths] = useState<Set<number>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [absenceToDelete, setAbsenceToDelete] =
    useState<AbsenceResponse | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [processedWarningOpen, setProcessedWarningOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: 'edit' | 'delete';
    absence: AbsenceResponse;
    isCurrentMonth: boolean;
  } | null>(null);

  useEffect(() => {
    fetchCurrentAbsences();
  }, [employeeId]);

  const fetchCurrentAbsences = async () => {
    try {
      setLoading(true);
      setError(null);
      const deductions = await absenceService.getAbsencesByEmployee(employeeId, undefined, undefined, !applyCutoff);
      const absenceDeductions = deductions.filter(
        (event) =>
          event.description &&
          (event.description.toLowerCase().includes('permiso') ||
            event.description.toLowerCase().includes('falta'))
      );
      setAbsenceEvents(absenceDeductions);
    } catch (err) {
      console.error('Error fetching absence events:', err);
      setError(
        err instanceof Error ? err.message : 'Error al cargar permisos y faltas'
      );
    } finally {
      setLoading(false);
    }
  };

  const reloadMonth = async (monthsAgo: number) => {
    setLoadingMonths((prev) => new Set(prev).add(monthsAgo));

    try {
      const { startDate, endDate } = getMonthRange(monthsAgo, applyCutoff);
      const absences = await absenceService.getAbsencesByEmployee(
        employeeId,
        startDate,
        endDate
      );
      const filteredAbsences = absences.filter(
        (event) =>
          event.description &&
          (event.description.toLowerCase().includes('permiso') ||
            event.description.toLowerCase().includes('falta'))
      );
      setMonthlyAbsences((prev) =>
        new Map(prev).set(monthsAgo, filteredAbsences)
      );
    } catch (err) {
      console.error(`Error reloading month ${monthsAgo}:`, err);
      toast.error('Error al recargar', {
        description: 'No se pudo actualizar los datos del mes',
      });
    } finally {
      setLoadingMonths((prev) => {
        const newSet = new Set(prev);
        newSet.delete(monthsAgo);
        return newSet;
      });
    }
  };

  const handleAbsenceSaved = async (savedAbsence: AbsenceResponse) => {
    if (editingAbsence) {
      setAbsenceEvents((prev) =>
        prev.map((a) => (a.id === savedAbsence.id ? savedAbsence : a))
      );
      setEditingAbsence(null);
    } else {
      setAbsenceEvents([savedAbsence, ...absenceEvents]);
    }

    setDialogOpen(false);
    setUseReplaceMode(false);

    await fetchCurrentAbsences();

    const monthsAgo = getMonthsAgoFromDate(savedAbsence.date);
    if (monthsAgo > 0 && monthlyAbsences.has(monthsAgo)) {
      await reloadMonth(monthsAgo);
    }
  };

  const handleEdit = (
    absence: AbsenceResponse,
    isCurrentMonth: boolean = true
  ) => {
    if (absence.processed) {
      setPendingAction({ type: 'edit', absence, isCurrentMonth });
      setProcessedWarningOpen(true);
      return;
    }

    setEditingAbsence(absence);
    setUseReplaceMode(!isCurrentMonth);
    setDialogOpen(true);
  };

  const handleDeleteClick = (absence: AbsenceResponse) => {
    if (absence.processed) {
      setPendingAction({ type: 'delete', absence, isCurrentMonth: true });
      setProcessedWarningOpen(true);
      return;
    }

    setAbsenceToDelete(absence);
    setDeleteDialogOpen(true);
  };

  const handleProcessedWarningConfirm = () => {
    if (!pendingAction) return;

    if (pendingAction.type === 'edit') {
      setEditingAbsence(pendingAction.absence);
      setUseReplaceMode(!pendingAction.isCurrentMonth);
      setDialogOpen(true);
    } else if (pendingAction.type === 'delete') {
      setAbsenceToDelete(pendingAction.absence);
      setDeleteDialogOpen(true);
    }

    setProcessedWarningOpen(false);
    setPendingAction(null);
  };

  const handleDeleteConfirm = async () => {
    if (!absenceToDelete) return;

    try {
      setDeleting(true);
      await absenceService.deleteAbsence(absenceToDelete.id);

      setAbsenceEvents((prev) =>
        prev.filter((a) => a.id !== absenceToDelete.id)
      );

      toast.success('Permiso/Falta eliminado', {
        description: (
          <p className="text-slate-700 select-none">
            El registro fue eliminado correctamente
          </p>
        ),
      });

      await fetchCurrentAbsences();

      const monthsAgo = getMonthsAgoFromDate(absenceToDelete.date);
      if (monthsAgo > 0 && monthlyAbsences.has(monthsAgo)) {
        await reloadMonth(monthsAgo);
      }
    } catch (error) {
      console.error('Error al eliminar:', error);
      toast.error('Error al eliminar', {
        description: (
          <p className="text-slate-700 select-none">
            No se pudo eliminar el registro
          </p>
        ),
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setAbsenceToDelete(null);
    }
  };

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingAbsence(null);
      setUseReplaceMode(false);
    }
  };

  const toggleMonth = async (monthsAgo: number) => {
    if (expandedMonths.has(monthsAgo)) {
      setExpandedMonths((prev) => {
        const newSet = new Set(prev);
        newSet.delete(monthsAgo);
        return newSet;
      });
    } else {
      setExpandedMonths((prev) => new Set(prev).add(monthsAgo));

      if (!monthlyAbsences.has(monthsAgo)) {
        setLoadingMonths((prev) => new Set(prev).add(monthsAgo));

        try {
          const { startDate, endDate } = getMonthRange(monthsAgo, applyCutoff);
          const absences = await absenceService.getAbsencesByEmployee(
            employeeId,
            startDate,
            endDate
          );
          const filteredAbsences = absences.filter(
            (event) =>
              event.description &&
              (event.description.toLowerCase().includes('permiso') ||
                event.description.toLowerCase().includes('falta'))
          );
          setMonthlyAbsences((prev) =>
            new Map(prev).set(monthsAgo, filteredAbsences)
          );
        } catch (err) {
          console.error(`Error fetching absences for month ${monthsAgo}:`, err);
          setMonthlyAbsences((prev) => new Map(prev).set(monthsAgo, []));
        } finally {
          setLoadingMonths((prev) => {
            const newSet = new Set(prev);
            newSet.delete(monthsAgo);
            return newSet;
          });
        }
      }
    }
  };

  const permissions = absenceEvents.filter(
    (event) => event.description && isPermission(event.description)
  );

  const absences = absenceEvents.filter(
    (event) => event.description && isAbsence(event.description)
  );

  const totalDeductions = absenceEvents.reduce(
    (sum, event) => sum + event.deductionAmount,
    0
  );

  const renderAbsenceCard = (
    event: AbsenceResponse,
    isCurrentMonth: boolean = true
  ) => {
    const eventIsPermission =
      event.description && isPermission(event.description);
    const eventIsAbsence = event.description && isAbsence(event.description);
    const duration = eventIsPermission
      ? getDurationFromDescription(event.description || '')
      : null;

    return (
      <div
        key={event.id}
        className={`flex items-center justify-between p-3 border rounded-lg ${
          event.processed ? 'bg-slate-50 border-green-200' : ''
        }`}
      >
        <div className="flex items-center gap-3 flex-1">
          {eventIsAbsence ? (
            <CalendarX className="h-5 w-5 text-red-600 flex-shrink-0" />
          ) : (
            <Clock className="h-5 w-5 text-orange-600 flex-shrink-0" />
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {eventIsAbsence ? (
                <Badge variant="destructive">Falta</Badge>
              ) : (
                <Badge className="bg-orange-500 hover:bg-orange-600 text-white">
                  Permiso
                </Badge>
              )}
              {duration && (
                <Badge variant="outline">
                  {duration === PermissionDuration.HALF_DAY
                    ? 'Medio día'
                    : '1 día'}
                </Badge>
              )}
              {event.processed && (
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200"
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Procesado
                </Badge>
              )}
            </div>
            <p className="text-sm font-medium">{formatDate(event.date)}</p>
            {event.description && (
              <p className="text-xs text-muted-foreground truncate">
                {event.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <div className="text-right">
            <p className="text-sm font-semibold text-red-600">
              -{formatCurrency(event.deductionAmount)}
            </p>
            {event.processed && (
              <p className="text-xs text-green-600">Aplicado en planilla</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleEdit(event, isCurrentMonth)}
              title={isCurrentMonth ? 'Editar' : 'Editar (reemplazar)'}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDeleteClick(event)}
              title="Eliminar"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <section className="flex flex-col gap-6 p-4">
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Cargando permisos y faltas...</span>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6 p-4">
      <ReusableDialog
        title={
          editingAbsence
            ? useReplaceMode
              ? 'Editar Permiso/Falta (Reemplazar)'
              : 'Editar Permiso/Falta'
            : 'Registrar Permiso o Falta'
        }
        description={
          editingAbsence
            ? useReplaceMode
              ? 'Se eliminará y recreará el registro con los nuevos datos'
              : 'Modifica los datos del permiso o falta'
            : 'Registra un nuevo permiso o falta para el empleado'
        }
        open={dialogOpen}
        onOpenChange={handleDialogChange}
      >
        <AbsencePermissionForm
          employeeId={employeeId}
          absence={editingAbsence || undefined}
          useReplaceMode={useReplaceMode}
          isDisassociated={isDisassociated}
          onSave={handleAbsenceSaved}
          onCancel={() => handleDialogChange(false)}
        />
      </ReusableDialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El registro será eliminado
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive/85 text-destructive-foreground hover:bg-destructive text-slate-100"
            >
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={processedWarningOpen}
        onOpenChange={setProcessedWarningOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Registro ya procesado
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Este permiso/falta ya fue procesado en una planilla anterior.
              </p>
              <p className="font-medium text-amber-600">
                ⚠️ Si realizas cambios, deberás recalcular la planilla de ese
                mes para ver los cambios reflejados.
              </p>
              <p className="text-sm">
                ¿Deseas continuar con{' '}
                {pendingAction?.type === 'edit'
                  ? 'la edición'
                  : 'la eliminación'}
                ?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setProcessedWarningOpen(false);
                setPendingAction(null);
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleProcessedWarningConfirm}
              className="bg-amber-500 hover:bg-amber-600"
            >
              Continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex justify-between">
        <div>
          <span className="text-xl font-bold">Permisos y Faltas</span>
          {employeeName && (
            <p className="text-sm text-muted-foreground">{employeeName}</p>
          )}
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Registrar Permiso/Falta
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl shadow-md">
          <CardContent className="p-6 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <span className="text-sm text-muted-foreground">Permisos</span>
            </div>
            <span className="text-2xl font-semibold">{permissions.length}</span>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-md">
          <CardContent className="p-6 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <CalendarX className="h-4 w-4 text-red-600" />
              <span className="text-sm text-muted-foreground">Faltas</span>
            </div>
            <span className="text-2xl font-semibold">{absences.length}</span>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-md bg-red-50">
          <CardContent className="p-6 flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">
              Total Descuentos
            </span>
            <span className="text-2xl font-bold text-red-700">
              {formatCurrency(totalDeductions)}
            </span>
          </CardContent>
        </Card>
      </div>

      {absenceEvents.length > 0 ? (
        <section className="flex flex-col gap-2 rounded-xl border p-4">
          <span className="text-lg font-semibold">
            Permisos y Faltas del mes actual
          </span>
          <Separator />

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {absenceEvents.map((event) => renderAbsenceCard(event, true))}
          </div>
        </section>
      ) : (
        <div className="text-center p-8 border rounded-xl">
          <CalendarX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">
            No hay permisos o faltas registradas este mes
          </p>
          <Button onClick={() => setDialogOpen(true)} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Registrar el primero
          </Button>
        </div>
      )}

      <Separator className="my-4" />

      <div className="flex flex-col gap-4">
        <span className="text-lg font-semibold">Meses anteriores</span>

        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((monthsAgo) => {
          const { label } = getMonthRange(monthsAgo, applyCutoff);
          const isExpanded = expandedMonths.has(monthsAgo);
          const isLoading = loadingMonths.has(monthsAgo);
          const absences = monthlyAbsences.get(monthsAgo);

          return (
            <div key={monthsAgo} className="border rounded-xl">
              <div className="flex items-center justify-between p-4">
                <Button
                  variant="ghost"
                  className="flex-1 justify-between h-auto p-0"
                  onClick={() => toggleMonth(monthsAgo)}
                >
                  <span className="font-medium">{label}</span>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
                {isExpanded && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => reloadMonth(monthsAgo)}
                    disabled={isLoading}
                    className="ml-2"
                    title="Recargar mes"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
                    />
                  </Button>
                )}
              </div>

              {isExpanded && (
                <div className="p-4 pt-0">
                  {isLoading ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2">Cargando...</span>
                    </div>
                  ) : absences && absences.length > 0 ? (
                    <div className="space-y-3">
                      {absences.map((absence) =>
                        renderAbsenceCard(absence, false)
                      )}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground p-4">
                      No hay permisos o faltas en este mes
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="text-center p-4 border border-red-200 bg-red-50 rounded-xl">
          <p className="text-red-600">Error: {error}</p>
        </div>
      )}
    </section>
  );
}
