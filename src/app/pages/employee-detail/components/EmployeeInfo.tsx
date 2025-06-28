import { StatusBadge } from '@/app/shared/components/StatusBadge';
import type { User } from '@/app/shared/interfaces/user';
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

export function EmployeeInfo({ user }: { user: User }) {
  const { firstName, lastName, position, department, hireDate, email } = user;

  return (
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
              {position.charAt(0).toUpperCase() + position.slice(1)}
              <span>|</span>
              {department.charAt(0).toUpperCase() + department.slice(1)}
            </span>
            <span className="flex items-center gap-2">
              <StatusBadge status="Active" color="green" />
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
              <span>{user.phone || EmployeeDetailsTexts.noPhone}</span>
            </span>
            <section className="flex items-center gap-2">
              <Button variant="outline">
                <UserRound />
                <span>{EmployeeDetailsTexts.edit}</span>
              </Button>
              <Button variant="outline">
                <Download />
                <span>{EmployeeDetailsTexts.download}</span>
              </Button>
            </section>
          </section>
        </section>
      </CardContent>
    </Card>
  );
}
