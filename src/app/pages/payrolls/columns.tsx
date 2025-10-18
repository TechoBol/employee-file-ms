import type { PayrollEmployeeResponse } from '@/rest-client/interface/response/PayrollResponse';
import { Actions } from './Actions';
import type { ColumnDef } from '@tanstack/react-table';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
    minimumFractionDigits: 2,
  }).format(amount);
}

export const columns: ColumnDef<PayrollEmployeeResponse>[] = [
  {
    id: 'employee',
    header: () => <span className="pl-4">Empleado</span>,
    cell: ({ row }) => {
      const { firstName, lastName, ci } = row.original.employee;

      return (
        <section className="pl-4">
          <span className="font-medium">
            {firstName} {lastName}
          </span>
          <span className="block text-sm text-muted-foreground">CI: {ci}</span>
        </section>
      );
    },
  },
  {
    accessorKey: 'payroll.baseSalary',
    header: 'Salario Base',
    cell: ({ row }) => {
      const baseSalary = row.original.payroll.baseSalary;
      return (
        <span className="text-muted-foreground">
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
      return <span className="text-muted-foreground">{workedDays} días</span>;
    },
  },
  {
    accessorKey: 'payroll.seniorityYears',
    header: 'Antigüedad',
    cell: ({ row }) => {
      const seniorityYears = row.original.payroll.seniorityYears;
      const seniorityBonus = row.original.payroll.seniorityBonus;
      return (
        <div className="flex flex-col">
          <span className="text-sm text-muted-foreground">
            {seniorityYears} {seniorityYears === 1 ? 'año' : 'años'}
          </span>
          <span className="text-xs text-muted-foreground">
            Bono: {formatCurrency(seniorityBonus)}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: 'payroll.totalDeductions',
    header: 'Deducciones',
    cell: ({ row }) => {
      const totalDeductions = row.original.payroll.totalDeductions;
      const deductionAfp = row.original.payroll.deductionAfp;
      return (
        <div className="flex flex-col">
          <span className="text-sm text-destructive">
            {formatCurrency(totalDeductions)}
          </span>
          <span className="text-xs text-muted-foreground">
            AFP: {formatCurrency(deductionAfp)}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: 'payroll.totalAmount',
    header: 'Total Líquido',
    cell: ({ row }) => {
      const totalAmount = row.original.payroll.totalAmount;
      return (
        <span className="font-semibold text-green-600">
          {formatCurrency(totalAmount)}
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