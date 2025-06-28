import { Button } from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';
import { useDataTable } from './hooks/userDataTable';
import type { User } from '@/app/shared/interfaces/user';
import { DataTable } from '@/app/shared/components/DataTable';
import { columns } from './columns';
import { SearchInput } from '@/app/shared/components/SearchInput';
import { EmployeePageTexts } from '@/constants/localize';

export default function EmployeesPage() {
  const {
    data,
    loading,
    error,
    pagination,
    pageCount,
    searchValue,
    setPagination,
    setSearchValue,
    refetch,
  } = useDataTable<User>({
    endpoint: '/api/users',
    initialPageSize: 10,
  });

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
    <div className="container mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {EmployeePageTexts.employees}
          </h1>
          <p className="text-muted-foreground">
            {EmployeePageTexts.manageEmployees}
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          {EmployeePageTexts.addEmployee}
        </Button>
      </div>

      <div className="flex flex-col space-y-4">
        <SearchInput
          value={searchValue}
          onChange={setSearchValue}
          placeholder={EmployeePageTexts.searchPlaceholder}
          disabled={loading}
          className="w-full sm:max-w-sm"
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
  );
}
