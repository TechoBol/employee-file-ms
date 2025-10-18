import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { PayrollEmployeeResponse } from "@/rest-client/interface/response/PayrollResponse";
import { Eye, MoreHorizontal } from "lucide-react";
import { useNavigate } from "react-router";

export function Actions({ payrollEmployee }: { payrollEmployee: PayrollEmployeeResponse }) {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate(`/payrolls/${payrollEmployee.employee.id}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Abrir menú</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => navigator.clipboard.writeText(payrollEmployee.employee.id)}
        >
          Copiar ID de empleado
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleViewDetails}>
          <Eye className="mr-2 h-4 w-4" />
          Ver detalles de nómina
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}