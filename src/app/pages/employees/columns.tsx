import type { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnsTexts } from '@/constants/localize';
import { formatDateHireDate } from '@/lib/formatters';
import { Actions } from './Actions';
import type { EmployeeResponse } from '@/rest-client/interface/response/EmployeeResponse';
import { formatDate } from '@/lib/utils';

export const columns: ColumnDef<EmployeeResponse>[] = [
  {
    id: 'fullName',
    header: () => (
      <span className="pl-4">{DataTableColumnsTexts.employee}</span>
    ),
    cell: ({ row }) => {
      const { firstName, lastName, hireDate, branchName, contractCompany } = row.original;
      const formattedDate = formatDate(hireDate);
      return (
        <section className="pl-4">
          <span className="font-medium">
            {firstName} {lastName}
          </span>
          <span className="block">
            {DataTableColumnsTexts.hiredOn}
            <span className="text-sm text-muted-foreground">
              {formattedDate}
            </span>
          </span>
          <span className="block">
            <span className="text-sm font-medium">
              {branchName ?? 'Sucursal No definida'}
            </span>
            {contractCompany && (
              <>
                <span className="text-sm"> | </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-600 text-zinc-100`}
                >
                  {contractCompany}
                </span>
              </>
            )}
          </span>
        </section>
      );
    },
  },
  {
    accessorKey: 'status',
    header: DataTableColumnsTexts.status,
    cell: ({ row }) => {
      const isActive = row.getValue('status') === 'ACTIVE';
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-orange-100 text-orange-500'
          }`}
        >
          {isActive ? 'Activo' : 'Inactivo'}
        </span>
      );
    },
  },
  {
    accessorKey: 'departmentName',
    header: DataTableColumnsTexts.department,
    cell: ({ row }) => {
      const { departmentName } = row.original;

      return (
        <span className="text-muted-foreground">
          {departmentName ?? 'No definido'}
        </span>
      );
    },
  },
  {
    accessorKey: 'positionName',
    header: DataTableColumnsTexts.position,
    cell: ({ row }) => {
      const position =
        (row.getValue('positionName') as string) ?? 'No definido';
      return (
        <span className="text-muted-foreground">
          {position?.charAt(0).toUpperCase() + position?.slice(1)}
        </span>
      );
    },
  },
  {
    accessorKey: 'contact',
    header: DataTableColumnsTexts.contact,
    cell: ({ row }) => {
      const { email, phone } = row.original;

      return (
        <span className="flex flex-col">
          <span className="text-sm text-muted-foreground">{email}</span>
          <span className="text-sm text-muted-foreground">{phone}</span>
        </span>
      );
    },
  },
  {
    accessorKey: 'seniority',
    header: DataTableColumnsTexts.seniority,
    cell: ({ row }) => {
      const { hireDate } = row.original;
      const formattedHireDate = formatDateHireDate(new Date(hireDate));

      return (
        <span className="text-sm text-muted-foreground">
          {formattedHireDate}
        </span>
      );
    },
  },
  // {
  //   accessorKey: 'contractCompany',
  //   header: 'Contrato',
  //   cell: ({ row }) => {
  //     const { contractCompany } = row.original;

  //     return (
  //       <span className="text-sm text-muted-foreground">
  //         {contractCompany ?? 'No definido'}
  //       </span>
  //     );
  //   },
  // },
  {
    id: 'actions',
    header: DataTableColumnsTexts.actions,
    cell: ({ row }) => {
      const employee = row.original;

      return <Actions employee={employee} />;
    },
  },
];
