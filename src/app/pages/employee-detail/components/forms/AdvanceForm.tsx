import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, parseISO, subMonths } from 'date-fns';
import { MONTH_CUTOFF_DAY } from '@/lib/date-utils';
import { Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
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
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { AdvanceService } from '@/rest-client/services/AdvanceService';
import type { AdvanceResponse } from '@/rest-client/interface/response/AdvanceResponse';
import { es } from 'date-fns/locale';

const advanceService = new AdvanceService();

const formSchema = z.object({
  amount: z.number().min(1, 'El monto debe ser al menos 1'),
  advanceDate: z.date({
    message: 'La fecha es obligatoria',
  }),
});

type AdvanceFormValues = z.infer<typeof formSchema>;

interface AdvanceFormProps {
  employeeId: string;
  advance?: AdvanceResponse;
  useReplaceMode?: boolean;
  onSave?: (advance: AdvanceResponse) => void;
  onCancel?: () => void;
  isDisassociated?: boolean;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
    minimumFractionDigits: 2,
  }).format(value);

export function AdvanceForm({
  employeeId,
  advance,
  useReplaceMode = false,
  onSave,
  onCancel,
  isDisassociated,
}: AdvanceFormProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!advance;

  const form = useForm<AdvanceFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: undefined,
      advanceDate: new Date(),
    },
  });

  useEffect(() => {
    if (advance) {
      form.reset({
        amount: advance.amount,
        advanceDate: parseISO(advance.advanceDate),
      });
    } else {
      form.reset({
        amount: undefined,
        advanceDate: new Date(),
      });
    }
  }, [advance, form]);

  const onSubmit = async (values: AdvanceFormValues) => {
    try {
      setLoading(true);

      let savedAdvance: AdvanceResponse;

      if (isEditing) {
        const updateData = {
          amount: values.amount,
          advanceDate: format(values.advanceDate, 'yyyy-MM-dd'),
        };

        if (useReplaceMode) {
          savedAdvance = await advanceService.replacePatchAdvance(
            advance.id,
            updateData
          );

          toast.success('Adelanto reemplazado', {
            description: (
              <p className="text-slate-700 select-none">
                {`Se reemplazó correctamente. Monto: ${formatCurrency(
                  savedAdvance.amount
                )}`}
              </p>
            ),
          });
        } else {
          savedAdvance = await advanceService.patchAdvance(
            advance.id,
            updateData
          );

          toast.success('Adelanto actualizado', {
            description: (
              <p className="text-slate-700 select-none">
                {`Se actualizó correctamente. Monto: ${formatCurrency(
                  savedAdvance.amount
                )}`}
              </p>
            ),
          });
        }
      } else {
        savedAdvance = await advanceService.createAdvance({
          employeeId,
          amount: values.amount,
          advanceDate: format(values.advanceDate, 'yyyy-MM-dd'),
        });

        toast.success('Adelanto registrado', {
          description: (
            <p className="text-slate-700 select-none">
              {`Se registró correctamente. Monto: ${formatCurrency(
                savedAdvance.amount
              )}`}
            </p>
          ),
        });
      }

      if (onSave) {
        onSave(savedAdvance);
      }

      if (!isEditing) {
        form.reset({
          amount: undefined,
          advanceDate: new Date(),
        });
      }
    } catch (error) {
      console.error('Error al guardar adelanto:', error);
      toast.error(
        isEditing
          ? useReplaceMode
            ? 'Error al reemplazar'
            : 'Error al actualizar'
          : 'Error al registrar',
        {
          description: (
            <p className="text-slate-700 select-none">
              Ocurrió un error al intentar guardar el adelanto.
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
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monto del adelanto (Bs)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Ej: 1000"
                  step="0.01"
                  min="0"
                  {...field}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    field.onChange(isNaN(value) ? undefined : value);
                  }}
                  disabled={loading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="advanceDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Fecha del adelanto</FormLabel>
              <Popover modal>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full pl-3 text-left font-normal',
                        !field.value && 'text-muted-foreground'
                      )}
                      disabled={loading}
                    >
                      {field.value ? (
                        format(field.value, 'dd/MM/yyyy')
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
                    locale={es}
                    defaultMonth={(() => {
                      const now = new Date();
                      if (isDisassociated) return now;
                      if (now.getDate() <= MONTH_CUTOFF_DAY)
                        return subMonths(now, 1);
                      return now;
                    })()}
                    formatters={{
                      formatCaption: (date) => {
                        const formatted = format(date, 'LLLL yyyy', {
                          locale: es,
                        });
                        return (
                          formatted.charAt(0).toUpperCase() + formatted.slice(1)
                        );
                      },
                    }}
                    disabled={(date) =>
                      date > new Date() || date < new Date('1900-01-01')
                    }
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading
              ? isEditing
                ? useReplaceMode
                  ? 'Reemplazando...'
                  : 'Actualizando...'
                : 'Registrando...'
              : isEditing
              ? useReplaceMode
                ? 'Reemplazar'
                : 'Actualizar'
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
