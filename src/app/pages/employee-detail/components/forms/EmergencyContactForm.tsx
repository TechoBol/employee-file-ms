import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { EmergencyContactRequest } from '@/rest-client/interface/request/EmployeeUpdateRequest';
import { EmployeeService } from '@/rest-client/services/EmployeeService';

const formSchema = z.object({
  fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  relation: z.string().min(1, 'La relación es obligatoria'),
  phone: z.string().min(7, 'El teléfono debe tener al menos 7 caracteres'),
  address: z.string().min(5, 'La dirección debe tener al menos 5 caracteres'),
});

type EmergencyContactFormValues = z.infer<typeof formSchema>;

interface EmergencyContactFormProps {
  employeeId: string;
  initialData?: EmergencyContactRequest;
  onSave?: (contact: EmergencyContactRequest) => void;
}

const employeeService = new EmployeeService();

export default function EmergencyContactForm({
  employeeId,
  initialData,
  onSave,
}: EmergencyContactFormProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!initialData;

  const form = useForm<EmergencyContactFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      fullName: '',
      relation: '',
      phone: '',
      address: '',
    },
  });

  const onSubmit = async (values: EmergencyContactFormValues) => {
    try {
      setLoading(true);

      await employeeService.patchEmployee(employeeId, {
        emergencyContact: values,
      });

      toast.success(
        isEditing
          ? 'Contacto de emergencia actualizado'
          : 'Contacto de emergencia creado',
        {
          description: `Se ${isEditing ? 'actualizó' : 'creó'} correctamente el contacto: ${values.fullName}`,
        }
      );

      if (onSave) {
        onSave(values);
      }

      if (!isEditing) {
        form.reset();
      }
    } catch (error) {
      console.error('Error al guardar el contacto de emergencia:', error);
      toast.error('Error al guardar', {
        description: 'Ocurrió un error al intentar guardar el contacto.',
      });
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
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre completo</FormLabel>
              <FormControl>
                <Input
                  placeholder="Nombre del contacto"
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
          name="relation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Relación</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: Madre, Padre, Hermano/a"
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
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teléfono</FormLabel>
              <FormControl>
                <Input
                  placeholder="+1 (555) 123-4567"
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
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección</FormLabel>
              <FormControl>
                <Input
                  placeholder="Dirección del contacto"
                  {...field}
                  disabled={loading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={loading} className="w-full">
          {loading
            ? 'Guardando...'
            : isEditing
              ? 'Actualizar contacto'
              : 'Crear contacto'}
        </Button>
      </form>
    </Form>
  );
}