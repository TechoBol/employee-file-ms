import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  FileText,
  Loader2,
  ChevronDown,
  ChevronUp,
  Edit2,
  ThumbsUp,
  ThumbsDown,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { MemorandumService } from '@/rest-client/services/MemorandumService';
import type { MemorandumResponse } from '@/rest-client/interface/response/MemorandumResponse';
import { ReusableDialog } from '@/app/shared/components/ReusableDialog';
import { MemorandumForm } from './forms/MemorandumForm';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';
import { getMonthRange } from '@/lib/date-utils';
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

type MemorandumSectionProps = {
  employeeId: string;
  employeeName?: string;
  isDisassociated?: boolean;
};

const getMonthsAgoFromDate = (dateString: string): number => {
  const memorandumDate = new Date(dateString);
  const now = new Date();

  const yearDiff = now.getFullYear() - memorandumDate.getFullYear();
  const monthDiff = now.getMonth() - memorandumDate.getMonth();

  return yearDiff * 12 + monthDiff;
};

const memorandumService = new MemorandumService();

export function MemorandumSection({
  employeeId,
  employeeName,
  isDisassociated,
}: MemorandumSectionProps) {
  const applyCutoff = !isDisassociated;
  const [currentMemorandums, setCurrentMemorandums] = useState<
    MemorandumResponse[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMemorandum, setEditingMemorandum] =
    useState<MemorandumResponse | null>(null);
  const [expandedMonths, setExpandedMonths] = useState<Set<number>>(new Set());
  const [monthlyMemorandums, setMonthlyMemorandums] = useState<
    Map<number, MemorandumResponse[] | null>
  >(new Map());
  const [loadingMonths, setLoadingMonths] = useState<Set<number>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memorandumToDelete, setMemorandumToDelete] =
    useState<MemorandumResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchCurrentMemorandums();
  }, [employeeId]);

  const fetchCurrentMemorandums = async () => {
    try {
      setLoading(true);
      setError(null);
      const memorandums = await memorandumService.getMemorandumsByEmployee(
        employeeId,
        undefined,
        undefined,
        !applyCutoff
      );
      setCurrentMemorandums(memorandums);
    } catch (err) {
      console.error('Error fetching memorandums:', err);
      setError(
        err instanceof Error ? err.message : 'Error al cargar memorándums'
      );
    } finally {
      setLoading(false);
    }
  };

  const reloadMonth = async (monthsAgo: number) => {
    setLoadingMonths((prev) => new Set(prev).add(monthsAgo));

    try {
      const { startDate, endDate } = getMonthRange(monthsAgo, applyCutoff);
      const memorandums = await memorandumService.getMemorandumsByEmployee(
        employeeId,
        startDate,
        endDate
      );
      setMonthlyMemorandums((prev) =>
        new Map(prev).set(monthsAgo, memorandums)
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

  const handleMemorandumSaved = async (savedMemorandum: MemorandumResponse) => {
    if (editingMemorandum) {
      setCurrentMemorandums((prev) =>
        prev.map((m) => (m.id === savedMemorandum.id ? savedMemorandum : m))
      );
      setEditingMemorandum(null);
    } else {
      setCurrentMemorandums([savedMemorandum, ...currentMemorandums]);
    }
    setDialogOpen(false);

    await fetchCurrentMemorandums();

    const monthsAgo = getMonthsAgoFromDate(savedMemorandum.memorandumDate);
    if (monthsAgo > 0 && monthlyMemorandums.has(monthsAgo)) {
      await reloadMonth(monthsAgo);
    }
  };

  const handleEdit = (memorandum: MemorandumResponse) => {
    setEditingMemorandum(memorandum);
    setDialogOpen(true);
  };

  const handleDeleteClick = (memorandum: MemorandumResponse) => {
    setMemorandumToDelete(memorandum);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!memorandumToDelete) return;

    try {
      setDeleting(true);
      await memorandumService.deleteMemorandum(memorandumToDelete.id);

      setCurrentMemorandums((prev) =>
        prev.filter((m) => m.id !== memorandumToDelete.id)
      );

      toast.success('Memorándum eliminado', {
        description: (
          <p className="text-slate-700 select-none">
            El memorándum fue eliminado correctamente
          </p>
        ),
      });

      await fetchCurrentMemorandums();

      const monthsAgo = getMonthsAgoFromDate(memorandumToDelete.memorandumDate);
      if (monthsAgo > 0 && monthlyMemorandums.has(monthsAgo)) {
        await reloadMonth(monthsAgo);
      }
    } catch (error) {
      console.error('Error al eliminar memorándum:', error);
      toast.error('Error al eliminar', {
        description: (
          <p className="text-slate-700 select-none">
            No se pudo eliminar el memorándum
          </p>
        ),
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setMemorandumToDelete(null);
    }
  };

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingMemorandum(null);
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

      if (!monthlyMemorandums.has(monthsAgo)) {
        setLoadingMonths((prev) => new Set(prev).add(monthsAgo));

        try {
          const { startDate, endDate } = getMonthRange(monthsAgo, applyCutoff);
          const memorandums = await memorandumService.getMemorandumsByEmployee(
            employeeId,
            startDate,
            endDate
          );
          setMonthlyMemorandums((prev) =>
            new Map(prev).set(monthsAgo, memorandums)
          );
        } catch (err) {
          console.error(
            `Error fetching memorandums for month ${monthsAgo}:`,
            err
          );
          setMonthlyMemorandums((prev) => new Map(prev).set(monthsAgo, []));
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

  const positiveMemorandums = currentMemorandums.filter((m) => m.isPositive);
  const negativeMemorandums = currentMemorandums.filter((m) => !m.isPositive);

  const renderMemorandumCard = (
    memorandum: MemorandumResponse,
    isCurrentMonth: boolean = true
  ) => {
    const bgColor = memorandum.isPositive ? 'bg-green-50' : 'bg-red-50';
    const borderColor = memorandum.isPositive
      ? 'border-green-200'
      : 'border-red-200';
    const iconColor = memorandum.isPositive ? 'text-green-600' : 'text-red-600';

    return (
      <div
        key={memorandum.id}
        className={`flex items-start justify-between p-4 border rounded-lg ${bgColor} ${borderColor}`}
      >
        <div className="flex items-start gap-3 flex-1">
          {memorandum.isPositive ? (
            <div className="bg-green-600 p-2 rounded-full flex-shrink-0">
              <ThumbsUp className="h-4 w-4 text-white" />
            </div>
          ) : (
            <div className="bg-red-600 p-2 rounded-full flex-shrink-0">
              <ThumbsDown className="h-4 w-4 text-white" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge
                variant={memorandum.isPositive ? 'default' : 'destructive'}
                className={
                  memorandum.isPositive ? 'bg-green-600' : 'bg-red-600'
                }
              >
                {memorandum.type}
              </Badge>
              <Badge variant="outline">
                {formatDate(memorandum.memorandumDate)}
              </Badge>
            </div>
            <p className={`text-sm font-medium ${iconColor} mb-2`}>
              {memorandum.isPositive ? 'Positivo' : 'Negativo'}
            </p>
            <p className="text-sm text-gray-700">{memorandum.description}</p>
          </div>
        </div>

        <div className="flex gap-2 flex-shrink-0 ml-2">
          {isCurrentMonth && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleEdit(memorandum)}
              title="Editar"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleDeleteClick(memorandum)}
            title="Eliminar"
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
          <span className="ml-2">Cargando memorándums...</span>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6 p-4">
      <ReusableDialog
        title={editingMemorandum ? 'Editar Memorándum' : 'Registrar Memorándum'}
        description={
          editingMemorandum
            ? 'Modifica los datos del memorándum'
            : 'Registra un nuevo memorándum para el empleado'
        }
        open={dialogOpen}
        onOpenChange={handleDialogChange}
      >
        <MemorandumForm
          employeeId={employeeId}
          memorandum={editingMemorandum || undefined}
          onSave={handleMemorandumSaved}
          onCancel={() => handleDialogChange(false)}
          isDisassociated={isDisassociated}
        />
      </ReusableDialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El memorándum será eliminado
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

      <div className="flex justify-between">
        <div>
          <span className="text-xl font-bold">Memorándums</span>
          {employeeName && (
            <p className="text-sm text-muted-foreground">{employeeName}</p>
          )}
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Registrar Memorándum
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl shadow-md">
          <CardContent className="p-6 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-muted-foreground">
                Total del mes
              </span>
            </div>
            <span className="text-2xl font-semibold">
              {currentMemorandums.length}
            </span>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-md bg-green-50">
          <CardContent className="p-6 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <ThumbsUp className="h-4 w-4 text-green-600" />
              <span className="text-sm text-muted-foreground">Positivos</span>
            </div>
            <span className="text-2xl font-bold text-green-700">
              {positiveMemorandums.length}
            </span>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-md bg-red-50">
          <CardContent className="p-6 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <ThumbsDown className="h-4 w-4 text-red-600" />
              <span className="text-sm text-muted-foreground">Negativos</span>
            </div>
            <span className="text-2xl font-bold text-red-700">
              {negativeMemorandums.length}
            </span>
          </CardContent>
        </Card>
      </div>

      {currentMemorandums.length > 0 ? (
        <section className="flex flex-col gap-2 rounded-xl border p-4">
          <span className="text-lg font-semibold">
            Memorándums del mes actual
          </span>
          <Separator />

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {currentMemorandums.map((memorandum) =>
              renderMemorandumCard(memorandum, true)
            )}
          </div>
        </section>
      ) : (
        <div className="text-center p-8 border rounded-xl">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">
            No hay memorándums registrados este mes
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
          const memorandums = monthlyMemorandums.get(monthsAgo);

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
                  ) : memorandums && memorandums.length > 0 ? (
                    <div className="space-y-3">
                      {memorandums.map((memorandum) =>
                        renderMemorandumCard(memorandum, false)
                      )}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground p-4">
                      No hay memorándums en este mes
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
