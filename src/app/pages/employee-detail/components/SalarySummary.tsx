import { ReusableDialog } from '@/app/shared/components/ReusableDialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { BaseSalaryResponse } from '@/rest-client/interface/response/BaseSalaryResponse';
import type {
  PayrollResponse,
  PayrollDeductionResponse,
} from '@/rest-client/interface/response/PayrollResponse';
import { BaseSalaryService } from '@/rest-client/services/BaseSalaryService';
import { ChevronDown, ChevronUp, Loader2, Plus, SquarePen } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { BaseSalaryForm } from './forms/BaseSalaryForm';
import { PayrollService } from '@/rest-client/services/PayrollService';
import type {
  PaymentDeductionResponse,
  PaymentDetailsResponse,
} from '@/rest-client/interface/response/PaymentResponse';
import { PaymentService } from '@/rest-client/services/PaymentService';

type SalarySummaryProps = {
  employeeId: string;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
    minimumFractionDigits: 2,
  }).format(value);

const formatMonthYear = (date: Date) => {
  return date.toLocaleDateString('es-BO', {
    year: 'numeric',
    month: 'long',
  });
};

const getPeriodInfo = (monthsAgo: number) => {
  const now = new Date();
  const targetDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth() + 1; // 1-12
  const period = year * 100 + month; // Formato: 202510

  return {
    period,
    label: formatMonthYear(targetDate),
  };
};

type DialogContentType = 'BASE_SALARY' | 'DEDUCTION' | null;

const baseSalaryService = new BaseSalaryService();
const payrollService = new PayrollService();
const paymentService = new PaymentService();

type DeductionsByType = {
  [key: string]: PayrollDeductionResponse[] | PaymentDeductionResponse[];
};

export function SalarySummary({ employeeId }: SalarySummaryProps) {
  const [baseSalary, setBaseSalary] = useState<BaseSalaryResponse | null>(null);
  const [payroll, setPayroll] = useState<PayrollResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState<DialogContentType>(null);

  // Estados para historial
  const [expandedMonths, setExpandedMonths] = useState<Set<number>>(new Set());
  const [monthlyPayments, setMonthlyPayments] = useState<
    Map<number, PaymentDetailsResponse[] | null>
  >(new Map());
  const [loadingMonths, setLoadingMonths] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [salary, payrollData] = await Promise.all([
          baseSalaryService.getBaseSalaryByEmployee(employeeId),
          payrollService.getPayrollsByEmployeeId(employeeId),
        ]);

        setBaseSalary(salary);
        setPayroll(payrollData);
      } catch (err) {
        console.error('Error fetching salary data:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Error al cargar datos de salario'
        );
      } finally {
        setLoading(false);
      }
    };

    if (employeeId) {
      fetchData();
    }
  }, [employeeId]);

  const toggleMonth = async (monthsAgo: number) => {
    if (expandedMonths.has(monthsAgo)) {
      setExpandedMonths((prev) => {
        const newSet = new Set(prev);
        newSet.delete(monthsAgo);
        return newSet;
      });
    } else {
      setExpandedMonths((prev) => new Set(prev).add(monthsAgo));

      if (!monthlyPayments.has(monthsAgo)) {
        setLoadingMonths((prev) => new Set(prev).add(monthsAgo));

        try {
          const { period } = getPeriodInfo(monthsAgo);
          const payments = await paymentService.getPaymentsByEmployeeAndPeriod(
            employeeId,
            period
          );
          setMonthlyPayments((prev) => new Map(prev).set(monthsAgo, payments));
        } catch (err) {
          console.error(`Error fetching payments for month ${monthsAgo}:`, err);
          setMonthlyPayments((prev) => new Map(prev).set(monthsAgo, []));
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

  const handleOpen = (type: DialogContentType) => {
    setDialogContent(type);
    setDialogOpen(true);
  };

  const handleBaseSalaryUpdated = async (
    updatedBaseSalary: BaseSalaryResponse
  ) => {
    setBaseSalary(updatedBaseSalary);
    setDialogOpen(false);

    try {
      const updatedPayroll = await payrollService.getPayrollsByEmployeeId(
        employeeId
      );
      setPayroll(updatedPayroll);
    } catch (err) {
      console.error('Error refetching payroll:', err);
      toast.error('Error al actualizar el payroll', {
        description: (
          <p className="text-slate-700 select-none">
            El salario base se guardó pero hubo un error al actualizar los
            cálculos
          </p>
        ),
      });
    }
  };

  // Organizar deducciones por tipo
  const getDeductionsByType = (
    deductions: PayrollDeductionResponse[] | PaymentDeductionResponse[]
  ): DeductionsByType => {
    if (!deductions) return {};

    const result: DeductionsByType = {};

    deductions.forEach((deduction) => {
      if (!result[deduction.type]) {
        result[deduction.type] = [];
      }
      result[deduction.type].push(deduction);
    });

    return result;
  };

  const deductionsByType = useMemo<DeductionsByType>(() => {
    if (!payroll?.deductions) return {};
    return getDeductionsByType(payroll.deductions);
  }, [payroll?.deductions]);

  // Calcular totales de deducciones por tipo
  const calculateDeductionTotals = (deductionsByType: DeductionsByType) => {
    return Object.entries(deductionsByType).reduce(
      (acc, [type, deductions]) => {
        acc[type] = deductions.reduce((sum, d) => sum + d.totalDeduction, 0);
        return acc;
      },
      {} as Record<string, number>
    );
  };

  const deductionTotals = useMemo(() => {
    return calculateDeductionTotals(deductionsByType);
  }, [deductionsByType]);

  const getDeductionLabel = (type: string): string => {
    const labels: Record<string, string> = {
      PERMISSION: 'Permisos',
      ABSENCE: 'Faltas',
      ADVANCE: 'Anticipos',
    };
    return labels[type] || type;
  };

  const renderDialogContent = useMemo(() => {
    switch (dialogContent) {
      case 'BASE_SALARY':
        return (
          <BaseSalaryForm
            employeeId={employeeId}
            onSave={handleBaseSalaryUpdated}
            baseSalary={baseSalary}
          />
        );
      case 'DEDUCTION':
        return null;
      default:
        return null;
    }
  }, [dialogContent, employeeId, baseSalary]);

  const getDialogTitle = () => {
    switch (dialogContent) {
      case 'BASE_SALARY':
        return baseSalary ? 'Actualizar Salario Base' : 'Crear Salario Base';
      case 'DEDUCTION':
        return 'Registrar Deducción';
      default:
        return '';
    }
  };

  const getDialogDescription = () => {
    switch (dialogContent) {
      case 'BASE_SALARY':
        return baseSalary
          ? 'Modifica el salario base del empleado'
          : 'Establece el salario base para el empleado';
      case 'DEDUCTION':
        return 'Ingresa los detalles de la deducción';
      default:
        return '';
    }
  };

  const renderPaymentDetail = (payment: PaymentDetailsResponse) => {
    const deductions = getDeductionsByType(payment.deductions);
    const totals = calculateDeductionTotals(deductions);

    return (
      <section className="flex flex-col gap-2 rounded-xl border p-4 bg-gray-50">
        <span className="text-sm font-semibold">Detalle de cálculo</span>
        <Separator />

        {/* Ingresos */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Salario base</span>
            <span className="font-medium">
              {formatCurrency(payment.baseSalary)}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span>Días trabajados</span>
            <span className="font-medium">{payment.workedDays}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span>Ganancia básica</span>
            <span className="font-medium">
              {formatCurrency(payment.basicEarnings)}
            </span>
          </div>

          {payment.seniorityBonus > 0 && (
            <div className="flex justify-between text-sm">
              <span>
                Bono de Antigüedad ({payment.seniorityYears} años ×{' '}
                {(payment.seniorityIncreasePercentage * 100).toFixed(0)}%)
              </span>
              <span className="font-medium">
                {formatCurrency(payment.seniorityBonus)}
              </span>
            </div>
          )}
        </div>

        {/* Deducción de AFP */}
        <Separator className="my-2" />
        <span className="text-sm font-medium text-red-600">
          Deducciones Obligatorias
        </span>

        <div className="flex justify-between text-sm">
          <span className="text-red-600">
            AFP ({(payment.deductionAfpPercentage * 100).toFixed(2)}%)
          </span>
          <span className="text-red-600 font-medium">
            -{formatCurrency(payment.deductionAfp)}
          </span>
        </div>

        {/* Otras deducciones */}
        {payment.totalDeduction > 0 && (
          <>
            <Separator className="my-2" />
            <span className="text-sm font-medium text-red-600">
              Otras Deducciones
            </span>

            <div className="space-y-2">
              {Object.entries(deductions).map(([type, deductionList]) => {
                const total = totals[type];
                const qty = deductionList.reduce((sum, d) => sum + d.qty, 0);

                return (
                  <div key={type} className="flex justify-between text-sm">
                    <span className="text-red-600">
                      {getDeductionLabel(type)} ({qty})
                    </span>
                    <span className="text-red-600 font-medium">
                      -{formatCurrency(total)}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <Separator className="my-2" />
        <div className="flex justify-between font-bold text-sm">
          <span>Salario Final</span>
          <span className={payment.netAmount < 0 ? 'text-red-600' : ''}>
            {formatCurrency(payment.netAmount)}
          </span>
        </div>
      </section>
    );
  };

  if (loading) {
    return (
      <section className="flex flex-col gap-6 p-4">
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Cargando salario...</span>
        </div>
      </section>
    );
  }

  if (error && !baseSalary) {
    return (
      <section className="flex flex-col gap-6 p-4">
        <div className="flex justify-between">
          <span className="text-xl font-bold">Resumen de Salario</span>
        </div>
        <div className="text-center p-8 border rounded-xl">
          <p className="text-muted-foreground mb-4">
            No se encontró salario base para este empleado
          </p>
          <Button onClick={() => handleOpen('BASE_SALARY')}>
            <Plus className="mr-2 h-4 w-4" />
            Crear Salario Base
          </Button>
        </div>
        <ReusableDialog
          title={getDialogTitle()}
          description={getDialogDescription()}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        >
          {renderDialogContent}
        </ReusableDialog>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6 p-4">
      <ReusableDialog
        title={getDialogTitle()}
        description={getDialogDescription()}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      >
        {renderDialogContent}
      </ReusableDialog>

      <div className="flex justify-between items-center">
        <span className="text-xl font-bold">Resumen de Salario</span>
        <div className="flex gap-4">
          <Button
            className="w-60"
            variant="outline"
            onClick={() => handleOpen('BASE_SALARY')}
            disabled={!baseSalary}
          >
            <SquarePen className="h-4 w-4" />
            <span>Actualizar Salario Base</span>
          </Button>
        </div>
      </div>

      {/* Detalle de cálculo - Mes actual */}
      {baseSalary && payroll && (
        <section className="flex flex-col gap-2 rounded-xl border p-4">
          <span className="text-lg font-semibold">Mes actual</span>
          <Separator />

          {/* Ingresos */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Salario base</span>
              <span className="font-medium">
                {formatCurrency(payroll.baseSalary)}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span>Días trabajados</span>
              <span className="font-medium">{payroll.workedDays}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span>Ganancia básica</span>
              <span className="font-medium">
                {formatCurrency(payroll.basicEarnings)}
              </span>
            </div>

            {payroll.seniorityBonus > 0 && (
              <div className="flex justify-between text-sm">
                <span>
                  Bono de Antigüedad ({payroll.seniorityYears} años ×{' '}
                  {(payroll.seniorityIncreasePercentage * 100).toFixed(0)}%)
                </span>
                <span className="font-medium">
                  {formatCurrency(payroll.seniorityBonus)}
                </span>
              </div>
            )}
          </div>

          {/* Deducción de AFP */}
          <Separator className="my-2" />
          <span className="text-sm font-medium text-red-600">
            Deducciones Obligatorias
          </span>

          <div className="flex justify-between text-sm">
            <span className="text-red-600">
              AFP ({(payroll.deductionAfpPercentage * 100).toFixed(2)}%)
            </span>
            <span className="text-red-600 font-medium">
              -{formatCurrency(payroll.deductionAfp)}
            </span>
          </div>

          {/* Otras deducciones */}
          {payroll.totalDeductions > 0 && (
            <>
              <Separator className="my-2" />
              <span className="text-sm font-medium text-red-600">
                Otras Deducciones
              </span>

              <div className="space-y-2">
                {Object.entries(deductionsByType).map(([type, deductions]) => {
                  const total = deductionTotals[type];
                  const qty = deductions.reduce((sum, d) => sum + d.qty, 0);

                  return (
                    <div key={type} className="flex justify-between text-sm">
                      <span className="text-red-600">
                        {getDeductionLabel(type)} ({qty})
                      </span>
                      <span className="text-red-600 font-medium">
                        -{formatCurrency(total)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <Separator className="my-2" />
          <div className="flex justify-between font-bold text-base">
            <span>Salario Final</span>
            <span className={payroll.netAmount < 0 ? 'text-red-600' : ''}>
              {formatCurrency(payroll.netAmount)}
            </span>
          </div>
        </section>
      )}

      <Separator className="my-4" />

      {/* Historial de meses anteriores */}
      <div className="flex flex-col gap-4">
        <span className="text-lg font-semibold">Meses anteriores</span>

        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((monthsAgo) => {
          const { label } = getPeriodInfo(monthsAgo);
          const isExpanded = expandedMonths.has(monthsAgo);
          const isLoading = loadingMonths.has(monthsAgo);
          const payments = monthlyPayments.get(monthsAgo);

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
                  ) : payments && payments.length > 0 ? (
                    <div className="space-y-3">
                      {payments.map((payment, idx) => (
                        <div key={idx}>{renderPaymentDetail(payment)}</div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground p-4">
                      No hay pagos registrados en este mes
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
