import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Palmtree,
  Loader2,
  ChevronDown,
  ChevronUp,
  Edit2,
  Calendar,
} from 'lucide-react';
import { VacationService } from '@/rest-client/services/VacationService';
import type { VacationResponse } from '@/rest-client/interface/response/VacationResponse';
import { ReusableDialog } from '@/app/shared/components/ReusableDialog';
import { VacationForm } from './VacationForm';

type VacationSectionProps = {
  employeeId: string;
  employeeName?: string;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-BO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatMonthYear = (date: Date) => {
  return date.toLocaleDateString('es-BO', {
    year: 'numeric',
    month: 'long',
  });
};

const getMonthRange = (monthsAgo: number) => {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const endDate = new Date(
    now.getFullYear(),
    now.getMonth() - monthsAgo + 1,
    0,
    23,
    59,
    59
  );
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    label: formatMonthYear(startDate),
  };
};

const calculateDays = (start: string, end: string): number => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1;
};

const vacationService = new VacationService();

export function VacationSection({
  employeeId,
  employeeName,
}: VacationSectionProps) {
  const [currentVacations, setCurrentVacations] = useState<VacationResponse[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVacation, setEditingVacation] = useState<VacationResponse | null>(
    null
  );
  const [expandedMonths, setExpandedMonths] = useState<Set<number>>(new Set());
  const [monthlyVacations, setMonthlyVacations] = useState<
    Map<number, VacationResponse[] | null>
  >(new Map());
  const [loadingMonths, setLoadingMonths] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchCurrentVacations();
  }, [employeeId]);

  const fetchCurrentVacations = async () => {
    try {
      setLoading(true);
      setError(null);
      const vacations = await vacationService.getVacationsByEmployee(employeeId);
      setCurrentVacations(vacations);
    } catch (err) {
      console.error('Error fetching vacations:', err);
      setError(
        err instanceof Error ? err.message : 'Error al cargar vacaciones'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVacationSaved = (savedVacation: VacationResponse) => {
    if (editingVacation) {
      // Actualizar vacación existente
      setCurrentVacations((prev) =>
        prev.map((v) => (v.id === savedVacation.id ? savedVacation : v))
      );
      setEditingVacation(null);
    } else {
      // Agregar nueva vacación
      setCurrentVacations([savedVacation, ...currentVacations]);
    }
    setDialogOpen(false);
    
    // Refrescar la lista completa
    fetchCurrentVacations();
  };

  const handleEdit = (vacation: VacationResponse) => {
    setEditingVacation(vacation);
    setDialogOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingVacation(null);
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

      if (!monthlyVacations.has(monthsAgo)) {
        setLoadingMonths((prev) => new Set(prev).add(monthsAgo));

        try {
          const { startDate, endDate } = getMonthRange(monthsAgo);
          const vacations = await vacationService.getVacationsByEmployee(
            employeeId,
            startDate,
            endDate
          );
          setMonthlyVacations((prev) => new Map(prev).set(monthsAgo, vacations));
        } catch (err) {
          console.error(`Error fetching vacations for month ${monthsAgo}:`, err);
          setMonthlyVacations((prev) => new Map(prev).set(monthsAgo, []));
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

  const totalDays = currentVacations.reduce(
    (sum, vacation) => sum + calculateDays(vacation.startDate, vacation.endDate),
    0
  );

  const renderVacationCard = (vacation: VacationResponse, showEdit: boolean = true) => (
    <div
      key={vacation.id}
      className="flex items-center justify-between p-3 border rounded-lg"
    >
      <div className="flex items-center gap-3 flex-1">
        <Palmtree className="h-5 w-5 text-blue-600 flex-shrink-0" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary">
              {calculateDays(vacation.startDate, vacation.endDate)} días
            </Badge>
          </div>
          <p className="text-sm font-medium">
            {formatDate(vacation.startDate)} - {formatDate(vacation.endDate)}
          </p>
          {vacation.notes && (
            <p className="text-xs text-muted-foreground truncate">
              {vacation.notes}
            </p>
          )}
        </div>
      </div>

      {showEdit && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleEdit(vacation)}
          className="flex-shrink-0 ml-2"
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );

  if (loading) {
    return (
      <section className="flex flex-col gap-6 p-4">
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Cargando vacaciones...</span>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6 p-4">
      <ReusableDialog
        title={editingVacation ? 'Editar Vacación' : 'Registrar Vacación'}
        description={
          editingVacation
            ? 'Modifica los datos de la vacación'
            : 'Registra un nuevo período de vacaciones para el empleado'
        }
        open={dialogOpen}
        onOpenChange={handleDialogChange}
      >
        <VacationForm
          employeeId={employeeId}
          vacation={editingVacation || undefined}
          onSave={handleVacationSaved}
          onCancel={() => handleDialogChange(false)}
        />
      </ReusableDialog>

      <div className="flex justify-between">
        <div>
          <span className="text-xl font-bold">Vacaciones</span>
          {employeeName && (
            <p className="text-sm text-muted-foreground">{employeeName}</p>
          )}
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Registrar Vacación
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="rounded-2xl shadow-md">
          <CardContent className="p-6 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-muted-foreground">
                Períodos del mes
              </span>
            </div>
            <span className="text-2xl font-semibold">
              {currentVacations.length}
            </span>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-md bg-blue-50">
          <CardContent className="p-6 flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">
              Total días del mes
            </span>
            <span className="text-2xl font-bold text-blue-700">
              {totalDays} días
            </span>
          </CardContent>
        </Card>
      </div>

      {currentVacations.length > 0 ? (
        <section className="flex flex-col gap-2 rounded-xl border p-4">
          <span className="text-lg font-semibold">Vacaciones del mes actual</span>
          <Separator />

          <div className="space-y-3">
            {currentVacations.map((vacation) => renderVacationCard(vacation, true))}
          </div>
        </section>
      ) : (
        <div className="text-center p-8 border rounded-xl">
          <Palmtree className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">
            No hay vacaciones registradas este mes
          </p>
          <Button onClick={() => setDialogOpen(true)} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Registrar la primera
          </Button>
        </div>
      )}

      <Separator className="my-4" />

      <div className="flex flex-col gap-4">
        <span className="text-lg font-semibold">Meses anteriores</span>

        {[1, 2, 3, 4, 5, 6].map((monthsAgo) => {
          const { label } = getMonthRange(monthsAgo);
          const isExpanded = expandedMonths.has(monthsAgo);
          const isLoading = loadingMonths.has(monthsAgo);
          const vacations = monthlyVacations.get(monthsAgo);

          return (
            <div key={monthsAgo} className="border rounded-xl">
              <Button
                variant="ghost"
                className="w-full justify-between p-4 h-auto"
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
                <div className="p-4 pt-0">
                  {isLoading ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2">Cargando...</span>
                    </div>
                  ) : vacations && vacations.length > 0 ? (
                    <div className="space-y-3">
                      {vacations.map((vacation) => renderVacationCard(vacation, false))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground p-4">
                      No hay vacaciones en este mes
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