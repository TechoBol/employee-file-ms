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
} from 'lucide-react';
import { AdvanceService } from '@/rest-client/services/AdvanceService';
import type { AdvanceResponse } from '@/rest-client/interface/response/AdvanceResponse';
import { ReusableDialog } from '@/app/shared/components/ReusableDialog';
import { AdvanceForm } from './forms/AdvanceForm';

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
  const [expandedMonths, setExpandedMonths] = useState<Set<number>>(new Set());
  const [monthlyAdvances, setMonthlyAdvances] = useState<
    Map<number, AdvanceResponse[] | null>
  >(new Map());
  const [loadingMonths, setLoadingMonths] = useState<Set<number>>(new Set());

  useEffect(() => {
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

    if (employeeId) {
      fetchCurrentAdvances();
    }
  }, [employeeId]);

  const handleAdvanceCreated = (newAdvance: AdvanceResponse) => {
    setCurrentAdvances([newAdvance, ...currentAdvances]);
    setDialogOpen(false);
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
    (sum, advance) => sum + advance.totalAmount,
    0
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
        title="Registrar Adelanto"
        description="Registra un nuevo adelanto para el empleado"
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      >
        <AdvanceForm employeeId={employeeId} onSave={handleAdvanceCreated} />
      </ReusableDialog>

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
            {currentAdvances.map((advance) => (
              <div
                key={advance.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1">
                  <DollarSign className="h-5 w-5 text-green-600 flex-shrink-0" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary">
                        {advance.percentageAmount * 100}%
                      </Badge>
                    </div>
                    <p className="text-sm font-medium">
                      {formatDate(advance.advanceDate)}
                    </p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0 ml-2">
                  <p className="text-sm font-semibold text-green-600">
                    {formatCurrency(advance.totalAmount)}
                  </p>
                </div>
              </div>
            ))}
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

        {[1, 2, 3, 4, 5, 6].map((monthsAgo) => {
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
                      {advances.map((advance) => (
                        <div
                          key={advance.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <DollarSign className="h-5 w-5 text-green-600 flex-shrink-0" />

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="secondary">
                                  {advance.percentageAmount * 100}%
                                </Badge>
                              </div>
                              <p className="text-sm font-medium">
                                {formatDate(advance.advanceDate)}
                              </p>
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0 ml-2">
                            <p className="text-sm font-semibold text-green-600">
                              {formatCurrency(advance.totalAmount)}
                            </p>
                          </div>
                        </div>
                      ))}
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
