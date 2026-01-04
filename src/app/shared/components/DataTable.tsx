import { useMemo } from 'react';
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type PaginationState,
  type OnChangeFn,
} from '@tanstack/react-table';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DataTableTexts } from '@/constants/localize';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageCount?: number;
  pageIndex?: number;
  pageSize?: number;
  onPaginationChange?: OnChangeFn<PaginationState>;
  loading?: boolean;
  showPagination?: boolean;
  pageSizeOptions?: number[];
  noResultsMessage?: string;
  loadingMessage?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageCount = 0,
  pageIndex = 0,
  pageSize = 10,
  onPaginationChange,
  loading = false,
  showPagination = true,
  pageSizeOptions = [10, 20, 30, 40, 50],
  noResultsMessage = DataTableTexts.noResultsMessage,
  loadingMessage = DataTableTexts.loadingMessage,
}: DataTableProps<TData, TValue>) {
  const pagination = useMemo(
    () => ({
      pageIndex,
      pageSize,
    }),
    [pageIndex, pageSize]
  );

  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: {
      pagination,
    },
    onPaginationChange,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  const handlePageSizeChange = (newPageSize: string) => {
    onPaginationChange?.({
      pageIndex: 0,
      pageSize: Number(newPageSize),
    });
  };

  const handlePaginationClick = (newPageIndex: number) => {
    onPaginationChange?.({
      pageIndex: newPageIndex,
      pageSize,
    });
  };

  return (
    <div className="space-y-4">
      {/* Tabla */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta as { className?: string } | undefined;
                  return (
                    <TableHead key={header.id} className={meta?.className}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{loadingMessage}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => {
                    const meta = cell.column.columnDef.meta as { className?: string } | undefined;
                    return (
                      <TableCell key={cell.id} className={meta?.className}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {noResultsMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {showPagination && (
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">{DataTableTexts.rowsPerPage}</p>
            <Select
              value={`${pageSize}`}
              onValueChange={handlePageSizeChange}
              disabled={loading}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={`${size}`}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">
                {DataTableTexts.paginationTextTemplate
                  .replace('{{page}}', `${pageIndex + 1}`)
                  .replace('{{totalPages}}', `${pageCount}`)}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex bg-transparent"
                onClick={() => handlePaginationClick(0)}
                disabled={!table.getCanPreviousPage() || loading}
              >
                <span className="sr-only">{DataTableTexts.goToFirstPage}</span>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0 bg-transparent"
                onClick={() => handlePaginationClick(pageIndex - 1)}
                disabled={!table.getCanPreviousPage() || loading}
              >
                <span className="sr-only">
                  {DataTableTexts.goToPreviousPage}
                </span>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0 bg-transparent"
                onClick={() => handlePaginationClick(pageIndex + 1)}
                disabled={!table.getCanNextPage() || loading}
              >
                <span className="sr-only">{DataTableTexts.goToNextPage}</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex bg-transparent"
                onClick={() => handlePaginationClick(pageCount - 1)}
                disabled={!table.getCanNextPage() || loading}
              >
                <span className="sr-only">{DataTableTexts.goToLastPage}</span>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}