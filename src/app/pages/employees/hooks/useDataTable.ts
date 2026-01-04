import { useState, useEffect, useCallback } from 'react';
import type { PaginationState, OnChangeFn } from '@tanstack/react-table';
import { ErrorTexts } from '@/constants/localize';
import { useConfigStore } from '@/app/shared/stores/useConfigStore';
import { EmployeeService } from '@/rest-client/services/EmployeeService';
import type { EmployeeSearchParams } from '@/rest-client/interface/request/EmployeeSearchParams';

interface UseDataTableReturn<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  pagination: PaginationState;
  pageCount: number;
  filters: EmployeeSearchParams;
  setData: (data: T[]) => void;
  setPagination: OnChangeFn<PaginationState>;
  setFilters: (filters: EmployeeSearchParams) => void;
  refetch: () => void;
}

const employeeService = new EmployeeService();

export function useDataTable<T>({
  endpoint,
  initialPageSize = 10,
  initialFilters = {},
  dependencies = [],
}: {
  endpoint: string;
  initialPageSize?: number;
  initialFilters?: EmployeeSearchParams;
  dependencies?: unknown[];
}): UseDataTableReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [filters, setFilters] = useState<EmployeeSearchParams>(initialFilters);
  const [pagination, setPaginationState] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  });
  const { companyId } = useConfigStore();

  const setPagination: OnChangeFn<PaginationState> = (updaterOrValue) => {
    setPaginationState((prev) => {
      const newValue =
        typeof updaterOrValue === 'function'
          ? updaterOrValue(prev)
          : updaterOrValue;
      return newValue;
    });
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (endpoint.includes('/employees')) {
        if (!companyId) {
          throw new Error('Company ID is required to fetch employees');
        }

        const result = await employeeService.getEmployees(
          pagination.pageIndex,
          pagination.pageSize,
          filters
        );

        setData(result.content as T[]);
        setPageCount(result.page.totalPages);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : ErrorTexts.genericError);
      setData([]);
      setPageCount(0);
    } finally {
      setLoading(false);
    }
  }, [
    endpoint,
    pagination.pageIndex,
    pagination.pageSize,
    filters,
    companyId,
    ...dependencies,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPaginationState({
      pageIndex: 0,
      pageSize: initialPageSize,
    });
  }, [companyId, initialPageSize]);

  const handleFiltersChange = useCallback((newFilters: EmployeeSearchParams) => {
    setFilters(newFilters);
    setPaginationState((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  return {
    data,
    loading,
    error,
    pagination,
    pageCount,
    filters,
    setData,
    setPagination,
    setFilters: handleFiltersChange,
    refetch: fetchData,
  };
}