import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { VacationService } from '@/rest-client/services/VacationService';
import type { VacationResponse } from '@/rest-client/interface/response/VacationResponse';

const vacationService = new VacationService();

const formSchema = z
  .object({
    startDate: z
      .string()
      .min(1, 'La fecha de inicio es obligatoria')
      .refine((date) => {
        const parsedDate = new Date(date);
        return !isNaN(parsedDate.getTime());
      }, 'Fecha inválida'),
    endDate: z
      .string()
      .min(1, 'La fecha de fin es obligatoria')
      .refine((date) => {
        const parsedDate = new Date(date);
        return !isNaN(parsedDate.getTime());
      }, 'Fecha inválida'),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return end >= start;
    },
    {
      message: 'La fecha de fin debe ser posterior o igual a la fecha de inicio',
      path: ['endDate'],
    }
  );

type VacationFormValues = z.infer<typeof formSchema>;

interface VacationFormProps {
  employeeId: string;
  vacation?: VacationResponse;
  onSave?: (vacation: VacationResponse) => void;
  onCancel?: () => void;
}

export function VacationForm({
  employeeId,
  vacation,
  onSave,
  onCancel,
}: VacationFormProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!vacation;

  const form = useForm<VacationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startDate: vacation?.startDate || '',
      endDate: vacation?.endDate || '',
      notes: vacation?.notes || '',
    },
  });

  useEffect(() => {
    if (vacation) {
      form.reset({
        startDate: vacation.startDate,
        endDate: vacation.endDate,
        notes: vacation.notes || '',
      });
    }
  }, [vacation, form]);

  const calculateDays = (start: string, end: string): number => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Incluye ambos días
  };

  const onSubmit = async (values: VacationFormValues) => {
    try {
      setLoading(true);

      let savedVacation: VacationResponse;

      if (isEditing) {
        savedVacation = await vacationService.patchVacation(vacation.id, {
          startDate: values.startDate,
          endDate: values.endDate,
          notes: values.notes,
        });

        toast.success('Vacación actualizada', {
          description: `Se actualizó correctamente (${calculateDays(
            values.startDate,
            values.endDate
          )} días)`,
        });
      } else {
        savedVacation = await vacationService.createVacation({
          employeeId,
          startDate: values.startDate,
          endDate: values.endDate,
          notes: values.notes,
        });

        toast.success('Vacación registrada', {
          description: `Se registró correctamente (${calculateDays(
            values.startDate,
            values.endDate
          )} días)`,
        });
      }

      if (onSave) {
        onSave(savedVacation);
      }

      if (!isEditing) {
        form.reset();
      }
    } catch (error) {
      console.error('Error al guardar vacación:', error);
      toast.error('Error al guardar', {
        description: 'Ocurrió un error al intentar guardar la vacación.',
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
          name="startDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha de inicio</FormLabel>
              <FormControl>
                <Input type="date" {...field} disabled={loading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="endDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha de fin</FormLabel>
              <FormControl>
                <Input type="date" {...field} disabled={loading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas (opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Notas adicionales sobre la vacación..."
                  {...field}
                  disabled={loading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading
              ? isEditing
                ? 'Actualizando...'
                : 'Registrando...'
              : isEditing
              ? 'Actualizar'
              : 'Registrar'}
          </Button>
          {isEditing && onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancelar
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}