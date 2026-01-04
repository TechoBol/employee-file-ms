import { useNavigate } from 'react-router';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTableColumnsTexts } from '@/constants/localize';
import type { EmployeeResponse } from '@/rest-client/interface/response/EmployeeResponse';
import { ReusableDialog } from '@/app/shared/components/ReusableDialog';
import EmployeeForm from './EmployeeForm';
import { useEmployeeContext } from './hooks/useEmployeeContext';
import { useState } from 'react';

export function Actions({ employee }: { employee: EmployeeResponse }) {
  const navigate = useNavigate();
  const { onSave } = useEmployeeContext();
  const [dialogEditOpen, setDialogEditOpen] = useState(false);

  const handleViewDetails = () => {
    navigate(`/employees/${employee.id}`);
  };

  const handleSave = (updatedEmployee: EmployeeResponse) => {
    onSave(updatedEmployee);
    setDialogEditOpen(false);
  };

  const handleViewHistory = () => {
    navigate(`/employees/${employee.id}/history`);
  }

  return (
    <>
      <ReusableDialog
        title="Agregar Empleado"
        description="Completa los detalles del nuevo empleado"
        open={dialogEditOpen}
        onOpenChange={setDialogEditOpen}
        className="!max-w-[45rem]"
      >
        <EmployeeForm onSave={handleSave} employee={employee} />
      </ReusableDialog>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">{DataTableColumnsTexts.openMenu}</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{DataTableColumnsTexts.actions}</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => navigator.clipboard.writeText(employee.id)}
          >
            {DataTableColumnsTexts.copyId}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleViewDetails}>
            {DataTableColumnsTexts.viewDetails}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setDialogEditOpen(true)}>
            {DataTableColumnsTexts.editUser}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleViewHistory}>
            Ver Historial
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
