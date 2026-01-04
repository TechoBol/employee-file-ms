import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, RefreshCw, Pencil, Trash2 } from 'lucide-react';
import type { BranchResponse } from '@/rest-client/interface/response/BranchResponse';
import { ReusableDialog } from '@/app/shared/components/ReusableDialog';
import BranchForm from './BranchForm';
import { BranchService } from '@/rest-client/services/BranchService';
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

const branchService = new BranchService();

export function BranchesPage() {
  const [branches, setBranches] = useState<BranchResponse[]>([]);
  const [filtered, setFiltered] = useState<BranchResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchResponse | null>(
    null
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState<BranchResponse | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      await branchService.getBranches().then((res) => {
        setBranches(res);
        setFiltered(res);
        setError(null);
      });
    } catch (e) {
      setError(
        'Error loading branches' + (e instanceof Error ? `: ${e.message}` : '')
      );
      setBranches([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  };

  const onSave = async (branch: BranchResponse) => {
    if (editingBranch) {
      setBranches((prev) => prev.map((b) => (b.id === branch.id ? branch : b)));
      setFiltered((prev) => prev.map((b) => (b.id === branch.id ? branch : b)));
    } else {
      setBranches((prev) => [branch, ...prev]);
      setFiltered((prev) => [branch, ...prev]);
    }
    setDialogOpen(false);
    setEditingBranch(null);
  };

  const handleEdit = (branch: BranchResponse) => {
    setEditingBranch(branch);
    setDialogOpen(true);
  };

  const handleDeleteClick = (branch: BranchResponse) => {
    setBranchToDelete(branch);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!branchToDelete) return;

    try {
      setDeleting(true);
      await branchService.deleteBranch(branchToDelete.id);

      setBranches((prev) => prev.filter((b) => b.id !== branchToDelete.id));
      setFiltered((prev) => prev.filter((b) => b.id !== branchToDelete.id));

      toast.success('Sucursal eliminada', {
        description: (
          <p className="text-slate-700 select-none">{`${branchToDelete.name} fue eliminada correctamente`}</p>
        ),
      });
    } catch (error) {
      console.error('Error al eliminar sucursal:', error);
      toast.error('Error al eliminar', {
        description: (
          <p className="text-slate-700 select-none">
            No se pudo eliminar la sucursal
          </p>
        ),
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setBranchToDelete(null);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingBranch(null);
    }
  };

  useEffect(() => {
    const query = search.trim().toLowerCase();
    setFiltered(
      branches.filter(
        (b) =>
          b.name.toLowerCase().includes(query) ||
          b.city.toLowerCase().includes(query) ||
          b.country.toLowerCase().includes(query)
      )
    );
  }, [search, branches]);

  useEffect(() => {
    fetchBranches();
  }, []);

  return (
    <div className="container mx-auto">
      <ReusableDialog
        title={editingBranch ? 'Editar sucursal' : 'Agregar sucursal'}
        description={
          editingBranch
            ? 'Modifica los detalles de la sucursal'
            : 'Completa los detalles de la nueva sucursal'
        }
        open={dialogOpen}
        onOpenChange={handleDialogClose}
      >
        <BranchForm onSave={onSave} branch={editingBranch} />
      </ReusableDialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La sucursal{' '}
              <span className="font-semibold">{branchToDelete?.name}</span> será
              eliminada permanentemente. Ademas ningun empleado debe estar
              asociado a esta sucursal.
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
          <h1 className="text-3xl font-bold tracking-tight">Sucursales</h1>
          <p className="text-muted-foreground">Gestiona las sucursales</p>
        </div>
        <Button
          onClick={() => {
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Agregar sucursal
        </Button>
      </div>

      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por nombre, ciudad o país..."
        disabled={loading}
        className="w-full sm:max-w-sm mb-4"
      />

      {loading && (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-md" />
          ))}
        </div>
      )}

      {error && (
        <div className="text-center text-destructive mt-4">
          <p>{error}</p>
          <Button onClick={fetchBranches} className="mt-2">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <p className="text-muted-foreground">No se encontraron sucursales.</p>
      )}

      {!loading && !error && (
        <ul className="space-y-2">
          {filtered.map((branch) => (
            <li
              key={branch.id}
              className="p-4 bg-card rounded-md shadow-sm flex items-start justify-between gap-4"
            >
              <div className="flex-1">
                <p className="font-medium">{branch.name}</p>
                <p className="text-sm text-muted-foreground mb-2">
                  {branch.description || 'Sin descripción'}
                </p>
                <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground">
                  <div>
                    <p className="font-semibold text-foreground">Ubicación</p>
                    <p>{branch.location}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Ciudad</p>
                    <p>{branch.city}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">País</p>
                    <p>{branch.country}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(branch)}
                  title="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteClick(branch)}
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
