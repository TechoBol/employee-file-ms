import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import type { PositionResponse } from '@/rest-client/interface/response/PositionResponse';
import type { DepartmentResponse } from '@/rest-client/interface/response/DepartmentResponse';
import { DepartmentService } from '@/rest-client/services/DepartmentService';
import { PositionService } from '@/rest-client/services/PositionService';

const departmentService = new DepartmentService();
const positionService = new PositionService();

const formSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z
    .string()
    .min(1, 'La descripción es obligatoria')
    .max(250, 'La descripción no puede exceder los 250 caracteres'),
  departmentId: z.string().nonempty('Debes seleccionar un departamento'),
});

type PositionFormValues = z.infer<typeof formSchema>;

interface PositionFormProps {
  onSave?: (position: PositionResponse) => void;
  position?: PositionResponse | null;
}

export default function PositionForm({ onSave, position }: PositionFormProps) {
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const isEditing = !!position;

  const form = useForm<PositionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      departmentId: '',
    },
  });

  useEffect(() => {
    async function fetchDepartments() {
      const data = await departmentService.getDepartments();
      setDepartments(data);
    }

    fetchDepartments();
  }, []);

  useEffect(() => {
    if (position) {
      form.reset({
        name: position.name,
        description: position.description || '',
        departmentId: position.departmentId,
      });
    } else {
      form.reset({
        name: '',
        description: '',
        departmentId: '',
      });
    }
  }, [position, form]);

  const onSubmit = async (values: PositionFormValues) => {
    try {
      setLoading(true);

      let result: PositionResponse;

      if (isEditing && position) {
        // Actualizar puesto existente
        result = await positionService.patchPosition(position.id, {
          ...values,
        });

        toast.success('Puesto actualizado', {
          description: (
            <p className="text-slate-700 select-none">{`${result.name} fue actualizado correctamente`}</p>
          ),
        });
      } else {
        // Crear nuevo puesto
        result = await positionService.createPosition({
          ...values,
        });

        toast.success('Puesto creado', {
          description: (
            <p className="text-slate-700 select-none">{`Se creó el puesto: ${result.name}`}</p>
          ),
        });
      }

      form.reset();
      if (onSave) {
        onSave(result);
      }
    } catch (error) {
      console.error('Error al guardar el puesto:', error);
      toast.error(
        isEditing ? 'Error al actualizar' : 'Error al crear el puesto',
        {
          description: (
            <p className="text-slate-700 select-none">
              Ocurrió un error inesperado.
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
              <FormLabel>Nombre del puesto</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: Gerente de Ventas"
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
                  placeholder="Opcional..."
                  {...field}
                  disabled={loading}
                  className="h-16 resize-none"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="departmentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Departamento</FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={loading || departments.length === 0}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un departamento" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {departments.map((department) => (
                    <SelectItem key={department.id} value={department.id}>
                      {department.name}
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
            ? 'Actualizar puesto'
            : 'Crear puesto'}
        </Button>
      </form>
    </Form>
  );
}
