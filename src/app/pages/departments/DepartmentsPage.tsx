import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, Plus, Pencil, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ReusableDialog } from '@/app/shared/components/ReusableDialog';
import DepartmentForm from './DepartmentForm';
import type { DepartmentResponse } from '@/rest-client/interface/response/DepartmentResponse';
import { DepartmentService } from '@/rest-client/services/DepartmentService';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const departmentService = new DepartmentService();

export function DepartmentsPage() {
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [filtered, setFiltered] = useState<DepartmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] =
    useState<DepartmentResponse | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] =
    useState<DepartmentResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      await departmentService.getDepartments().then((res) => {
        setDepartments(res);
        setFiltered(res);
        setError(null);
      });
    } catch (e) {
      setError(
        'Error loading departments' +
          (e instanceof Error ? `: ${e.message}` : '')
      );
      setDepartments([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  };

  const onSave = async (department: DepartmentResponse) => {
    if (editingDepartment) {
      setDepartments((prev) =>
        prev.map((d) => (d.id === department.id ? department : d))
      );
      setFiltered((prev) =>
        prev.map((d) => (d.id === department.id ? department : d))
      );
    } else {
      setDepartments((prev) => [department, ...prev]);
      setFiltered((prev) => [department, ...prev]);
    }
    setDialogOpen(false);
    setEditingDepartment(null);
  };

  const handleEdit = (department: DepartmentResponse) => {
    setEditingDepartment(department);
    setDialogOpen(true);
  };

  const handleDeleteClick = (department: DepartmentResponse) => {
    setDepartmentToDelete(department);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!departmentToDelete) return;

    try {
      setDeleting(true);
      await departmentService.deleteDepartment(departmentToDelete.id);

      setDepartments((prev) =>
        prev.filter((d) => d.id !== departmentToDelete.id)
      );
      setFiltered((prev) => prev.filter((d) => d.id !== departmentToDelete.id));

      toast.success('Departamento eliminado', {
        description: (
          <p className="text-slate-700 select-none">
            {`${departmentToDelete.name} fue eliminado correctamente`}
          </p>
        ),
      });
    } catch (error) {
      console.error('Error al eliminar departamento:', error);
      toast.error('Error al eliminar', {
        description: (
          <p className="text-slate-700 select-none">
            No se pudo eliminar el departamento
          </p>
        ),
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setDepartmentToDelete(null);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingDepartment(null);
    }
  };

  useEffect(() => {
    const query = search.trim().toLowerCase();
    setFiltered(
      departments.filter((d) => d.name.toLowerCase().includes(query))
    );
  }, [search, departments]);

  useEffect(() => {
    fetchDepartments();
  }, []);

  return (
    <div className="container mx-auto">
      <ReusableDialog
        title={
          editingDepartment ? 'Editar departamento' : 'Agregar departamento'
        }
        description={
          editingDepartment
            ? 'Modifica los detalles del departamento'
            : 'Completa los detalles del nuevo departamento'
        }
        open={dialogOpen}
        onOpenChange={handleDialogClose}
      >
        <DepartmentForm onSave={onSave} department={editingDepartment} />
      </ReusableDialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El departamento{' '}
              <span className="font-semibold">{departmentToDelete?.name}</span>{' '}
              será eliminado permanentemente. Ademas ningun empleado debe
              pertenecer a este departmento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive/85 text-destructive-foreground hover:bg-destructive text-slate-100"
            >
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Departamentos</h1>
          <p className="text-muted-foreground">Gestiona los departamentos</p>
        </div>
        <Button
          onClick={() => {
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Agregar departamento
        </Button>
      </div>

      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar departamento..."
        disabled={loading}
        className="w-full sm:max-w-sm mb-4"
      />

      {loading && (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-md" />
          ))}
        </div>
      )}

      {error && (
        <div className="text-center text-destructive mt-4">
          <p>{error}</p>
          <Button onClick={fetchDepartments} className="mt-2">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <p className="text-muted-foreground">
          No se encontraron departamentos.
        </p>
      )}

      {!loading && !error && (
        <ul className="space-y-2">
          {filtered.map((dept) => (
            <li
              key={dept.id}
              className="p-4 bg-card rounded-md shadow-sm flex items-start justify-between gap-4"
            >
              <div className="flex-1">
                <p className="font-medium">{dept.name}</p>
                <p className="text-sm text-muted-foreground">
                  {dept.description || 'Sin descripción'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(dept)}
                  title="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteClick(dept)}
                  title="Eliminar"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
