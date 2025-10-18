import { ReusableDialog } from '@/app/shared/components/ReusableDialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SalarySummaryTexts } from '@/constants/localize';
import type { BaseSalaryResponse } from '@/rest-client/interface/response/BaseSalaryResponse';
import type {
  PayrollResponse,
  PayrollDeductionResponse,
} from '@/rest-client/interface/response/PayrollResponse';
import { BaseSalaryService } from '@/rest-client/services/BaseSalaryService';
import { Loader2, Plus, SquarePen } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { BaseSalaryForm } from './forms/BaseSalaryForm';
import { PayrollService } from '@/rest-client/services/PayrollService';

type SalarySummaryProps = {
  employeeId: string;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
    minimumFractionDigits: 2,
  }).format(value);

type DialogContentType = 'BASE_SALARY' | 'DEDUCTION' | null;

const baseSalaryService = new BaseSalaryService();
const payrollService = new PayrollService();

type DeductionsByType = {
  [key: string]: PayrollDeductionResponse[];
};

export function SalarySummary({ employeeId }: SalarySummaryProps) {
  const [baseSalary, setBaseSalary] = useState<BaseSalaryResponse | null>(null);
  const [payroll, setPayroll] = useState<PayrollResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState<DialogContentType>(null);

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

  const handleOpen = (type: DialogContentType) => {
    setDialogContent(type);
    setDialogOpen(true);
  };

  const handleBaseSalaryCreated = (newBaseSalary: BaseSalaryResponse) => {
    setBaseSalary(newBaseSalary);
    setDialogOpen(false);
    toast.success('Salario base creado', {
      description: `Se creó correctamente: ${formatCurrency(
        newBaseSalary.amount
      )}`,
    });
  };

  // Organizar deducciones por tipo
  const deductionsByType = useMemo<DeductionsByType>(() => {
    if (!payroll?.deductions) return {};

    const deductions: DeductionsByType = {};

    payroll.deductions.forEach((deduction) => {
      if (!deductions[deduction.type]) {
        deductions[deduction.type] = [];
      }
      deductions[deduction.type].push(deduction);
    });

    return deductions;
  }, [payroll?.deductions]);

  // Calcular totales de deducciones por tipo
  const deductionTotals = useMemo(() => {
    return Object.entries(deductionsByType).reduce(
      (acc, [type, deductions]) => {
        acc[type] = deductions.reduce((sum, d) => sum + d.totalDeduction, 0);
        return acc;
      },
      {} as Record<string, number>
    );
  }, [deductionsByType]);

  const getDeductionLabel = (type: string): string => {
    const labels: Record<string, string> = {
      PERMISSION: 'Permisos',
      ABSENCE: 'Faltas',
    };
    return labels[type] || type;
  };

  const renderDialogContent = useMemo(() => {
    switch (dialogContent) {
      case 'BASE_SALARY':
        return (
          <BaseSalaryForm
            employeeId={employeeId}
            onSave={handleBaseSalaryCreated}
          />
        );
      case 'DEDUCTION':
        return null;
      default:
        return null;
    }
  }, [dialogContent, employeeId]);

  const getDialogTitle = () => {
    switch (dialogContent) {
      case 'BASE_SALARY':
        return 'Crear Salario Base';
      case 'DEDUCTION':
        return 'Registrar Deducción';
      default:
        return '';
    }
  };

  const getDialogDescription = () => {
    switch (dialogContent) {
      case 'BASE_SALARY':
        return 'Establece el salario base para el empleado';
      case 'DEDUCTION':
        return 'Ingresa los detalles de la deducción';
      default:
        return '';
    }
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
          <span className="text-xl font-bold">{SalarySummaryTexts.title}</span>
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
        <span className="text-xl font-bold">{SalarySummaryTexts.title}</span>
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

      {/* Detalle de cálculo */}
      {baseSalary && payroll && (
        <section className="flex flex-col gap-2 rounded-xl border p-4">
          <span className="text-lg font-semibold">Detalle de cálculo</span>
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
              <span>Dias trabajados</span>
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
            <span className={payroll.totalAmount < 0 ? 'text-red-600' : ''}>
              {formatCurrency(payroll.totalAmount)}
            </span>
          </div>
        </section>
      )}
    </section>
  );
}
