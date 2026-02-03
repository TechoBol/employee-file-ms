import { Search, X, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useEffect, useState } from 'react';
import { useDebouncedValue } from '@/app/shared/hooks/useDebouncedValue';
import { BranchService } from '@/rest-client/services/BranchService';
import { PositionService } from '@/rest-client/services/PositionService';
import type { BranchResponse } from '@/rest-client/interface/response/BranchResponse';
import type { PositionResponse } from '@/rest-client/interface/response/PositionResponse';
import type { EmployeeSearchParams } from '@/rest-client/interface/request/EmployeeSearchParams';

interface EmployeeFiltersProps {
  filters: EmployeeSearchParams;
  onChange: (filters: EmployeeSearchParams) => void;
  disabled?: boolean;
  className?: string;
  debounceMs?: number;
  showDebounceIndicator?: boolean;
}

const branchService = new BranchService();
const positionService = new PositionService();

const EMPLOYEE_TYPES = [
  { value: 'CONSULTANT', label: 'Consultor' },
  { value: 'FULL_TIME', label: 'Planilla' },
] as const;

const ASSOCIATION_STATUS = [
  { value: 'all', label: 'Todos los empleados' },
  { value: 'false', label: 'Activos' },
  { value: 'true', label: 'Desvinculados' },
] as const;

export function EmployeeFilters({
  filters,
  onChange,
  disabled = false,
  className = '',
  debounceMs = 800,
  showDebounceIndicator = true,
}: EmployeeFiltersProps) {
  const [localSearch, setLocalSearch] = useState(filters.search || '');
  const [localCi, setLocalCi] = useState(filters.ci || '');
  const [localEmail, setLocalEmail] = useState(filters.email || '');
  const [localPhone, setLocalPhone] = useState(filters.phone || '');
  const [isDebouncing, setIsDebouncing] = useState(false);

  const debouncedSearch = useDebouncedValue(localSearch, debounceMs);
  const debouncedCi = useDebouncedValue(localCi, debounceMs);
  const debouncedEmail = useDebouncedValue(localEmail, debounceMs);
  const debouncedPhone = useDebouncedValue(localPhone, debounceMs);

  const [branches, setBranches] = useState<BranchResponse[]>([]);
  const [positions, setPositions] = useState<PositionResponse[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [loadingPositions, setLoadingPositions] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [branchesData, positionsData] = await Promise.all([
          branchService.getBranches(),
          positionService.getPositions(),
        ]);
        setBranches(branchesData);
        setPositions(positionsData);
      } catch (error) {
        console.error('Error loading filter data:', error);
      } finally {
        setLoadingBranches(false);
        setLoadingPositions(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    setLocalSearch(filters.search || '');
    setLocalCi(filters.ci || '');
    setLocalEmail(filters.email || '');
    setLocalPhone(filters.phone || '');
  }, [filters]);

  useEffect(() => {
    setIsDebouncing(false);
    onChange({
      ...filters,
      search: debouncedSearch || undefined,
      ci: debouncedCi || undefined,
      email: debouncedEmail || undefined,
      phone: debouncedPhone || undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, debouncedCi, debouncedEmail, debouncedPhone]);

  useEffect(() => {
    if (
      localSearch !== debouncedSearch ||
      localCi !== debouncedCi ||
      localEmail !== debouncedEmail ||
      localPhone !== debouncedPhone
    ) {
      setIsDebouncing(true);
    }
  }, [
    localSearch,
    localCi,
    localEmail,
    localPhone,
    debouncedSearch,
    debouncedCi,
    debouncedEmail,
    debouncedPhone,
  ]);

  const handleTypeChange = (value: string) => {
    const newFilters = {
      ...filters,
      search: debouncedSearch || undefined,
      ci: debouncedCi || undefined,
      email: debouncedEmail || undefined,
      phone: debouncedPhone || undefined,
      type: value === 'all' ? undefined : value,
    };
    onChange(newFilters);
  };

  const handleAssociationStatusChange = (value: string) => {
    const newFilters = {
      ...filters,
      search: debouncedSearch || undefined,
      ci: debouncedCi || undefined,
      email: debouncedEmail || undefined,
      phone: debouncedPhone || undefined,
      isDisassociated: value === 'all' ? undefined : value === 'true',
    };
    onChange(newFilters);
  };

  const handleBranchChange = (value: string) => {
    const newFilters = {
      ...filters,
      search: debouncedSearch || undefined,
      ci: debouncedCi || undefined,
      email: debouncedEmail || undefined,
      phone: debouncedPhone || undefined,
      branchId: value === 'all' ? undefined : value,
    };
    onChange(newFilters);
  };

  const handlePositionChange = (value: string) => {
    const newFilters = {
      ...filters,
      search: debouncedSearch || undefined,
      ci: debouncedCi || undefined,
      email: debouncedEmail || undefined,
      phone: debouncedPhone || undefined,
      positionId: value === 'all' ? undefined : value,
    };
    onChange(newFilters);
  };

  const clearAllFilters = () => {
    setLocalSearch('');
    setLocalCi('');
    setLocalEmail('');
    setLocalPhone('');
    onChange({});
  };

  const hasActiveFilters =
    localSearch ||
    localCi ||
    localEmail ||
    localPhone ||
    filters.type ||
    filters.isDisassociated !== undefined ||
    filters.branchId ||
    filters.positionId;

  const getAssociationStatusValue = () => {
    if (filters.isDisassociated === undefined) return 'all';
    return filters.isDisassociated ? 'true' : 'false';
  };

  return (
    <div className={`flex flex-col sm:flex-row gap-2 ${className}`}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar por nombre..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          disabled={disabled}
          className="pl-9"
        />
        {showDebounceIndicator && isDebouncing && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            Buscando...
          </span>
        )}
      </div>

      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="relative">
            <Filter className="mr-2 h-4 w-4" />
            Filtros
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary" />
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto p-4">
          <SheetHeader>
            <SheetTitle>Filtros de búsqueda</SheetTitle>
            <SheetDescription>
              Filtra empleados por diferentes criterios
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 py-6">
            <div className="space-y-2">
              <Label htmlFor="association-status">Estado de Empleado</Label>
              <Select
                value={getAssociationStatusValue()}
                onValueChange={handleAssociationStatusChange}
                disabled={disabled}
              >
                <SelectTrigger id="association-status">
                  <SelectValue placeholder="Selecciona un estado" />
                </SelectTrigger>
                <SelectContent>
                  {ASSOCIATION_STATUS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ci">Cédula de Identidad</Label>
              <div className="relative">
                <Input
                  id="ci"
                  type="text"
                  placeholder="Ej: 12345678"
                  value={localCi}
                  onChange={(e) => setLocalCi(e.target.value)}
                  disabled={disabled}
                />
                {localCi && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
                    onClick={() => setLocalCi('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={localEmail}
                  onChange={(e) => setLocalEmail(e.target.value)}
                  disabled={disabled}
                />
                {localEmail && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
                    onClick={() => setLocalEmail('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <div className="relative">
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Ej: 71234567"
                  value={localPhone}
                  onChange={(e) => setLocalPhone(e.target.value)}
                  disabled={disabled}
                />
                {localPhone && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
                    onClick={() => setLocalPhone('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Empleado</Label>
              <Select
                value={filters.type || 'all'}
                onValueChange={handleTypeChange}
                disabled={disabled}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {EMPLOYEE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="branch">Sucursal</Label>
              <Select
                value={filters.branchId || 'all'}
                onValueChange={handleBranchChange}
                disabled={disabled || loadingBranches}
              >
                <SelectTrigger id="branch">
                  <SelectValue
                    placeholder={
                      loadingBranches
                        ? 'Cargando...'
                        : 'Selecciona una sucursal'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Cargo</Label>
              <Select
                value={filters.positionId || 'all'}
                onValueChange={handlePositionChange}
                disabled={disabled || loadingPositions}
              >
                <SelectTrigger id="position">
                  <SelectValue
                    placeholder={
                      loadingPositions ? 'Cargando...' : 'Selecciona un cargo'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {positions.map((position) => (
                    <SelectItem key={position.id} value={position.id}>
                      {position.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <Button
                variant="outline"
                className="w-full"
                onClick={clearAllFilters}
                disabled={disabled}
              >
                <X className="mr-2 h-4 w-4" />
                Limpiar todos los filtros
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAllFilters}
          disabled={disabled}
          className="hidden sm:flex"
        >
          <X className="mr-2 h-4 w-4" />
          Limpiar
        </Button>
      )}
    </div>
  );
}