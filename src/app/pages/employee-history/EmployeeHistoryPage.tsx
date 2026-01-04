import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, ArrowLeft } from 'lucide-react';
import { DataTable } from '@/app/shared/components/DataTable';
import { EmployeeHistoryService } from '@/rest-client/services/EmployeeHistoryService';
import type {
  EmployeeHistoryResponse,
} from '@/rest-client/interface/response/EmployeeHistoryResponse';
import { historyColumns } from './columns';
import { useParams } from 'react-router';

const employeeHistoryService = new EmployeeHistoryService();
export interface GroupedHistoryRow {
  id: string;
  changeDate: string;
  changeType: string;
  changedBy: string;
  changes: Array<{
    fieldName: string;
    oldValue: string | null;
    newValue: string | null;
  }>;
  description: string | null;
}

const groupHistoryData = (
  historyData: EmployeeHistoryResponse[]
): GroupedHistoryRow[] => {
  return historyData.map((record) => {
    const changes: Array<{
      fieldName: string;
      oldValue: string | null;
      newValue: string | null;
    }> = [];

    if (record.changes && Object.keys(record.changes).length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      Object.entries(record.changes).forEach(([_, change]) => {
        changes.push({
          fieldName: change.fieldName,
          oldValue: change.oldValue ? String(change.oldValue) : null,
          newValue: change.newValue ? String(change.newValue) : null,
        });
      });
    }

    return {
      id: record.id,
      changeDate: record.changedAt,
      changeType: record.changeType,
      changedBy: record.changedBy,
      changes: changes.length > 0 ? changes : [],
      description: record.reason,
    };
  });
};

export default function EmployeeHistoryPage() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const [data, setData] = useState<GroupedHistoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [pageCount, setPageCount] = useState(0);

  const fetchHistory = async () => {
    if (!employeeId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await employeeHistoryService.getEmployeeHistory(
        employeeId,
        pageIndex,
        pageSize
      );

      const groupedData = groupHistoryData(response.content);
      setData(groupedData);
      setPageCount(response.page.totalPages);
    } catch (err) {
      console.error('Error fetching employee history:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Error al cargar el historial del empleado'
      );
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [employeeId, pageIndex, pageSize]);

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center p-8 border rounded-xl bg-destructive/5">
          <p className="text-destructive mb-4 font-medium">Error: {error}</p>
          <Button onClick={fetchHistory} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">
              Historial del Empleado
            </h1>
          </div>
          <p className="text-muted-foreground ml-12">
            Visualiza todos los cambios realizados en el empleado
          </p>
        </div>
        <Button
          onClick={fetchHistory}
          variant="outline"
          size="icon"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div>
        <DataTable
          columns={historyColumns}
          data={data}
          pageCount={pageCount}
          pageIndex={pageIndex}
          pageSize={pageSize}
          onPaginationChange={(updater) => {
            const newPagination =
              typeof updater === 'function'
                ? updater({ pageIndex, pageSize })
                : updater;
            setPageIndex(newPagination.pageIndex);
            setPageSize(newPagination.pageSize);
          }}
          loading={loading}
          showPagination={true}
          pageSizeOptions={[5, 10, 20, 50]}
          noResultsMessage="No se encontró historial para este empleado"
          loadingMessage="Cargando historial..."
        />
      </div>
    </div>
  );
}