import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { EmployeeInfo } from './components/EmployeeInfo';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PersonalInfo } from './components/PersonalInfo';
import { EmployeeDetailsTexts } from '@/constants/localize';
import { Card, CardContent } from '@/components/ui/card';
import { SalarySummary } from './components/SalarySummary';
import { AbsencePermissionSection } from './components/AbsencePermissionSection';
import type { EmployeeResponse } from '@/rest-client/interface/response/EmployeeResponse';
import { AdvanceSection } from './components/AdvanceSection';
import { VacationSection } from './components/VacationSection';
import { MemorandumSection } from './components/MemorandumSection';
import { EmployeeService } from '@/rest-client/services/EmployeeService';
import { SalaryEventsSection } from './components/SalaryEventsSection';
import { EmployeeDisassociationSection } from './components/EmployeeDisassociationSection';

const employeeService = new EmployeeService();

export function EmployeeDetailPage() {
  const { employeeId } = useParams();
  const [employee, setEmployee] = useState<EmployeeResponse | null>(null);

  const handleEmployeeUpdate = (updatedEmployee: EmployeeResponse) => {
    console.info('Employee updated:', updatedEmployee);
    handleReloadEmployee();
  };

  const handleReloadEmployee = () => {
    if (employeeId) {
      employeeService.getEmployeeById(employeeId).then((data) => {
        setEmployee(data);
      }).catch((error) => {
        console.error('Error reloading employee details:', error);
      });
    }
  }

  const tabItems = [
    {
      value: 'personal-info',
      label: EmployeeDetailsTexts.personalInfo,
      content: <PersonalInfo employeeId={employeeId!} />,
      disabled: false,
    },
    {
      value: 'salary',
      label: EmployeeDetailsTexts.salary,
      content: employee?.hireDate ? (
        <SalarySummary
          employeeId={employeeId!}
          isDisassociated={employee.isDisassociated}
        />
      ) : (
        <div className="text-red-600">Hire date not available.</div>
      ),
      disabled: false,
    },
    {
      value: 'memos',
      label: EmployeeDetailsTexts.memos,
      content: (
        <MemorandumSection
          employeeId={employeeId!}
          isDisassociated={employee?.isDisassociated}
        />
      ),
      disabled: false,
    },
    {
      value: 'permissions',
      label: EmployeeDetailsTexts.permissions,
      content: (
        <AbsencePermissionSection
          employeeId={employeeId!}
          isDisassociated={employee?.isDisassociated}
        />
      ),
      disabled: false,
    },
    {
      value: 'vacations',
      label: EmployeeDetailsTexts.vacations,
      content: (
        <VacationSection
          employeeId={employeeId!}
          isDisassociated={employee?.isDisassociated}
        />
      ),
      disabled: false,
    },
    {
      value: 'advances',
      label: EmployeeDetailsTexts.advances,
      content: (
        <AdvanceSection
          employeeId={employeeId!}
          isDisassociated={employee?.isDisassociated}
        />
      ),
      disabled: false,
    },
    {
      value: 'others',
      label: EmployeeDetailsTexts.others,
      content: (
        <SalaryEventsSection
          employeeId={employeeId!}
          isDisassociated={employee?.isDisassociated}
        />
      ),
      disabled: false,
    },
    {
      value: 'dismissal',
      label: EmployeeDetailsTexts.dismissal,
      content: (
        <EmployeeDisassociationSection
          employee={employee!}
          onDisassociate={handleEmployeeUpdate}
          onAssociate={handleEmployeeUpdate}
        />
      ),
      disabled: false,
    },
  ];

  useEffect(() => {
    const fetchEmployee = async () => {
      if (!employeeId) {
        console.error('Employee ID is required');
        return;
      }
      try {
        const response = await employeeService.getEmployeeById(employeeId);
        if (!response) {
          throw new Error('Employee not found');
        }
        const data: EmployeeResponse = response;
        setEmployee(data);
      } catch (error) {
        console.error('Error fetching employee details:', error);
      }
    };

    fetchEmployee();
  }, [employeeId]);

  if (!employeeId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-600">Employee ID is required.</p>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-600">Loading employee details...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <EmployeeInfo employee={employee} onEmployeeUpdate={handleEmployeeUpdate} />
      <Tabs defaultValue="personal-info" className="w-full">
        <TabsList className="w-full mb-2 flex justify-between">
          {tabItems.map(({ value, label, disabled }) => (
            <TabsTrigger
              key={value}
              value={value}
              className={`flex-1 ${
                disabled
                  ? 'opacity-50 cursor-not-allowed pointer-events-none'
                  : ''
              }`}
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabItems.map(({ value, content }) => (
          <TabsContent key={value} value={value}>
            <Card className="min-h-[530px]">
              <CardContent>{content}</CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
