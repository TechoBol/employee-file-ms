import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import type {
  PayrollEmployeeResponse,
  PayrollResponse,
  PayrollDeductionResponse,
} from '@/rest-client/interface/response/PayrollResponse';
import { Eye, Loader2, MoreHorizontal, User } from 'lucide-react';
import { useState, useMemo } from 'react';
import { PayrollService } from '@/rest-client/services/PayrollService';
import { ReusableDialog } from '@/app/shared/components/ReusableDialog';
import { useNavigate } from 'react-router';

const payrollService = new PayrollService();

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
    minimumFractionDigits: 2,
  }).format(value);

type DeductionsByType = {
  [key: string]: PayrollDeductionResponse[];
};

export function Actions({
  payrollEmployee,
}: {
  payrollEmployee: PayrollEmployeeResponse;
}) {
  const [open, setOpen] = useState(false);
  const [payrollDetails, setPayrollDetails] = useState<PayrollResponse | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleViewDetails = async () => {
    setOpen(true);
    setLoading(true);
    try {
      const details = await payrollService.getPayrollsByEmployeeId(
        payrollEmployee.employee.id
      );
      setPayrollDetails(details);
    } catch (error) {
      console.error('Error al cargar detalles de nómina:', error);
      setPayrollDetails(null);
    } finally {
      setLoading(false);
    }
  };

  const handleViewEmployeeDetails = () => {
    navigate(`/employees/${payrollEmployee.employee.id}`);
  }

  // Organizar deducciones por tipo
  const deductionsByType = useMemo<DeductionsByType>(() => {
    if (!payrollDetails?.deductions) return {};

    const result: DeductionsByType = {};
    payrollDetails.deductions.forEach((deduction) => {
      if (!result[deduction.type]) {
        result[deduction.type] = [];
      }
      result[deduction.type].push(deduction);
    });

    return result;
  }, [payrollDetails?.deductions]);

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
      ADVANCE: 'Anticipos',
    };
    return labels[type] || type;
  };

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menú</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleViewDetails}>
            <Eye className="mr-2 h-4 w-4" />
            Ver detalles de nómina
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleViewEmployeeDetails}>
            <User className="mr-2 h-4 w-4" />
            Ver detalles de empleado
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ReusableDialog
        open={open}
        onOpenChange={setOpen}
        title={`Detalles de Nómina - ${payrollEmployee.employee.firstName} ${payrollEmployee.employee.lastName}`}
        description="Información detallada del cálculo de nómina del empleado"
        className="max-w-2xl"
      >
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Cargando detalles...</span>
          </div>
        ) : payrollDetails ? (
          <section className="flex flex-col gap-2 rounded-xl border p-4 bg-gray-50">
            <span className="text-sm font-semibold">Detalle de cálculo</span>
            <Separator />

            {/* Ingresos */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Salario base</span>
                <span className="font-medium">
                  {formatCurrency(payrollDetails.baseSalary)}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span>Días trabajados</span>
                <span className="font-medium">{payrollDetails.workedDays}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span>Ganancia básica</span>
                <span className="font-medium">
                  {formatCurrency(payrollDetails.basicEarnings)}
                </span>
              </div>

              {payrollDetails.seniorityBonus > 0 && (
                <div className="flex justify-between text-sm">
                  <span>
                    Bono de Antigüedad ({payrollDetails.seniorityYears} años ×{' '}
                    {(payrollDetails.seniorityIncreasePercentage * 100).toFixed(
                      0
                    )}
                    %)
                  </span>
                  <span className="font-medium">
                    {formatCurrency(payrollDetails.seniorityBonus)}
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
                AFP ({(payrollDetails.deductionAfpPercentage * 100).toFixed(2)}
                %)
              </span>
              <span className="text-red-600 font-medium">
                -{formatCurrency(payrollDetails.deductionAfp)}
              </span>
            </div>

            {/* Otras deducciones */}
            {payrollDetails.totalDeductions > 0 && (
              <>
                <Separator className="my-2" />
                <span className="text-sm font-medium text-red-600">
                  Otras Deducciones
                </span>

                <div className="space-y-2">
                  {Object.entries(deductionsByType).map(
                    ([type, deductions]) => {
                      const total = deductionTotals[type];
                      const qty = deductions.reduce((sum, d) => sum + d.qty, 0);

                      return (
                        <div
                          key={type}
                          className="flex justify-between text-sm"
                        >
                          <span className="text-red-600">
                            {getDeductionLabel(type)} ({qty})
                          </span>
                          <span className="text-red-600 font-medium">
                            -{formatCurrency(total)}
                          </span>
                        </div>
                      );
                    }
                  )}
                </div>
              </>
            )}

            <Separator className="my-2" />
            <div className="flex justify-between font-bold text-sm">
              <span>Salario Final</span>
              <span
                className={payrollDetails.netAmount < 0 ? 'text-red-600' : ''}
              >
                {formatCurrency(payrollDetails.netAmount)}
              </span>
            </div>
          </section>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            No se pudieron cargar los detalles de la nómina
          </p>
        )}
      </ReusableDialog>
    </>
  );
}
