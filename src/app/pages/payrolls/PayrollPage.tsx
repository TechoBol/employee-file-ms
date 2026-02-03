import { Button } from '@/components/ui/button';
import { RefreshCw, Calculator, Printer } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { DataTable } from '@/app/shared/components/DataTable';
import { PayrollService } from '@/rest-client/services/PayrollService';
import type {
  PayrollSummaryResponse,
  PayrollSummaryPageResponse,
} from '@/rest-client/interface/response/PayrollResponse';
import type { PaymentSummaryResponse } from '@/rest-client/interface/response/PaymentResponse';
import type { EmployeeSearchParams } from '@/rest-client/interface/request/EmployeeSearchParams';
import { PaymentService } from '@/rest-client/services/PaymentService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { currentColumns, historicalColumns } from './columns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmployeeFilters } from '../employees/EmployeeFilters';
import { formatCurrency, generatePDF } from './functions/generatePdf';
import { MONTH_CUTOFF_DAY } from '@/lib/date-utils';

const payrollService = new PayrollService();
const paymentService = new PaymentService();

const deductionLabels: Record<string, string> = {
  PERMISSION: 'Permisos',
  ABSENCE: 'Faltas',
  ADVANCE: 'Anticipos',
  RC_IVA: 'RC-IVA',
};

const formatMonthYear = (date: Date) => {
  return date.toLocaleDateString('es-BO', {
    year: 'numeric',
    month: 'long',
  });
};

const getPeriodInfo = (monthsAgo: number, applyCutoff: boolean = true) => {
  const now = new Date();

  const adjustedMonthsAgo =
    applyCutoff && now.getDate() <= MONTH_CUTOFF_DAY
      ? monthsAgo + 1
      : monthsAgo;

  const targetDate = new Date(
    now.getFullYear(),
    now.getMonth() - adjustedMonthsAgo,
    1
  );
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth() + 1;
  const period = year * 100 + month;

  return {
    period,
    label: formatMonthYear(targetDate),
  };
};

const generatePeriods = (applyCutoff: boolean = true) => {
  return Array.from({ length: 12 }, (_, i) => {
    const info = getPeriodInfo(i + 1, applyCutoff);
    return {
      value: info.period.toString(),
      label: info.label,
      monthsAgo: i + 1,
    };
  });
};

export default function PayrollsPage() {
  const [currentData, setCurrentData] = useState<PayrollSummaryResponse | null>(
    null
  );
  const [currentLoading, setCurrentLoading] = useState(false);
  const [currentError, setCurrentError] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<EmployeeSearchParams>(
    {}
  );
  const [currentPage, setCurrentPage] = useState(0);
  const [currentPageSize] = useState(20);
  const [currentTotalPages, setCurrentTotalPages] = useState(0);
  const [hasFilters, setHasFilters] = useState(false);

  const [historicalData, setHistoricalData] =
    useState<PaymentSummaryResponse | null>(null);
  const [historicalLoading, setHistoricalLoading] = useState(false);
  const [historicalError, setHistoricalError] = useState<string | null>(null);
  const [historicalFilters, setHistoricalFilters] =
    useState<EmployeeSearchParams>({});
  const [selectedPeriod, setSelectedPeriod] = useState<string>(
    getPeriodInfo(1).period.toString()
  );
  const [reprocessing, setReprocessing] = useState(false);
  const [showReprocessDialog, setShowReprocessDialog] = useState(false);

  const applyCutoffToHistorical = historicalFilters.isDisassociated !== true;
  const periods = useMemo(
    () => generatePeriods(applyCutoffToHistorical),
    [applyCutoffToHistorical]
  );

  const hasActiveFilters = (filters: EmployeeSearchParams) => {
    return Boolean(
      filters.search ||
        filters.ci ||
        filters.email ||
        filters.phone ||
        filters.type ||
        filters.isDisassociated !== undefined ||
        filters.branchId ||
        filters.positionId
    );
  };

  const fetchCurrentPayrolls = async () => {
    setCurrentLoading(true);
    setCurrentError(null);

    try {
      const filtersActive = hasActiveFilters(currentFilters);
      setHasFilters(filtersActive);

      if (filtersActive) {
        const result: PayrollSummaryPageResponse =
          await payrollService.getPayrolls(
            currentPage,
            currentPageSize,
            currentFilters
          );

        setCurrentData({
          payrolls: result.payrolls.content,
          totals: result.totals,
        });
        setCurrentTotalPages(result.payrolls.page.totalPages);
      } else {
        const result: PayrollSummaryResponse =
          await payrollService.getAllPayrolls();
        setCurrentData(result);
        setCurrentTotalPages(0);
      }
    } catch (err) {
      console.error('Error fetching payrolls:', err);
      setCurrentError(
        err instanceof Error ? err.message : 'Error al cargar las nóminas'
      );
      setCurrentData(null);
    } finally {
      setCurrentLoading(false);
    }
  };

  const fetchHistoricalPayments = async () => {
    setHistoricalLoading(true);
    setHistoricalError(null);

    try {
      console.log('historical Filters:', historicalFilters);
      const applyCutoff = historicalFilters.isDisassociated !== true;
      applyCutoff;
      const periodNumber = parseInt(selectedPeriod);

      const result = await paymentService.getAllPaymentsByPeriod(
        periodNumber,
        historicalFilters
      );
      setHistoricalData(result);
    } catch (err) {
      console.error('Error fetching historical payments:', err);
      setHistoricalError(
        err instanceof Error
          ? err.message
          : 'Error al cargar los pagos históricos'
      );
      setHistoricalData(null);
    } finally {
      setHistoricalLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentPayrolls();
  }, [currentFilters, currentPage]);

  useEffect(() => {
    fetchHistoricalPayments();
  }, [selectedPeriod, historicalFilters]);

  const handleCurrentFiltersChange = (filters: EmployeeSearchParams) => {
    setCurrentFilters(filters);
    setCurrentPage(0);
  };

  const handleHistoricalFiltersChange = (filters: EmployeeSearchParams) => {
    setHistoricalFilters(filters);
    const applyCutoff = filters.isDisassociated !== true;
    const { period } = getPeriodInfo(1, applyCutoff);
    setSelectedPeriod(period.toString());
  };

  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value);
  };

  const handleReprocessClick = () => {
    setShowReprocessDialog(true);
  };

  const handleReprocessConfirm = async () => {
    try {
      setReprocessing(true);
      setShowReprocessDialog(false);

      await paymentService.reprocessPayment(parseInt(selectedPeriod));

      toast.success('Reprocesamiento completado', {
        description: (
          <p className="text-slate-700 select-none">
            Los pagos del período se han recalculado exitosamente
          </p>
        ),
      });

      await fetchHistoricalPayments();
    } catch (error) {
      console.error('Error al reprocesar pagos:', error);
      toast.error('Error al reprocesar', {
        description: (
          <p className="text-slate-700 select-none">
            {error instanceof Error
              ? error.message
              : 'No se pudo reprocesar el período'}
          </p>
        ),
      });
    } finally {
      setReprocessing(false);
    }
  };

  const handlePrintCurrent = () => {
    if (!currentData) return;
    generatePDF(
      currentData.payrolls,
      currentData.totals,
      `Nómina - Mes Actual [${formatMonthYear(new Date())}]`
    );
  };

  const handlePrintHistorical = () => {
    if (!historicalData) return;
    const periodLabel = periods.find((p) => p.value === selectedPeriod)?.label;
    generatePDF(
      historicalData.payments,
      historicalData.totals,
      `Nómina - ${periodLabel}`,
      selectedPeriod
    );
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nóminas</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona y visualiza las nóminas de los empleados
          </p>
        </div>
      </div>

      <Tabs defaultValue="current" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger value="current">Mes Actual</TabsTrigger>
          <TabsTrigger value="historical">Meses Anteriores</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          {currentError ? (
            <div className="text-center p-8 border rounded-xl bg-destructive/5">
              <p className="text-destructive mb-4 font-medium">
                Error: {currentError}
              </p>
              <Button onClick={fetchCurrentPayrolls} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Reintentar
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2">
                <EmployeeFilters
                  filters={currentFilters}
                  onChange={handleCurrentFiltersChange}
                  disabled={currentLoading}
                  debounceMs={1000}
                  showDebounceIndicator={true}
                  className="flex-1"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handlePrintCurrent}
                    variant="outline"
                    size="icon"
                    disabled={currentLoading || !currentData}
                    title="Imprimir PDF"
                  >
                    <Printer className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={fetchCurrentPayrolls}
                    variant="outline"
                    size="icon"
                    disabled={currentLoading}
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${
                        currentLoading ? 'animate-spin' : ''
                      }`}
                    />
                  </Button>
                </div>
              </div>

              <div className="rounded-lg bg-card">
                <DataTable
                  columns={currentColumns}
                  data={currentData?.payrolls ?? []}
                  loading={currentLoading}
                  showPagination={hasFilters}
                  pageCount={currentTotalPages}
                  pageIndex={currentPage}
                  pageSize={currentPageSize}
                  onPaginationChange={(updater) => {
                    const newPagination =
                      typeof updater === 'function'
                        ? updater({
                            pageIndex: currentPage,
                            pageSize: currentPageSize,
                          })
                        : updater;
                    setCurrentPage(newPagination.pageIndex);
                  }}
                  noResultsMessage="No se encontraron nóminas"
                  loadingMessage="Cargando nóminas..."
                />
              </div>

              {currentData && !currentLoading && (
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {hasFilters ? 'Totales Filtrados' : 'Totales Generales'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Bonos Antigüedad
                        </p>
                        <p className="text-lg font-semibold text-green-600">
                          {formatCurrency(
                            currentData.totals.totalSeniorityBonuses
                          )}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Otros Bonos
                        </p>
                        <p className="text-lg font-semibold text-green-600">
                          {formatCurrency(currentData.totals.totalOtherBonuses)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Total Bonos
                        </p>
                        <p className="text-xl font-bold text-green-600">
                          {formatCurrency(currentData.totals.totalBonuses)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Total Ganado
                        </p>
                        <p className="text-xl font-bold text-green-700">
                          {formatCurrency(currentData.totals.totalEarnings)}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Descuentos AFP
                        </p>
                        <p className="text-lg font-semibold text-red-600">
                          {formatCurrency(
                            currentData.totals.totalAfpDeductions
                          )}
                        </p>
                      </div>

                      {Object.entries(currentData.totals.deductions).map(
                        ([key, value]) => (
                          <div key={key} className="space-y-1">
                            <p className="text-sm text-muted-foreground">
                              {deductionLabels[key]}
                            </p>
                            <p className="text-lg font-semibold text-red-600">
                              {formatCurrency(value)}
                            </p>
                          </div>
                        )
                      )}

                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Total Descuentos
                        </p>
                        <p className="text-xl font-bold text-destructive">
                          {formatCurrency(currentData.totals.totalDeductions)}
                        </p>
                      </div>

                      <div className="space-y-1 md:col-span-2 lg:col-span-1">
                        <p className="text-sm text-muted-foreground">
                          Total Líquido Pagable
                        </p>
                        <p className="text-2xl font-bold text-blue-600">
                          {formatCurrency(currentData.totals.netAmount)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground text-center">
                        Mostrando {currentData.payrolls.length} empleados
                        {hasFilters &&
                          ` (página ${
                            currentPage + 1
                          } de ${currentTotalPages})`}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="historical" className="space-y-4">
          <AlertDialog
            open={showReprocessDialog}
            onOpenChange={setShowReprocessDialog}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Recalcular período?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción recalculará todos los pagos del período
                  seleccionado (
                  {periods.find((p) => p.value === selectedPeriod)?.label}
                  ). Los valores actuales serán reemplazados. ¿Deseas continuar?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={reprocessing}>
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleReprocessConfirm}
                  disabled={reprocessing}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {reprocessing ? 'Procesando...' : 'Recalcular'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {historicalError ? (
            <div className="text-center p-8 border rounded-xl bg-destructive/5">
              <p className="text-destructive mb-4 font-medium">
                Error: {historicalError}
              </p>
              <Button onClick={fetchHistoricalPayments} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Reintentar
              </Button>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Select
                    value={selectedPeriod}
                    onValueChange={handlePeriodChange}
                    disabled={historicalLoading || reprocessing}
                  >
                    <SelectTrigger className="w-full sm:w-[280px]">
                      <SelectValue placeholder="Seleccionar período" />
                    </SelectTrigger>
                    <SelectContent>
                      {periods.map((period) => (
                        <SelectItem key={period.value} value={period.value}>
                          {period.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleReprocessClick}
                    variant="outline"
                    disabled={historicalLoading || reprocessing}
                    title="Recalcular período"
                  >
                    <Calculator
                      className={`h-4 w-4 ${
                        reprocessing ? 'animate-pulse' : ''
                      }`}
                    />
                    <span className="ml-2 hidden sm:inline">
                      {reprocessing ? 'Procesando...' : 'Recalcular'}
                    </span>
                  </Button>
                  <Button
                    onClick={handlePrintHistorical}
                    variant="outline"
                    size="icon"
                    disabled={
                      historicalLoading || reprocessing || !historicalData
                    }
                    title="Imprimir PDF"
                  >
                    <Printer className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={fetchHistoricalPayments}
                    variant="outline"
                    size="icon"
                    disabled={historicalLoading || reprocessing}
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${
                        historicalLoading ? 'animate-spin' : ''
                      }`}
                    />
                  </Button>
                </div>

                <EmployeeFilters
                  filters={historicalFilters}
                  onChange={handleHistoricalFiltersChange}
                  disabled={historicalLoading || reprocessing}
                  debounceMs={1000}
                  showDebounceIndicator={true}
                  className="w-full sm:flex-1"
                />
              </div>

              <div>
                <DataTable
                  columns={historicalColumns}
                  data={historicalData?.payments ?? []}
                  loading={historicalLoading}
                  showPagination={false}
                  noResultsMessage="No se encontraron pagos para este período"
                  loadingMessage="Cargando pagos..."
                />
              </div>

              {historicalData && !historicalLoading && (
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {hasActiveFilters(historicalFilters)
                        ? 'Totales Filtrados'
                        : 'Totales Generales'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Bonos Antigüedad
                        </p>
                        <p className="text-lg font-semibold text-green-600">
                          {formatCurrency(
                            historicalData.totals.totalSeniorityBonuses
                          )}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Otros Bonos
                        </p>
                        <p className="text-lg font-semibold text-green-600">
                          {formatCurrency(
                            historicalData.totals.totalOtherBonuses
                          )}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Total Bonos
                        </p>
                        <p className="text-xl font-bold text-green-600">
                          {formatCurrency(historicalData.totals.totalBonuses)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Total Ganado
                        </p>
                        <p className="text-xl font-bold text-green-700">
                          {formatCurrency(historicalData.totals.totalEarnings)}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Descuentos AFP
                        </p>
                        <p className="text-lg font-semibold text-red-600">
                          {formatCurrency(
                            historicalData.totals.totalAfpDeductions
                          )}
                        </p>
                      </div>

                      {Object.entries(historicalData.totals.deductions).map(
                        ([key, value]) => (
                          <div key={key} className="space-y-1">
                            <p className="text-sm text-muted-foreground">
                              {deductionLabels[key]}
                            </p>
                            <p className="text-lg font-semibold text-red-600">
                              {formatCurrency(value)}
                            </p>
                          </div>
                        )
                      )}

                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Total Descuentos
                        </p>
                        <p className="text-xl font-bold text-destructive">
                          {formatCurrency(
                            historicalData.totals.totalDeductions
                          )}
                        </p>
                      </div>

                      <div className="space-y-1 md:col-span-2 lg:col-span-1">
                        <p className="text-sm text-muted-foreground">
                          Total Líquido Pagable
                        </p>
                        <p className="text-2xl font-bold text-blue-600">
                          {formatCurrency(historicalData.totals.netAmount)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground text-center">
                        Mostrando {historicalData.payments.length} empleados
                        {' • '}
                        Período:{' '}
                        {periods.find((p) => p.value === selectedPeriod)?.label}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
