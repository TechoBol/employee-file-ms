import { useState, useEffect } from 'react';
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
import { toast } from 'sonner';
import type { DepartmentResponse } from '@/rest-client/interface/response/DepartmentResponse';
import { DepartmentService } from '@/rest-client/services/DepartmentService';

const departmentService = new DepartmentService();

const formSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z
    .string()
    .min(1, 'La descripción es obligatoria')
    .max(250, 'La descripción no puede exceder los 250 caracteres'),
});

type DepartmentFormValues = z.infer<typeof formSchema>;

interface DepartmentFormProps {
  onSave?: (department: DepartmentResponse) => void;
  department?: DepartmentResponse | null;
}

export default function DepartmentForm({
  onSave,
  department,
}: DepartmentFormProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!department;

  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  useEffect(() => {
    if (department) {
      form.reset({
        name: department.name,
        description: department.description || '',
      });
    } else {
      form.reset({
        name: '',
        description: '',
      });
    }
  }, [department, form]);

  const onSubmit = async (values: DepartmentFormValues) => {
    try {
      setLoading(true);

      let result: DepartmentResponse;

      if (isEditing && department) {
        console.log('Updating department:', department.id, values);
        result = await departmentService.patchDepartment(department.id, {
          ...values,
        });

        toast.success('Departamento actualizado', {
          description: (
            <p className="text-slate-700 select-none">
              {`${result.name} fue actualizado correctamente`}
            </p>
          ),
        });
      } else {
        result = await departmentService.createDepartment({
          ...values,
        });

        toast.success('Departamento creado', {
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
      console.error('Error al guardar el departamento:', error);
      toast.error(
        isEditing ? 'Error al actualizar' : 'Error al crear el departamento',
        {
          description: 'Ocurrió un error al intentar guardar.',
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
                  placeholder="Nombre del departamento"
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
                  placeholder="Descripción (opcional)"
                  {...field}
                  disabled={loading}
                  className="resize-none"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={loading}>
          {loading
            ? 'Guardando...'
            : isEditing
            ? 'Actualizar departamento'
            : 'Crear departamento'}
        </Button>
      </form>
    </Form>
  );
}
