import { ReusableDialog } from '@/app/shared/components/ReusableDialog';
import { StatusBadge } from '@/app/shared/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { EmployeeDetailsTexts } from '@/constants/localize';
import { formatDateHireDate } from '@/lib/formatters';
import {
  Briefcase,
  Calendar,
  FileText,
  Mail,
  Phone,
  UserRound,
  Building2,
} from 'lucide-react';
import EmployeeForm from '../../employees/EmployeeForm';
import { useState, useEffect } from 'react';
import type { EmployeeResponse } from '@/rest-client/interface/response/EmployeeResponse';
import type { CompanyResponse } from '@/rest-client/interface/response/CompanyResponse';
import { useNavigate } from 'react-router';
import { EmployeeService } from '@/rest-client/services/EmployeeService';
import { CompanyService } from '@/rest-client/services/CompanyService';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';

export function EmployeeInfo({ 
  employee, 
  onEmployeeUpdate
}: { 
  employee: EmployeeResponse;
  onEmployeeUpdate: (updated: EmployeeResponse) => void;
}) {
  const { firstName, lastName, positionName, departmentName, hireDate, email } =
    employee;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [changeCompanyDialogOpen, setChangeCompanyDialogOpen] = useState(false);
  const [companies, setCompanies] = useState<CompanyResponse[]>([]);
  const [selectedCompany, setSelectedCompany] =
    useState<CompanyResponse | null>(null);
  const [reason, setReason] = useState<string>('');
  const [isChangingCompany, setIsChangingCompany] = useState(false);
  const navigate = useNavigate();

  const employeeService = new EmployeeService();
  const companyService = new CompanyService();

  useEffect(() => {
    if (changeCompanyDialogOpen) {
      loadCompanies();
    }
  }, [changeCompanyDialogOpen]);

  const loadCompanies = async () => {
    try {
      const companiesData = await companyService.getCompanies();
      setCompanies(companiesData);
    } catch (error) {
      toast.error('Error al cargar las compañías');
      console.error('Error loading companies:', error);
    }
  };

  const onSave = async (employee: EmployeeResponse) => {
    console.log('Edit Employee saved:', employee);
    onEmployeeUpdate(employee);
    setDialogOpen(false);
  };

  const handleViewHistory = () => {
    navigate(`/employees/${employee.id}/history`);
  };

  const handleChangeCompany = async () => {
    if (!selectedCompany) {
      toast.error('Por favor selecciona una compañía');
      return;
    }

    try {
      setIsChangingCompany(true);
      await employeeService.changeEmployeeCompany(employee.id, {
        newCompanyId: selectedCompany?.id ?? '',
        newCompanyName: selectedCompany?.name ?? '',
        reason: reason || undefined,
      });

      toast.success('Compañía cambiada exitosamente');
      setChangeCompanyDialogOpen(false);
      setSelectedCompany(null);
      setReason('');

      navigate(`/employees`);
    } catch (error) {
      toast.error('Error al cambiar de compañía');
      console.error('Error changing company:', error);
    } finally {
      setIsChangingCompany(false);
    }
  };

  return (
    <>
      <ReusableDialog
        title="Editar Empleado"
        description="Completa los detalles del empleado"
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        className="!max-w-[45rem]"
      >
        <EmployeeForm onSave={onSave} employee={employee} />
      </ReusableDialog>

      <ReusableDialog
        title="Cambiar Compañía"
        description="Selecciona la nueva compañía para este empleado"
        open={changeCompanyDialogOpen}
        onOpenChange={setChangeCompanyDialogOpen}
        className="!max-w-[30rem]"
      >
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="company">Nueva Compañía *</Label>
            <Select
              value={selectedCompany?.id ?? ''}
              onValueChange={(value) => {
                const company = companies.find((c) => c.id === value) || null;
                setSelectedCompany(company);
              }}
            >
              <SelectTrigger id="company">
                <SelectValue placeholder="Selecciona una compañía" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name} ({company.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 resize-none">
            <Label htmlFor="reason">Razón (Opcional)</Label>
            <Textarea
              id="reason"
              placeholder="Motivo del cambio de compañía..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {reason.length}/500 caracteres
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setChangeCompanyDialogOpen(false)}
              disabled={isChangingCompany}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleChangeCompany}
              disabled={isChangingCompany || !selectedCompany}
            >
              {isChangingCompany ? 'Cambiando...' : 'Cambiar Compañía'}
            </Button>
          </div>
        </div>
      </ReusableDialog>

      <Card className="w-full">
        <CardContent>
          <section className="flex justify-between items-center p-4 w-full">
            <section className="flex flex-col items-start gap-4">
              <span className="text-xl font-bold">
                {`${firstName.charAt(0).toUpperCase() + firstName.slice(1)} ${
                  lastName.charAt(0).toUpperCase() + lastName.slice(1)
                }`}
              </span>
              <span className="flex items-center gap-2">
                <Briefcase />
                {positionName?.charAt(0).toUpperCase() +
                  positionName?.slice(1) || 'No definido'}
                <span>|</span>
                {departmentName?.charAt(0).toUpperCase() +
                  departmentName?.slice(1) || 'No definido'}
                {employee.branchName && (
                  <>
                    <span>|</span>
                    {employee.branchName.charAt(0).toUpperCase() +
                      employee.branchName.slice(1)}
                  </>
                )}
              </span>
              <span className="flex items-center gap-2">
                <StatusBadge status={employee.status} />
                <span className="flex items-center gap-1">
                  <Calendar />
                  <span>
                    {`${EmployeeDetailsTexts.hiredOn}: ${formatDate(hireDate)}`}
                  </span>
                  <span>|</span>
                  <span>{formatDateHireDate(new Date(hireDate))}</span>
                </span>
              </span>
            </section>
            <section className="flex flex-col items-start gap-4">
              <span className="flex items-center gap-2">
                <Mail />
                <span>{email}</span>
              </span>
              <section className="flex items-center gap-8">
                <span className="flex items-center gap-2">
                  <Phone />
                  <span>{employee.phone || EmployeeDetailsTexts.noPhone}</span>
                </span>
                {employee.contractCompany && (
                  <span className="flex items-center gap-2">
                    <Building2 />
                    <span>{employee.contractCompany}</span>
                  </span>
                )}
              </section>
              <section className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(true)}>
                  <UserRound />
                  <span>{EmployeeDetailsTexts.edit}</span>
                </Button>
                <Button variant="outline" onClick={handleViewHistory}>
                  <FileText />
                  <span>Ver Historial</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setChangeCompanyDialogOpen(true)}
                >
                  <Building2 />
                  <span>Cambiar Compañía</span>
                </Button>
              </section>
            </section>
          </section>
        </CardContent>
      </Card>
    </>
  );
}
