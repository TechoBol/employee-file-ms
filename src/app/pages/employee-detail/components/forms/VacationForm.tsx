import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { VacationService } from '@/rest-client/services/VacationService';
import type { VacationResponse } from '@/rest-client/interface/response/VacationResponse';

const vacationService = new VacationService();

const formSchema = z
  .object({
    startDate: z.date({
      error: 'La fecha de inicio es obligatoria',
    }),
    endDate: z.date({
      error: 'La fecha de fin es obligatoria',
    }),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      return data.endDate >= data.startDate;
    },
    {
      message:
        'La fecha de fin debe ser posterior o igual a la fecha de inicio',
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
      startDate: vacation?.startDate ? new Date(vacation.startDate) : undefined,
      endDate: vacation?.endDate ? new Date(vacation.endDate) : undefined,
      notes: vacation?.notes || '',
    },
  });

  useEffect(() => {
    if (vacation) {
      form.reset({
        startDate: new Date(vacation.startDate),
        endDate: new Date(vacation.endDate),
        notes: vacation.notes || '',
      });
    } else {
      form.reset({
        startDate: undefined,
        endDate: undefined,
        notes: '',
      });
    }
  }, [vacation, form]);

  const calculateDays = (start: Date, end: Date): number => {
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  };

  const onSubmit = async (values: VacationFormValues) => {
    try {
      setLoading(true);
      let savedVacation: VacationResponse;

      const days = calculateDays(values.startDate, values.endDate);

      if (isEditing) {
        savedVacation = await vacationService.patchVacation(vacation.id, {
          startDate: values.startDate,
          endDate: values.endDate,
          notes: values.notes,
        });

        toast.success('Vacación actualizada', {
          description: (
            <p className="text-slate-700 select-none">
              {`Se actualizó correctamente (${days} días)`}
            </p>
          ),
        });
      } else {
        savedVacation = await vacationService.createVacation({
          employeeId,
          startDate: values.startDate,
          endDate: values.endDate,
          notes: values.notes,
        });

        toast.success('Vacación registrada', {
          description: (
            <p className="text-slate-700 select-none">
              {`Se registró correctamente (${days} días)`}
            </p>
          ),
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
      toast.error(isEditing ? 'Error al actualizar' : 'Error al guardar', {
        description: (
          <p className="text-slate-700 select-none">
            Ocurrió un error al intentar guardar la vacación.
          </p>
        ),
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
            <FormItem className="flex flex-col">
              <FormLabel>Fecha de inicio</FormLabel>
              <Popover modal>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      disabled={loading}
                      className={cn(
                        'w-full pl-3 text-left font-normal',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      {field.value ? (
                        format(field.value, 'PPP', { locale: es })
                      ) : (
                        <span>Selecciona una fecha</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => {
                      // No permitir fechas muy antiguas
                      if (date < new Date('1900-01-01')) return true;

                      // No permitir fechas futuras
                      const today = new Date();
                      today.setHours(23, 59, 59, 999);
                      if (date > today) return true;

                      return false;
                    }}
                    initialFocus
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="endDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Fecha de fin</FormLabel>
              <Popover modal>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      disabled={loading}
                      className={cn(
                        'w-full pl-3 text-left font-normal',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      {field.value ? (
                        format(field.value, 'PPP', { locale: es })
                      ) : (
                        <span>Selecciona una fecha</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => {
                      // No permitir fechas muy antiguas
                      if (date < new Date('1900-01-01')) return true;

                      // La fecha de fin debe ser mayor o igual a la fecha de inicio
                      const start = form.watch('startDate');
                      if (start && date < start) return true;

                      return false;
                    }}
                    initialFocus
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
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
                  className="resize-none"
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
