import { Building2, RefreshCw } from 'lucide-react';
import { DataTable } from '@/app/shared/components/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PaymentByBranchResponse } from '@/rest-client/interface/response/PaymentResponse';
import type { ColumnDef } from '@tanstack/react-table';

interface PaymentBranchViewProps {
  data: PaymentByBranchResponse[];
  loading: boolean;
  columns: ColumnDef<any>[];
  deductionLabels: Record<string, string>;
  formatCurrency: (value: number) => string;
}

export function PaymentBranchView({
  data,
  loading,
  columns,
  deductionLabels,
  formatCurrency,
}: PaymentBranchViewProps) {
  if (loading) {
    return (
      <div className="text-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Cargando pagos agrupados...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center p-8 border rounded-xl">
        <p className="text-muted-foreground">No se encontraron sucursales con pagos</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {data.map((branch) => (
        <div key={branch.branchId} className="space-y-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">{branch.branchName}</h2>
            <span className="text-sm text-muted-foreground">
              ({branch.employeeCount} empleados)
            </span>
          </div>
          
          <div className="rounded-lg bg-card">
            <DataTable
              columns={columns}
              data={branch.payments || []}
              loading={false}
              showPagination={false}
              noResultsMessage="No se encontraron pagos"
              loadingMessage="Cargando pagos..."
            />
          </div>

          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg">Totales - {branch.branchName}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Bonos Antigüedad</p>
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(branch.totals.totalSeniorityBonuses)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Otros Bonos</p>
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(branch.totals.totalOtherBonuses)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Bonos</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(branch.totals.totalBonuses)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Ganado</p>
                  <p className="text-xl font-bold text-green-700">
                    {formatCurrency(branch.totals.totalEarnings)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Descuentos AFP</p>
                  <p className="text-lg font-semibold text-red-600">
                    {formatCurrency(branch.totals.totalAfpDeductions)}
                  </p>
                </div>
                {Object.entries(branch.totals.deductions).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      {deductionLabels[key] || key}
                    </p>
                    <p className="text-lg font-semibold text-red-600">
                      {formatCurrency(value)}
                    </p>
                  </div>
                ))}
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Descuentos</p>
                  <p className="text-xl font-bold text-destructive">
                    {formatCurrency(branch.totals.totalDeductions)}
                  </p>
                </div>
                <div className="space-y-1 md:col-span-2 lg:col-span-1">
                  <p className="text-sm text-muted-foreground">Total Líquido Pagable</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(branch.totals.netAmount)}
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground text-center">
                  {branch.employeeCount} empleados
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}