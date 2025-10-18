import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DataTable } from '@/app/shared/components/DataTable';
import { SearchInput } from '@/app/shared/components/SearchInput';
import { PayrollService } from '@/rest-client/services/PayrollService';
import type { PayrollEmployeeResponse } from '@/rest-client/interface/response/PayrollResponse';
import type { PaginationState } from '@tanstack/react-table';
import { columns } from './columns';

const payrollService = new PayrollService();

export default function PayrollsPage() {
  const [data, setData] = useState<PayrollEmployeeResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [pageCount, setPageCount] = useState(0);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const fetchPayrolls = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await payrollService.getPayrolls(
        pagination.pageIndex,
        pagination.pageSize
      );

      setData(result.content);
      setPageCount(result.page.totalPages);
    } catch (err) {
      console.error('Error fetching payrolls:', err);
      setError(
        err instanceof Error ? err.message : 'Error al cargar las nóminas'
      );
      setData([]);
      setPageCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrolls();
  }, [pagination.pageIndex, pagination.pageSize, searchValue]);

  const handleSearchChange = (search: string) => {
    setSearchValue(search);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  if (error) {
    return (
      <div className="container mx-auto">
        <div className="text-center">
          <p className="text-destructive">Error: {error}</p>
          <Button onClick={fetchPayrolls} className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nóminas</h1>
          <p className="text-muted-foreground">
            Gestiona y visualiza las nóminas de los empleados
          </p>
        </div>
      </div>

      <div className="flex flex-col space-y-4">
        <SearchInput
          value={searchValue}
          onChange={handleSearchChange}
          placeholder="Buscar por nombre, CI o email..."
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
          noResultsMessage="No se encontraron nóminas"
          loadingMessage="Cargando nóminas..."
        />
      </div>
    </div>
  );
}
