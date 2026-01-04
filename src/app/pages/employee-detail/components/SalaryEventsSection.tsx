import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  DollarSign,
  Loader2,
  ChevronDown,
  ChevronUp,
  Edit2,
  TrendingUp,
  TrendingDown,
  Trash2,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { SalaryEventService } from '@/rest-client/services/SalaryEventService';
import type { SalaryEventResponse } from '@/rest-client/interface/response/SalaryEventResponse';
import { ReusableDialog } from '@/app/shared/components/ReusableDialog';
import { SalaryEventForm } from './forms/SalaryEventForm';
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
import { formatDate } from '@/lib/utils';
import { getMonthRange } from '@/lib/date-utils';

type SalaryEventsSectionProps = {
  employeeId: string;
  employeeName?: string;
  isDisassociated?: boolean;
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
  }).format(amount);
};

// Función para determinar en qué mes está un salary event
const getMonthsAgoFromDate = (dateString: string): number => {
  const eventDate = new Date(dateString);
  const now = new Date();

  const yearDiff = now.getFullYear() - eventDate.getFullYear();
  const monthDiff = now.getMonth() - eventDate.getMonth();

  return yearDiff * 12 + monthDiff;
};

const salaryEventService = new SalaryEventService();

export function SalaryEventsSection({
  employeeId,
  employeeName,
  isDisassociated,
}: SalaryEventsSectionProps) {
  const applyCutoff = !isDisassociated;
  const [currentSalaryEvents, setCurrentSalaryEvents] = useState<
    SalaryEventResponse[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSalaryEvent, setEditingSalaryEvent] =
    useState<SalaryEventResponse | null>(null);
  const [useReplaceMode, setUseReplaceMode] = useState(false);
  const [expandedMonths, setExpandedMonths] = useState<Set<number>>(new Set());
  const [monthlySalaryEvents, setMonthlySalaryEvents] = useState<
    Map<number, SalaryEventResponse[] | null>
  >(new Map());
  const [loadingMonths, setLoadingMonths] = useState<Set<number>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [salaryEventToDelete, setSalaryEventToDelete] =
    useState<SalaryEventResponse | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [processedWarningOpen, setProcessedWarningOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: 'edit' | 'delete';
    salaryEvent: SalaryEventResponse;
    isCurrentMonth: boolean;
  } | null>(null);

  useEffect(() => {
    fetchCurrentSalaryEvents();
  }, [employeeId]);

  const fetchCurrentSalaryEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const salaryEvents = await salaryEventService.getSalaryEventsByEmployeeId(
        employeeId,
        'MANUAL',
        undefined,
        undefined,
        !applyCutoff
      );
      setCurrentSalaryEvents(salaryEvents);
    } catch (err) {
      console.error('Error fetching salary events:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Error al cargar eventos salariales'
      );
    } finally {
      setLoading(false);
    }
  };

  const reloadMonth = async (monthsAgo: number) => {
    setLoadingMonths((prev) => new Set(prev).add(monthsAgo));

    try {
      const { startDate, endDate } = getMonthRange(monthsAgo, applyCutoff);
      const salaryEvents = await salaryEventService.getSalaryEventsByEmployeeId(
        employeeId,
        'MANUAL',
        startDate,
        endDate
      );
      setMonthlySalaryEvents((prev) =>
        new Map(prev).set(monthsAgo, salaryEvents)
      );
      toast.success('Mes actualizado', {
        description: 'Los datos se han recargado correctamente',
      });
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

  const handleSalaryEventSaved = async (
    savedSalaryEvent: SalaryEventResponse
  ) => {
    if (editingSalaryEvent) {
      setCurrentSalaryEvents((prev) =>
        prev.map((e) => (e.id === savedSalaryEvent.id ? savedSalaryEvent : e))
      );
      setEditingSalaryEvent(null);
    } else {
      setCurrentSalaryEvents([savedSalaryEvent, ...currentSalaryEvents]);
    }

    setDialogOpen(false);
    setUseReplaceMode(false);

    // Recargar mes actual
    await fetchCurrentSalaryEvents();

    // Determinar el mes del salary event y recargar si no es mes actual
    const monthsAgo = getMonthsAgoFromDate(savedSalaryEvent.startDate);
    if (monthsAgo > 0 && monthlySalaryEvents.has(monthsAgo)) {
      await reloadMonth(monthsAgo);
    }
  };

  const handleEdit = (
    salaryEvent: SalaryEventResponse,
    isCurrentMonth: boolean = true
  ) => {
    // Si está procesado, mostrar advertencia primero
    if (salaryEvent.processed) {
      setPendingAction({ type: 'edit', salaryEvent, isCurrentMonth });
      setProcessedWarningOpen(true);
      return;
    }

    setEditingSalaryEvent(salaryEvent);
    setUseReplaceMode(!isCurrentMonth);
    setDialogOpen(true);
  };

  const handleDeleteClick = (salaryEvent: SalaryEventResponse) => {
    // Si está procesado, mostrar advertencia primero
    if (salaryEvent.processed) {
      setPendingAction({ type: 'delete', salaryEvent, isCurrentMonth: true });
      setProcessedWarningOpen(true);
      return;
    }

    setSalaryEventToDelete(salaryEvent);
    setDeleteDialogOpen(true);
  };

  const handleProcessedWarningConfirm = () => {
    if (!pendingAction) return;

    if (pendingAction.type === 'edit') {
      setEditingSalaryEvent(pendingAction.salaryEvent);
      setUseReplaceMode(!pendingAction.isCurrentMonth);
      setDialogOpen(true);
    } else if (pendingAction.type === 'delete') {
      setSalaryEventToDelete(pendingAction.salaryEvent);
      setDeleteDialogOpen(true);
    }

    setProcessedWarningOpen(false);
    setPendingAction(null);
  };

  const handleDeleteConfirm = async () => {
    if (!salaryEventToDelete) return;

    try {
      setDeleting(true);
      await salaryEventService.deleteSalaryEvent(salaryEventToDelete.id);

      setCurrentSalaryEvents((prev) =>
        prev.filter((e) => e.id !== salaryEventToDelete.id)
      );

      toast.success('Evento salarial eliminado', {
        description: (
          <p className="text-slate-700 select-none">
            El evento salarial fue eliminado correctamente
          </p>
        ),
      });

      // Recargar mes actual
      await fetchCurrentSalaryEvents();

      // Determinar el mes del salary event eliminado y recargar si no es mes actual
      const monthsAgo = getMonthsAgoFromDate(salaryEventToDelete.startDate);
      if (monthsAgo > 0 && monthlySalaryEvents.has(monthsAgo)) {
        await reloadMonth(monthsAgo);
      }
    } catch (error) {
      console.error('Error al eliminar evento salarial:', error);
      toast.error('Error al eliminar', {
        description: (
          <p className="text-slate-700 select-none">
            No se pudo eliminar el evento salarial
          </p>
        ),
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setSalaryEventToDelete(null);
    }
  };

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingSalaryEvent(null);
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

      if (!monthlySalaryEvents.has(monthsAgo)) {
        setLoadingMonths((prev) => new Set(prev).add(monthsAgo));

        try {
          const { startDate, endDate } = getMonthRange(monthsAgo, applyCutoff);
          const salaryEvents =
            await salaryEventService.getSalaryEventsByEmployeeId(
              employeeId,
              'MANUAL',
              startDate,
              endDate
            );
          setMonthlySalaryEvents((prev) =>
            new Map(prev).set(monthsAgo, salaryEvents)
          );
        } catch (err) {
          console.error(
            `Error fetching salary events for month ${monthsAgo}:`,
            err
          );
          setMonthlySalaryEvents((prev) => new Map(prev).set(monthsAgo, []));
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

  const bonusEvents = currentSalaryEvents.filter((e) => e.type === 'BONUS');
  const deductionEvents = currentSalaryEvents.filter(
    (e) => e.type === 'DEDUCTION'
  );

  const totalBonuses = bonusEvents.reduce((sum, e) => sum + e.amount, 0);
  const totalDeductions = deductionEvents.reduce((sum, e) => sum + e.amount, 0);

  const renderSalaryEventCard = (
    salaryEvent: SalaryEventResponse,
    isCurrentMonth: boolean = true
  ) => {
    const isBonus = salaryEvent.type === 'BONUS';
    const bgColor = salaryEvent.processed
      ? 'bg-slate-50'
      : isBonus
      ? 'bg-green-50'
      : 'bg-red-50';
    const borderColor = salaryEvent.processed
      ? 'border-green-200'
      : isBonus
      ? 'border-green-200'
      : 'border-red-200';
    const iconColor = isBonus ? 'text-green-600' : 'text-red-600';

    return (
      <div
        key={salaryEvent.id}
        className={`flex items-start justify-between p-4 border rounded-lg ${bgColor} ${borderColor}`}
      >
        <div className="flex items-start gap-3 flex-1">
          {isBonus ? (
            <div className="bg-green-600 p-2 rounded-full flex-shrink-0">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
          ) : (
            <div className="bg-red-600 p-2 rounded-full flex-shrink-0">
              <TrendingDown className="h-4 w-4 text-white" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge
                variant={isBonus ? 'default' : 'destructive'}
                className={isBonus ? 'bg-green-600' : 'bg-red-600'}
              >
                {isBonus ? 'Bono' : 'Descuento'}
              </Badge>
              <Badge variant="outline">
                {formatDate(salaryEvent.startDate)}
              </Badge>
              {salaryEvent.endDate && (
                <Badge variant="outline" className="text-xs">
                  Hasta {formatDate(salaryEvent.endDate)}
                </Badge>
              )}
              {salaryEvent.processed && (
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200"
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Procesado
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <p className={`text-lg font-bold ${iconColor}`}>
                {formatCurrency(salaryEvent.amount)}
              </p>
              {salaryEvent.processed && (
                <p className="text-xs text-green-600">Aplicado en planilla</p>
              )}
            </div>
            {salaryEvent.description && (
              <p className="text-sm text-gray-700 mt-1">
                {salaryEvent.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2 flex-shrink-0 ml-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleEdit(salaryEvent, isCurrentMonth)}
            title={isCurrentMonth ? 'Editar' : 'Editar (reemplazar)'}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDeleteClick(salaryEvent)}
            title="Eliminar"
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <section className="flex flex-col gap-6 p-4">
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Cargando eventos salariales...</span>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6 p-4">
      <ReusableDialog
        title={
          editingSalaryEvent
            ? useReplaceMode
              ? 'Editar Evento Salarial (Reemplazar)'
              : 'Editar Evento Salarial'
            : 'Registrar Evento Salarial'
        }
        description={
          editingSalaryEvent
            ? useReplaceMode
              ? 'Se eliminará y recreará el registro con los nuevos datos'
              : 'Modifica los datos del evento salarial'
            : 'Registra un nuevo evento salarial para el empleado'
        }
        open={dialogOpen}
        onOpenChange={handleDialogChange}
      >
        <SalaryEventForm
          employeeId={employeeId}
          salaryEvent={editingSalaryEvent || undefined}
          useReplaceMode={useReplaceMode}
          onSave={handleSalaryEventSaved}
          onCancel={() => handleDialogChange(false)}
          isDisassociated={isDisassociated}
        />
      </ReusableDialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El evento salarial será
              eliminado permanentemente.
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
              Evento salarial ya procesado
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Este evento salarial ya fue procesado en una planilla anterior.
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
          <span className="text-xl font-bold">Eventos Salariales</span>
          {employeeName && (
            <p className="text-sm text-muted-foreground">{employeeName}</p>
          )}
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Registrar Evento
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl shadow-md">
          <CardContent className="p-6 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-muted-foreground">
                Total del mes
              </span>
            </div>
            <span className="text-2xl font-semibold">
              {currentSalaryEvents.length}
            </span>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-md bg-green-50">
          <CardContent className="p-6 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm text-muted-foreground">Bonos</span>
            </div>
            <span className="text-2xl font-bold text-green-700">
              {formatCurrency(totalBonuses)}
            </span>
            <span className="text-xs text-green-600">
              {bonusEvents.length}{' '}
              {bonusEvents.length === 1 ? 'evento' : 'eventos'}
            </span>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-md bg-red-50">
          <CardContent className="p-6 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <span className="text-sm text-muted-foreground">Descuentos</span>
            </div>
            <span className="text-2xl font-bold text-red-700">
              {formatCurrency(totalDeductions)}
            </span>
            <span className="text-xs text-red-600">
              {deductionEvents.length}{' '}
              {deductionEvents.length === 1 ? 'evento' : 'eventos'}
            </span>
          </CardContent>
        </Card>
      </div>

      {currentSalaryEvents.length > 0 ? (
        <section className="flex flex-col gap-2 rounded-xl border p-4">
          <span className="text-lg font-semibold">Eventos del mes actual</span>
          <Separator />

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {currentSalaryEvents.map((salaryEvent) =>
              renderSalaryEventCard(salaryEvent, true)
            )}
          </div>
        </section>
      ) : (
        <div className="text-center p-8 border rounded-xl">
          <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">
            No hay eventos salariales registrados este mes
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
          const salaryEvents = monthlySalaryEvents.get(monthsAgo);

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
                  ) : salaryEvents && salaryEvents.length > 0 ? (
                    <div className="space-y-3">
                      {salaryEvents.map((salaryEvent) =>
                        renderSalaryEventCard(salaryEvent, false)
                      )}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground p-4">
                      No hay eventos salariales en este mes
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
