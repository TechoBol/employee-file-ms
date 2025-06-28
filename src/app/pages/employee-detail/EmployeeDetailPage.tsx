import { fetchUserById } from '@/app/shared/data/mockUser';
import type { User } from '@/app/shared/interfaces/user';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { EmployeeInfo } from './components/EmployeeInfo';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PersonalInfo } from './components/PersonalInfo';
import { EmployeeDetailsTexts } from '@/constants/localize';
import { Card, CardContent } from '@/components/ui/card';
import { NotPageYet } from './components/NotPageYet';
import { Memorandum } from './components/Memorandum';

export function EmployeeDetailPage() {
  const { employeeId } = useParams();
  const [employee, setEmployee] = useState<User | null>(null);

  const tabItems = [
    {
      value: 'personal-info',
      label: EmployeeDetailsTexts.personalInfo,
      content: <PersonalInfo />,
    },
    {
      value: 'salary',
      label: EmployeeDetailsTexts.salary,
      content: <NotPageYet />,
    },
    {
      value: 'memos',
      label: EmployeeDetailsTexts.memos,
      content: <Memorandum />,
    },
    {
      value: 'permissions',
      label: EmployeeDetailsTexts.permissions,
      content: <NotPageYet />,
    },
    {
      value: 'vacations',
      label: EmployeeDetailsTexts.vacations,
      content: <NotPageYet />,
    },
    {
      value: 'subsidies',
      label: EmployeeDetailsTexts.subsidies,
      content: <NotPageYet />,
    },
    {
      value: 'dismissal',
      label: EmployeeDetailsTexts.dismissal,
      content: <NotPageYet />,
    },
  ];

  useEffect(() => {
    const fetchEmployee = async () => {
      if (!employeeId) {
        console.error('Employee ID is required');
        return;
      }
      try {
        const response = await fetchUserById(employeeId);
        if (!response) {
          throw new Error('Employee not found');
        }
        const data: User = await response;
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
      <EmployeeInfo user={employee} />
      <Tabs defaultValue="personal-info" className="w-full">
        <TabsList className="w-full mb-2 flex justify-between">
          {tabItems.map(({ value, label }) => (
            <TabsTrigger key={value} value={value} className="flex-1">
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
