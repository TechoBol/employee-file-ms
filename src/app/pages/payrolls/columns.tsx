import type { PayrollEmployeeResponse } from '@/rest-client/interface/response/PayrollResponse';
import { Actions } from './Actions';
import type { ColumnDef } from '@tanstack/react-table';
import type { PaymentEmployeeResponse } from '@/rest-client/interface/response/PaymentResponse';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// Mapeo de tipos de deducciones a etiquetas en español
const deductionLabels: Record<string, string> = {
  ADVANCE: 'Anticipos',
  AFP: 'Gestora',
  ABSENCE: 'Faltas',
  PERMISSION: 'Permisos',
  OTHER: 'Otros',
};

export const currentColumns: ColumnDef<PayrollEmployeeResponse>[] = [
  {
    id: 'employee',
    header: () => <span className="pl-4">Empleado</span>,
    cell: ({ row }) => {
      const { firstName, lastName, ci } = row.original.employee;
      // Asumiendo que tienes positionName disponible, si no, ajusta según tu estructura
      const position = row.original.employee.positionName || 'Sin cargo';
      return (
        <section className="pl-4 min-w-[200px]">
          <span className="font-medium block">
            {firstName} {lastName}
          </span>
          <span className="text-sm text-muted-foreground block">CI: {ci}</span>
          <span className="text-xs text-muted-foreground block">
            {position}
          </span>
        </section>
      );
    },
  },
  {
    accessorKey: 'employee.hireDate',
    header: 'Fecha de Ingreso',
    cell: ({ row }) => {
      const hireDate = row.original.employee.hireDate;
      return (
        <span className="text-sm text-muted-foreground">
          {formatDate(hireDate)}
        </span>
      );
    },
  },
  {
    accessorKey: 'payroll.baseSalary',
    header: 'Haber Básico',
    cell: ({ row }) => {
      const baseSalary = row.original.payroll.baseSalary;
      return (
        <span className="text-sm font-medium">
          {formatCurrency(baseSalary)}
        </span>
      );
    },
  },
  {
    accessorKey: 'payroll.workedDays',
    header: 'Días Trabajados',
    cell: ({ row }) => {
      const workedDays = row.original.payroll.workedDays;
      const workingDaysPerMonth =
        row.original.payroll.workingDaysPerMonth || 30;
      return (
        <div className="text-center">
          <span className="text-sm font-medium">{workedDays}</span>
          <span className="text-xs text-muted-foreground block">
            de {workingDaysPerMonth}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: 'payroll.basicEarnings',
    header: 'Sueldo Básico',
    cell: ({ row }) => {
      const basicEarnings = row.original.payroll.basicEarnings;
      return (
        <span className="text-sm font-medium">
          {formatCurrency(basicEarnings)}
        </span>
      );
    },
  },
  {
    accessorKey: 'payroll.seniorityBonus',
    header: 'Bono Antigüedad',
    cell: ({ row }) => {
      const seniorityYears = row.original.payroll.seniorityYears;
      const seniorityBonus = row.original.payroll.seniorityBonus;
      return (
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {formatCurrency(seniorityBonus)}
          </span>
          <span className="text-xs text-muted-foreground">
            {seniorityYears} {seniorityYears === 1 ? 'año' : 'años'}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: 'payroll.otherBonuses',
    header: 'Otros Bonos',
    cell: ({ row }) => {
      const otherBonuses = row.original.payroll.otherBonuses;
      return (
        <span className="text-sm font-medium text-green-600">
          {formatCurrency(otherBonuses)}
        </span>
      );
    },
  },
  {
    accessorKey: 'payroll.totalEarnings',
    header: 'Total Ganado',
    cell: ({ row }) => {
      const totalEarnings = row.original.payroll.totalEarnings;
      return (
        <span className="text-sm font-semibold text-green-700">
          {formatCurrency(totalEarnings)}
        </span>
      );
    },
  },
  {
    id: 'deductions-detail',
    header: 'Descuentos',
    cell: ({ row }) => {
      const deductions = row.original.payroll.deductions || [];
      const deductionAfp = row.original.payroll.deductionAfp;

      return (
        <div className="flex flex-col gap-0.5 min-w-[150px]">
          {/* AFP */}
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Gestora:</span>
            <span className="font-medium">{formatCurrency(deductionAfp)}</span>
          </div>

          {/* Otras deducciones */}
          {deductions.map((deduction, index) => {
            console.log(deduction);
            return (
              <div key={index} className="flex justify-between text-xs">
                <span className="text-muted-foreground">
                  {deductionLabels[deduction.type] || deduction.type}:
                </span>
                <span className="font-medium">
                  {formatCurrency(deduction.totalDeduction)}
                </span>
              </div>
            );
          })}
        </div>
      );
    },
  },
  {
    accessorKey: 'payroll.totalDeductions',
    header: 'Total Descuentos',
    cell: ({ row }) => {
      const totalDeductions = row.original.payroll.totalDeductions;
      const deductionAfp = row.original.payroll.deductionAfp;
      const totalWithAfp = totalDeductions + deductionAfp;
      return (
        <span className="text-sm font-semibold text-destructive">
          {formatCurrency(totalWithAfp)}
        </span>
      );
    },
  },
  {
    accessorKey: 'payroll.netAmount',
    header: 'Líquido Pagable',
    cell: ({ row }) => {
      const netAmount = row.original.payroll.netAmount;
      return (
        <span className="text-base font-bold text-green-600">
          {formatCurrency(netAmount)}
        </span>
      );
    },
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => {
      const payrollEmployee = row.original;
      return <Actions payrollEmployee={payrollEmployee} />;
    },
  },
];

export const historicalColumns: ColumnDef<PaymentEmployeeResponse>[] = [
  {
    id: 'employee',
    header: () => <span className="pl-4">Empleado</span>,
    cell: ({ row }) => {
      const { firstName, lastName, ci } = row.original.employee;
      // Asumiendo que tienes positionName disponible
      const position = row.original.employee.positionName || 'Sin cargo';
      return (
        <section className="pl-4 min-w-[200px]">
          <span className="font-medium block">
            {firstName} {lastName}
          </span>
          <span className="text-sm text-muted-foreground block">CI: {ci}</span>
          <span className="text-xs text-muted-foreground block">
            {position}
          </span>
        </section>
      );
    },
  },
  {
    accessorKey: 'employee.hireDate',
    header: 'Fecha de Ingreso',
    cell: ({ row }) => {
      const hireDate = row.original.employee.hireDate;
      return (
        <span className="text-sm text-muted-foreground">
          {formatDate(hireDate)}
        </span>
      );
    },
  },
  {
    accessorKey: 'payment.baseSalary',
    header: 'Haber Básico',
    cell: ({ row }) => {
      const baseSalary = row.original.payment.baseSalary;
      return (
        <span className="text-sm font-medium">
          {formatCurrency(baseSalary)}
        </span>
      );
    },
  },
  {
    accessorKey: 'payment.workedDays',
    header: 'Días Trabajados',
    cell: ({ row }) => {
      const workedDays = row.original.payment.workedDays;
      const workingDaysPerMonth =
        row.original.payment.workingDaysPerMonth || 30;
      return (
        <div className="text-center">
          <span className="text-sm font-medium">{workedDays}</span>
          <span className="text-xs text-muted-foreground block">
            de {workingDaysPerMonth}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: 'payment.basicEarnings',
    header: 'Sueldo Básico',
    cell: ({ row }) => {
      const basicEarnings = row.original.payment.basicEarnings;
      return (
        <span className="text-sm font-medium">
          {formatCurrency(basicEarnings)}
        </span>
      );
    },
  },
  {
    accessorKey: 'payment.seniorityBonus',
    header: 'Bono Antigüedad',
    cell: ({ row }) => {
      const seniorityYears = row.original.payment.seniorityYears;
      const seniorityBonus = row.original.payment.seniorityBonus;
      return (
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {formatCurrency(seniorityBonus)}
          </span>
          <span className="text-xs text-muted-foreground">
            {seniorityYears} {seniorityYears === 1 ? 'año' : 'años'}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: 'payment.otherBonuses',
    header: 'Otros Bonos',
    cell: ({ row }) => {
      const otherBonuses = row.original.payment.otherBonuses;
      return (
        <span className="text-sm font-medium text-green-600">
          {formatCurrency(otherBonuses)}
        </span>
      );
    },
  },
  {
    accessorKey: 'payment.totalEarnings',
    header: 'Total Ganado',
    cell: ({ row }) => {
      const totalEarnings = row.original.payment.totalEarnings;
      return (
        <span className="text-sm font-semibold text-green-700">
          {formatCurrency(totalEarnings)}
        </span>
      );
    },
  },
  {
    id: 'deductions-detail',
    header: 'Descuentos',
    cell: ({ row }) => {
      const deductions = row.original.payment.deductions || [];
      const deductionAfp = row.original.payment.deductionAfp;

      return (
        <div className="flex flex-col gap-0.5 min-w-[150px]">
          {/* AFP */}
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Gestora:</span>
            <span className="font-medium">{formatCurrency(deductionAfp)}</span>
          </div>

          {/* Otras deducciones */}
          {deductions.map((deduction, index) => (
            <div key={index} className="flex justify-between text-xs">
              <span className="text-muted-foreground">
                {deductionLabels[deduction.type] || deduction.type}:
              </span>
              <span className="font-medium">
                {formatCurrency(deduction.totalDeduction)}
              </span>
            </div>
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: 'payment.totalDeductions',
    header: 'Total Descuentos',
    cell: ({ row }) => {
      const totalDeductions = row.original.payment.totalDeductions;
      const deductionAfp = row.original.payment.deductionAfp;
      const totalWithAfp = totalDeductions + deductionAfp;
      return (
        <span className="text-sm font-semibold text-destructive">
          {formatCurrency(totalWithAfp)}
        </span>
      );
    },
  },
  {
    accessorKey: 'payment.netAmount',
    header: 'Líquido Pagable',
    cell: ({ row }) => {
      const netAmount = row.original.payment.netAmount;
      return (
        <span className="text-base font-bold text-green-600">
          {formatCurrency(netAmount)}
        </span>
      );
    },
  },
];
