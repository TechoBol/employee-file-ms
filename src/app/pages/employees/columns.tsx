import type { ColumnDef } from '@tanstack/react-table';
import type { User } from '@/app/shared/interfaces/user';
import { DataTableColumnsTexts } from '@/constants/localize';
import { formatDate, formatDateHireDate } from '@/lib/formatters';
import { Actions } from './Actions';

export const columns: ColumnDef<User>[] = [
  {
    id: 'fullName',
    header: () => (
      <span className="pl-4">{DataTableColumnsTexts.employee}</span>
    ),
    cell: ({ row }) => {
      const { firstName, lastName, hireDate } = row.original;
      const formattedDate = formatDate(hireDate, 'es-ES');

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
        </section>
      );
    },
  },
  {
    accessorKey: 'department',
    header: DataTableColumnsTexts.department,
    cell: ({ row }) => {
      const { department } = row.original;

      return <span className="text-muted-foreground">{department}</span>;
    },
  },
  {
    accessorKey: 'position',
    header: DataTableColumnsTexts.position,
    cell: ({ row }) => {
      const position = row.getValue('position') as string;
      return (
        <span className="text-muted-foreground">
          {position.charAt(0).toUpperCase() + position.slice(1)}
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
  {
    id: 'actions',
    header: DataTableColumnsTexts.actions,
    cell: ({ row }) => {
      const user = row.original;

      return <Actions user={user} />;
    },
  },
];
