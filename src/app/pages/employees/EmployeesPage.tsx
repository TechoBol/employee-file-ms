import { Button } from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';
import { useDataTable } from './hooks/useDataTable';
import { DataTable } from '@/app/shared/components/DataTable';
import { columns } from './columns';
import { EmployeePageTexts } from '@/constants/localize';
import { ReusableDialog } from '@/app/shared/components/ReusableDialog';
import { useState } from 'react';
import EmployeeForm from './EmployeeForm';
import type { EmployeeResponse } from '@/rest-client/interface/response/EmployeeResponse';
import { EmployeeProvider } from './hooks/useEmployeeContext';
import { EmployeeFilters } from './EmployeeFilters';

export default function EmployeesPage() {
  const {
    data,
    loading,
    error,
    pagination,
    pageCount,
    filters,
    setData,
    setPagination,
    setFilters,
    refetch,
  } = useDataTable<EmployeeResponse>({
    endpoint: '/api/employees',
    initialPageSize: 10,
  });
  const [dialogOpen, setDialogOpen] = useState(false);

  const onSave = async (newEmployee: EmployeeResponse) => {
    console.log('New user saved:', newEmployee);
    setDialogOpen(false);
    const exists = data.some((item) => item.id === newEmployee.id);
    if (exists) {
      setData(
        data.map((item) => (item.id === newEmployee.id ? newEmployee : item))
      );
    } else {
      setData([newEmployee, ...data]);
    }
  };

  if (error) {
    console.error('Error fetching employees:', error);

    return (
      <div className="container mx-auto">
        <div className="text-center">
          <p className="text-destructive">Error: {error}</p>
          <Button onClick={refetch} className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" />
            {EmployeePageTexts.retry}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <EmployeeProvider value={{ onSave }}>
      <div className="container mx-auto">
        <ReusableDialog
          title="Agregar Empleado"
          description="Completa los detalles del nuevo empleado"
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          className="!max-w-[45rem]"
        >
          <EmployeeForm onSave={onSave} />
        </ReusableDialog>

        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {EmployeePageTexts.employees}
            </h1>
            <p className="text-muted-foreground">
              {EmployeePageTexts.manageEmployees}
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {EmployeePageTexts.addEmployee}
          </Button>
        </div>

        <div className="flex flex-col space-y-4">
          <EmployeeFilters
            filters={filters}
            onChange={setFilters}
            disabled={loading}
            debounceMs={1200}
            showDebounceIndicator={true}
          />

          <DataTable
            columns={columns}
            data={data}
            pageCount={pageCount}
            pageIndex={pagination.pageIndex}
            pageSize={pagination.pageSize}
            onPaginationChange={setPagination}
            loading={loading}
            showPagination={true}
            pageSizeOptions={[5, 10, 20, 50]}
            noResultsMessage={EmployeePageTexts.noEmployeesFound}
            loadingMessage={EmployeePageTexts.loadingEmployees}
          />
        </div>
      </div>
    </EmployeeProvider>
  );
}