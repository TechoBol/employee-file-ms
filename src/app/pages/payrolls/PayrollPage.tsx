import { Button } from '@/components/ui/button';
import { RefreshCw, Calculator } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DataTable } from '@/app/shared/components/DataTable';
import { SearchInput } from '@/app/shared/components/SearchInput';
import { PayrollService } from '@/rest-client/services/PayrollService';
import type { PayrollSummaryResponse } from '@/rest-client/interface/response/PayrollResponse';
import type { PaymentSummaryResponse } from '@/rest-client/interface/response/PaymentResponse';
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

const payrollService = new PayrollService();
const paymentService = new PaymentService();

const formatMonthYear = (date: Date) => {
  return date.toLocaleDateString('es-BO', {
    year: 'numeric',
    month: 'long',
  });
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
    minimumFractionDigits: 2,
  }).format(amount);
};

const getPeriodInfo = (monthsAgo: number) => {
  const now = new Date();
  const targetDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth() + 1;
  const period = year * 100 + month;

  return {
    period,
    label: formatMonthYear(targetDate),
  };
};

// Generar lista de períodos (últimos 12 meses)
const generatePeriods = () => {
  return Array.from({ length: 12 }, (_, i) => {
    const info = getPeriodInfo(i + 1);
    return {
      value: info.period.toString(),
      label: info.label,
      monthsAgo: i + 1,
    };
  });
};

export default function PayrollsPage() {
  // Estados para nóminas actuales
  const [currentData, setCurrentData] = useState<PayrollSummaryResponse | null>(null);
  const [currentLoading, setCurrentLoading] = useState(false);
  const [currentError, setCurrentError] = useState<string | null>(null);
  const [currentSearchValue, setCurrentSearchValue] = useState('');

  // Estados para pagos históricos
  const [historicalData, setHistoricalData] = useState<PaymentSummaryResponse | null>(null);
  const [historicalLoading, setHistoricalLoading] = useState(false);
  const [historicalError, setHistoricalError] = useState<string | null>(null);
  const [historicalSearchValue, setHistoricalSearchValue] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>(
    getPeriodInfo(1).period.toString()
  );
  const [reprocessing, setReprocessing] = useState(false);
  const [showReprocessDialog, setShowReprocessDialog] = useState(false);

  const periods = generatePeriods();

  // Fetch nóminas actuales
  const fetchCurrentPayrolls = async () => {
    setCurrentLoading(true);
    setCurrentError(null);

    try {
      const result = await payrollService.getAllPayrolls();
      setCurrentData(result);
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

  // Fetch pagos históricos
  const fetchHistoricalPayments = async () => {
    setHistoricalLoading(true);
    setHistoricalError(null);

    try {
      const result = await paymentService.getAllPaymentsByPeriod(
        parseInt(selectedPeriod)
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
  }, []);

  useEffect(() => {
    fetchHistoricalPayments();
  }, [selectedPeriod]);

  const handleCurrentSearchChange = (search: string) => {
    setCurrentSearchValue(search);
  };

  const handleHistoricalSearchChange = (search: string) => {
    setHistoricalSearchValue(search);
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

      // Recargar los datos después del reprocesamiento
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

  // Filtrar datos actuales por búsqueda
  const filteredCurrentData = currentData?.payrolls.filter((item) => {
    if (!currentSearchValue) return true;
    const search = currentSearchValue.toLowerCase();
    const { firstName, lastName, ci, email } = item.employee;
    return (
      firstName.toLowerCase().includes(search) ||
      lastName.toLowerCase().includes(search) ||
      ci.toLowerCase().includes(search) ||
      email.toLowerCase().includes(search)
    );
  }) ?? [];

  // Filtrar datos históricos por búsqueda
  const filteredHistoricalData = historicalData?.payments.filter((item) => {
    if (!historicalSearchValue) return true;
    const search = historicalSearchValue.toLowerCase();
    const { firstName, lastName, ci, email } = item.employee;
    return (
      firstName.toLowerCase().includes(search) ||
      lastName.toLowerCase().includes(search) ||
      ci.toLowerCase().includes(search) ||
      email.toLowerCase().includes(search)
    );
  }) ?? [];

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

        {/* Mes Actual */}
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
              <div className="flex items-center justify-between">
                <SearchInput
                  value={currentSearchValue}
                  onChange={handleCurrentSearchChange}
                  placeholder="Buscar por nombre, CI o email..."
                  disabled={currentLoading}
                  className="w-full sm:max-w-sm"
                />
                <Button
                  onClick={fetchCurrentPayrolls}
                  variant="outline"
                  size="icon"
                  disabled={currentLoading}
                  className="ml-2"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${
                      currentLoading ? 'animate-spin' : ''
                    }`}
                  />
                </Button>
              </div>

              <div className="rounded-lg border bg-card">
                <DataTable
                  columns={currentColumns}
                  data={filteredCurrentData}
                  loading={currentLoading}
                  showPagination={false}
                  noResultsMessage="No se encontraron nóminas"
                  loadingMessage="Cargando nóminas..."
                />
              </div>

              {/* Totales */}
              {currentData && !currentLoading && (
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Totales Generales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                          Total Descuentos
                        </p>
                        <p className="text-xl font-bold text-destructive">
                          {formatCurrency(currentData.totals.totalDeductions)}
                        </p>
                      </div>
                      <div className="space-y-1">
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
                        Mostrando {filteredCurrentData.length} de{' '}
                        {currentData.payrolls.length} empleados
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Meses Anteriores */}
        <TabsContent value="historical" className="space-y-4">
          <AlertDialog
            open={showReprocessDialog}
            onOpenChange={setShowReprocessDialog}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Recalcular período?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción recalculará todos los pagos del período seleccionado (
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
                      className={`h-4 w-4 ${reprocessing ? 'animate-pulse' : ''}`}
                    />
                    <span className="ml-2 hidden sm:inline">
                      {reprocessing ? 'Procesando...' : 'Recalcular'}
                    </span>
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

                <SearchInput
                  value={historicalSearchValue}
                  onChange={handleHistoricalSearchChange}
                  placeholder="Buscar por nombre, CI o email..."
                  disabled={historicalLoading || reprocessing}
                  className="w-full sm:max-w-sm"
                />
              </div>

              <div className="rounded-lg border bg-card">
                <DataTable
                  columns={historicalColumns}
                  data={filteredHistoricalData}
                  loading={historicalLoading}
                  showPagination={false}
                  noResultsMessage="No se encontraron pagos para este período"
                  loadingMessage="Cargando pagos..."
                />
              </div>

              {/* Totales */}
              {historicalData && !historicalLoading && (
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Totales Generales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                          Total Descuentos
                        </p>
                        <p className="text-xl font-bold text-destructive">
                          {formatCurrency(historicalData.totals.totalDeductions)}
                        </p>
                      </div>
                      <div className="space-y-1">
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
                        Mostrando {filteredHistoricalData.length} de{' '}
                        {historicalData.payments.length} empleados
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