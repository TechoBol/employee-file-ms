import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, RefreshCw, Pencil, Trash2 } from 'lucide-react';
import { ReusableDialog } from '@/app/shared/components/ReusableDialog';
import PositionForm from './PositionForm';
import type { PositionResponse } from '@/rest-client/interface/response/PositionResponse';
import { PositionService } from '@/rest-client/services/PositionService';
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

const positionService = new PositionService();

export function PositionsPage() {
  const [positions, setPositions] = useState<PositionResponse[]>([]);
  const [filtered, setFiltered] = useState<PositionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPosition, setEditingPosition] =
    useState<PositionResponse | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [positionToDelete, setPositionToDelete] =
    useState<PositionResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPositions = async () => {
    try {
      setLoading(true);
      const data = await positionService.getPositions();
      setPositions(data);
      setFiltered(data);
      setError(null);
    } catch (e) {
      setError(
        'Error al cargar los puestos.' +
          (e instanceof Error ? `: ${e.message}` : '')
      );
      setPositions([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  };

  const onSave = async (position: PositionResponse) => {
    if (editingPosition) {
      // Actualizar puesto existente
      setPositions((prev) =>
        prev.map((p) => (p.id === position.id ? position : p))
      );
      setFiltered((prev) =>
        prev.map((p) => (p.id === position.id ? position : p))
      );
    } else {
      // Agregar nuevo puesto
      setPositions((prev) => [position, ...prev]);
      setFiltered((prev) => [position, ...prev]);
    }
    setDialogOpen(false);
    setEditingPosition(null);
  };

  const handleEdit = (position: PositionResponse) => {
    setEditingPosition(position);
    setDialogOpen(true);
  };

  const handleDeleteClick = (position: PositionResponse) => {
    setPositionToDelete(position);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!positionToDelete) return;

    try {
      setDeleting(true);
      await positionService.deletePosition(positionToDelete.id);

      setPositions((prev) => prev.filter((p) => p.id !== positionToDelete.id));
      setFiltered((prev) => prev.filter((p) => p.id !== positionToDelete.id));

      toast.success('Puesto eliminado', {
        description: (
          <p className="text-slate-700 select-none">{`${positionToDelete.name} fue eliminado correctamente`}</p>
        ),
      });
    } catch (error) {
      console.error('Error al eliminar puesto:', error);
      toast.error('Error al eliminar', {
        description: (
          <p className="text-slate-700 select-none">
            No se pudo eliminar el puesto
          </p>
        ),
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setPositionToDelete(null);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingPosition(null);
    }
  };

  useEffect(() => {
    fetchPositions();
  }, []);

  useEffect(() => {
    const query = search.trim().toLowerCase();
    setFiltered(positions.filter((p) => p.name.toLowerCase().includes(query)));
  }, [search, positions]);

  return (
    <div className="container mx-auto">
      <ReusableDialog
        title={editingPosition ? 'Editar puesto' : 'Agregar puesto'}
        description={
          editingPosition
            ? 'Modifica los detalles del puesto'
            : 'Completa los detalles del nuevo puesto'
        }
        open={dialogOpen}
        onOpenChange={handleDialogClose}
      >
        <PositionForm onSave={onSave} position={editingPosition} />
      </ReusableDialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El puesto{' '}
              <span className="font-semibold">{positionToDelete?.name}</span>{' '}
              será eliminado permanentemente.
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
          <h1 className="text-3xl font-bold tracking-tight">Puestos</h1>
          <p className="text-muted-foreground">
            Gestiona los cargos del departamento
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar puesto
        </Button>
      </div>

      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar puesto..."
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
          <Button onClick={fetchPositions} className="mt-2">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <p className="text-muted-foreground">No se encontraron puestos.</p>
      )}

      {!loading && !error && (
        <ul className="space-y-2">
          {filtered.map((position) => (
            <li
              key={position.id}
              className="p-4 bg-card rounded-md shadow-sm flex items-start justify-between gap-4"
            >
              <div className="flex-1">
                <p className="font-medium">{position.name}</p>
                <p className="text-sm text-muted-foreground">
                  {position.description || 'Sin descripción'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(position)}
                  title="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteClick(position)}
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
