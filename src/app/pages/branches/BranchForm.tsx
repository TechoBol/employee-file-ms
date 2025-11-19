import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';
import type { BranchResponse } from '@/rest-client/interface/response/BranchResponse';
import { BranchService } from '@/rest-client/services/BranchService';

const BOLIVIAN_CITIES = [
  'La Paz',
  'Cochabamba',
  'Santa Cruz',
  'Potosí',
  'Oruro',
  'Sucre',
  'Tarija',
  'Beni',
  'Pando',
];

const branchService = new BranchService();

const formSchema = z.object({
  name: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder los 100 caracteres'),
  description: z.string()
    .min(1, 'La descripción es obligatoria')
    .max(250, 'La descripción no puede exceder los 250 caracteres'),
  location: z.string()
    .min(2, 'La ubicación es obligatoria')
    .max(180, 'La ubicación no puede exceder los 180 caracteres'),
  city: z.string().min(1, 'La ciudad es obligatoria'),
  country: z.literal('Bolivia', { message: 'El país debe ser Bolivia' }),
});

type BranchFormValues = z.infer<typeof formSchema>;

interface BranchFormProps {
  onSave?: (branch: BranchResponse) => void;
  branch?: BranchResponse | null;
}

export default function BranchForm({ onSave, branch }: BranchFormProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!branch;

  const form = useForm<BranchFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      location: '',
      city: '',
      country: 'Bolivia',
    },
  });

  useEffect(() => {
    if (branch) {
      form.reset({
        name: branch.name,
        description: branch.description || '',
        location: branch.location,
        city: branch.city,
        country: 'Bolivia',
      });
    } else {
      form.reset({
        name: '',
        description: '',
        location: '',
        city: '',
        country: 'Bolivia',
      });
    }
  }, [branch, form]);

  const onSubmit = async (values: BranchFormValues) => {
    try {
      setLoading(true);

      let result: BranchResponse;

      if (isEditing && branch) {
        // Actualizar sucursal existente
        result = await branchService.patchBranch(branch.id, {
          ...values,
        });

        toast.success('Sucursal actualizada', {
          description: (
            <p className="text-slate-700 select-none">{`${result.name} fue actualizada correctamente`}</p>
          ),
        });
      } else {
        // Crear nueva sucursal
        result = await branchService.createBranch({
          ...values,
        });

        toast.success('Sucursal creada', {
          description: (
            <p className="text-slate-700 select-none">
              {`Se creó correctamente: ${result.name}`}
            </p>
          ),
        });
      }

      if (onSave) {
        onSave(result);
      }

      form.reset();
    } catch (error) {
      console.error('Error al guardar la sucursal:', error);
      toast.error(
        isEditing ? 'Error al actualizar' : 'Error al crear la sucursal',
        {
          description: (
            <p className="text-slate-700 select-none">
              {'Ocurrió un error al intentar guardar.'}
            </p>
          ),
        }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 max-w-md"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input
                  placeholder="Nombre de la sucursal"
                  {...field}
                  disabled={loading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descripción de la sucursal"
                  {...field}
                  disabled={loading}
                  className="resize-none"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ubicación</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: Av. Principal 123"
                  {...field}
                  disabled={loading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="country"
          render={() => (
            <FormItem>
              <FormLabel>País</FormLabel>
              <FormControl>
                <Input value="Bolivia" disabled={true} readOnly />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ciudad</FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={loading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una ciudad" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {BOLIVIAN_CITIES.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={loading}>
          {loading
            ? 'Guardando...'
            : isEditing
            ? 'Actualizar sucursal'
            : 'Crear sucursal'}
        </Button>
      </form>
    </Form>
  );
}
