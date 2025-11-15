import { ReusableDialog } from '@/app/shared/components/ReusableDialog';
import { StatusBadge } from '@/app/shared/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmployeeDetailsTexts } from '@/constants/localize';
import { formatDate, formatDateHireDate } from '@/lib/formatters';
import {
  Briefcase,
  Calendar,
  Download,
  Mail,
  Phone,
  UserRound,
} from 'lucide-react';
import EmployeeForm from '../../employees/EmployeeForm';
import { useState } from 'react';
import type { EmployeeResponse } from '@/rest-client/interface/response/EmployeeResponse';

export function EmployeeInfo({ employee }: { employee: EmployeeResponse }) {
  const { firstName, lastName, positionName, departmentName, hireDate, email } =
    employee;
  const [dialogOpen, setDialogOpen] = useState(false);

  const onSave = async (newUser: EmployeeResponse) => {
    console.log('Edit User saved:', newUser);
    setDialogOpen(false);
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
                {positionName.charAt(0).toUpperCase() + positionName.slice(1)}
                <span>|</span>
                {departmentName.charAt(0).toUpperCase() +
                  departmentName.slice(1)}
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
              <span className="flex items-center gap-2">
                <Phone />
                <span>{employee.phone || EmployeeDetailsTexts.noPhone}</span>
              </span>
              <section className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(true)}>
                  <UserRound />
                  <span>{EmployeeDetailsTexts.edit}</span>
                </Button>
                <Button variant="outline" disabled>
                  <Download />
                  <span>{EmployeeDetailsTexts.download}</span>
                </Button>
              </section>
            </section>
          </section>
        </CardContent>
      </Card>
    </>
  );
}
