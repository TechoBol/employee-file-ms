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
  Trash2,
} from 'lucide-react';
import { AdvanceService } from '@/rest-client/services/AdvanceService';
import type { AdvanceResponse } from '@/rest-client/interface/response/AdvanceResponse';
import { ReusableDialog } from '@/app/shared/components/ReusableDialog';
import { AdvanceForm } from './forms/AdvanceForm';
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

type AdvanceSectionProps = {
  employeeId: string;
  employeeName?: string;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
    minimumFractionDigits: 2,
  }).format(value);

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

const advanceService = new AdvanceService();

export function AdvanceSection({
  employeeId,
  employeeName,
}: AdvanceSectionProps) {
  const [currentAdvances, setCurrentAdvances] = useState<AdvanceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAdvance, setEditingAdvance] = useState<AdvanceResponse | null>(
    null
  );
  const [expandedMonths, setExpandedMonths] = useState<Set<number>>(new Set());
  const [monthlyAdvances, setMonthlyAdvances] = useState<
    Map<number, AdvanceResponse[] | null>
  >(new Map());
  const [loadingMonths, setLoadingMonths] = useState<Set<number>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [advanceToDelete, setAdvanceToDelete] =
    useState<AdvanceResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchCurrentAdvances();
  }, [employeeId]);

  const fetchCurrentAdvances = async () => {
    try {
      setLoading(true);
      setError(null);
      const advances = await advanceService.getAdvancesByEmployee(employeeId);
      setCurrentAdvances(advances);
    } catch (err) {
      console.error('Error fetching advances:', err);
      setError(
        err instanceof Error ? err.message : 'Error al cargar adelantos'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAdvanceSaved = (savedAdvance: AdvanceResponse) => {
    if (editingAdvance) {
      // Actualizar existente
      setCurrentAdvances((prev) =>
        prev.map((a) => (a.id === savedAdvance.id ? savedAdvance : a))
      );
      setEditingAdvance(null);
    } else {
      // Crear nuevo
      setCurrentAdvances([savedAdvance, ...currentAdvances]);
    }
    setDialogOpen(false);
    fetchCurrentAdvances();
  };

  const handleEdit = (advance: AdvanceResponse) => {
    setEditingAdvance(advance);
    setDialogOpen(true);
  };

  const handleDeleteClick = (advance: AdvanceResponse) => {
    setAdvanceToDelete(advance);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!advanceToDelete) return;

    try {
      setDeleting(true);
      await advanceService.deleteAdvance(advanceToDelete.id);

      setCurrentAdvances((prev) =>
        prev.filter((a) => a.id !== advanceToDelete.id)
      );

      toast.success('Adelanto eliminado', {
        description: (
          <p className="text-slate-700 select-none">
            El adelanto fue eliminado correctamente
          </p>
        ),
      });
    } catch (error) {
      console.error('Error al eliminar adelanto:', error);
      toast.error('Error al eliminar', {
        description: (
          <p className="text-slate-700 select-none">
            No se pudo eliminar el adelanto
          </p>
        ),
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setAdvanceToDelete(null);
    }
  };

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingAdvance(null);
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

      if (!monthlyAdvances.has(monthsAgo)) {
        setLoadingMonths((prev) => new Set(prev).add(monthsAgo));

        try {
          const { startDate, endDate } = getMonthRange(monthsAgo);
          const advances = await advanceService.getAdvancesByEmployee(
            employeeId,
            startDate,
            endDate
          );
          setMonthlyAdvances((prev) => new Map(prev).set(monthsAgo, advances));
        } catch (err) {
          console.error(`Error fetching advances for month ${monthsAgo}:`, err);
          setMonthlyAdvances((prev) => new Map(prev).set(monthsAgo, []));
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

  const totalAmount = currentAdvances.reduce(
    (sum, advance) => sum + advance.amount,
    0
  );

  const renderAdvanceCard = (
    advance: AdvanceResponse,
    isCurrentMonth: boolean = true
  ) => (
    <div
      key={advance.id}
      className="flex items-center justify-between p-3 border rounded-lg"
    >
      <div className="flex items-center gap-3 flex-1">
        <DollarSign className="h-5 w-5 text-green-600 flex-shrink-0" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary">{advance.amount} Bs</Badge>
          </div>
          <p className="text-sm font-medium">
            {formatDate(advance.advanceDate)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
        <div className="text-right">
          <p className="text-sm font-semibold text-green-600">
            {formatCurrency(advance.amount)}
          </p>
        </div>

        {isCurrentMonth && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleEdit(advance)}
              title="Editar"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDeleteClick(advance)}
              title="Eliminar"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <section className="flex flex-col gap-6 p-4">
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Cargando adelantos...</span>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6 p-4">
      <ReusableDialog
        title={editingAdvance ? 'Editar Adelanto' : 'Registrar Adelanto'}
        description={
          editingAdvance
            ? 'Modifica los datos del adelanto'
            : 'Registra un nuevo adelanto para el empleado'
        }
        open={dialogOpen}
        onOpenChange={handleDialogChange}
      >
        <AdvanceForm
          employeeId={employeeId}
          advance={editingAdvance || undefined}
          onSave={handleAdvanceSaved}
          onCancel={() => handleDialogChange(false)}
        />
      </ReusableDialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El adelanto será eliminado
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex justify-between">
        <div>
          <span className="text-xl font-bold">Adelantos de Salario</span>
          {employeeName && (
            <p className="text-sm text-muted-foreground">{employeeName}</p>
          )}
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Registrar Adelanto
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="rounded-2xl shadow-md">
          <CardContent className="p-6 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-sm text-muted-foreground">
                Adelantos del mes
              </span>
            </div>
            <span className="text-2xl font-semibold">
              {currentAdvances.length}
            </span>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-md bg-green-50">
          <CardContent className="p-6 flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">
              Total Adelantos
            </span>
            <span className="text-2xl font-bold text-green-700">
              {formatCurrency(totalAmount)}
            </span>
          </CardContent>
        </Card>
      </div>

      {currentAdvances.length > 0 ? (
        <section className="flex flex-col gap-2 rounded-xl border p-4">
          <span className="text-lg font-semibold">
            Adelantos del mes actual
          </span>
          <Separator />

          <div className="space-y-3">
            {currentAdvances.map((advance) => renderAdvanceCard(advance, true))}
          </div>
        </section>
      ) : (
        <div className="text-center p-8 border rounded-xl">
          <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">
            No hay adelantos registrados este mes
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
          const { label } = getMonthRange(monthsAgo);
          const isExpanded = expandedMonths.has(monthsAgo);
          const isLoading = loadingMonths.has(monthsAgo);
          const advances = monthlyAdvances.get(monthsAgo);

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
                  ) : advances && advances.length > 0 ? (
                    <div className="space-y-3">
                      {advances.map((advance) =>
                        renderAdvanceCard(advance, false)
                      )}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground p-4">
                      No hay adelantos en este mes
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
