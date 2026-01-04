import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import type { GroupedHistoryRow } from './EmployeeHistoryPage';

const getChangeTypeBadge = (changeType: string) => {
  const variants: Record<string, { className: string; label: string }> = {
    CREATE: {
      className: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
      label: 'Creado',
    },
    UPDATE: {
      className: 'bg-amber-100 text-amber-800 hover:bg-amber-200',
      label: 'Actualizado',
    },
    DELETE: {
      className: 'bg-red-100 text-red-800 hover:bg-red-200',
      label: 'Eliminado',
    },
    DISASSOCIATE: {
      className: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
      label: 'Desvinculado',
    },
    ASSOCIATE: {
      className: 'bg-green-100 text-green-800 hover:bg-green-200',
      label: 'Asociado',
    },
    COMPANY_CHANGE: {
      className: 'bg-teal-100 text-teal-800 hover:bg-teal-200',
      label: 'Cambio de Empresa',
    },
  };

  const config = variants[changeType] || {
    className: 'bg-gray-100 text-gray-800',
    label: changeType,
  };

  return (
    <Badge className={`whitespace-nowrap ${config.className}`}>
      {config.label}
    </Badge>
  );
};

const getChangedByBadge = (changedBy: string) => {
  if (changedBy === 'UNKNOWN' || changedBy === 'Unknown User') {
    return (
      <Badge className="whitespace-nowrap bg-white text-gray-600 border border-gray-300">
        Desconocido
      </Badge>
    );
  }

  return (
    <Badge className="whitespace-nowrap bg-slate-100 text-slate-800 hover:bg-slate-200">
      {changedBy}
    </Badge>
  );
};

const formatFieldName = (fieldName: string): string => {
  const fieldMap: Record<string, string> = {
    ci: 'CI',
    firstName: 'Nombre',
    lastName: 'Apellido',
    email: 'Email',
    phone: 'Teléfono',
    address: 'Dirección',
    birthDate: 'Fecha de Nacimiento',
    hireDate: 'Fecha de Contratación',
    status: 'Estado',
    type: 'Tipo',
    branchId: 'Sucursal',
    positionId: 'Posición',
    salary: 'Salario',
    emergencyContact: 'Contacto de Emergencia',
  };

  return fieldMap[fieldName] || fieldName;
};

const formatDateTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return dateString;
  }
};

export const historyColumns: ColumnDef<GroupedHistoryRow>[] = [
  {
    accessorKey: 'changeDate',
    header: 'Fecha y Hora',
    cell: ({ row }) => {
      const date = row.getValue('changeDate') as string;
      return (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {formatDateTime(date)}
        </span>
      );
    },
    meta: {
      className: 'border-r border-gray-300',
    },
  },
  {
    accessorKey: 'changeType',
    header: 'Tipo de Cambio',
    cell: ({ row }) => {
      const changeType = row.getValue('changeType') as string;
      return getChangeTypeBadge(changeType);
    },
    meta: {
      className: 'border-r border-gray-300',
    },
  },
  {
    accessorKey: 'changedBy',
    header: 'Modificado Por',
    cell: ({ row }) => {
      const changedBy = row.getValue('changedBy') as string;
      return getChangedByBadge(changedBy);
    },
    meta: {
      className: 'border-r border-gray-300',
    },
  },
  {
    accessorKey: 'changes',
    header: 'Campos Modificados',
    cell: ({ row }) => {
      const changes = row.getValue('changes') as Array<{
        fieldName: string;
        oldValue: string | null;
        newValue: string | null;
      }>;
      const changeType = row.getValue('changeType') as string;

      if (
        !changes ||
        changes.length === 0 ||
        changeType === 'ASSOCIATE' ||
        changeType === 'REACTIVATE'
      ) {
        return <span className="text-sm text-muted-foreground">-</span>;
      }

      return (
        <div className="space-y-2 py-2">
          {changes.map((change, index) => (
            <div key={index}>
              <div className="py-1">
                <div className="text-sm font-medium text-gray-900 mb-1">
                  {formatFieldName(change.fieldName)}
                </div>
                <div className="flex flex-col gap-1 text-xs">
                  <div className="break-words">
                    <span className="text-muted-foreground font-medium">
                      Anterior:{' '}
                    </span>
                    <span className="text-red-600 break-all">
                      {change.oldValue || '-'}
                    </span>
                  </div>
                  <div className="break-words">
                    <span className="text-muted-foreground font-medium">
                      Nuevo:{' '}
                    </span>
                    <span className="text-green-600 break-all">
                      {change.newValue || '-'}
                    </span>
                  </div>
                </div>
              </div>
              {index < changes.length - 1 && (
                <div className="border-t border-gray-200 my-2" />
              )}
            </div>
          ))}
        </div>
      );
    },
    meta: {
      className: 'border-r border-gray-300',
    },
  },
  {
    accessorKey: 'description',
    header: 'Descripción',
    cell: ({ row }) => {
      const description = row.getValue('description') as string | null;
      return (
        <span className="text-sm text-muted-foreground whitespace-normal break-words">
          {description || '-'}
        </span>
      );
    },
    meta: {
      className: 'max-w-xs',
    },
  },
];
