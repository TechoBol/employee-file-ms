import { useState, useEffect } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { TrendingUp, TrendingDown, CalendarIcon } from 'lucide-react';
import { SalaryEventService } from '@/rest-client/services/SalaryEventService';
import type { SalaryEventResponse } from '@/rest-client/interface/response/SalaryEventResponse';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { format, parseISO, subMonths } from 'date-fns';
import { MONTH_CUTOFF_DAY } from '@/lib/date-utils';
import { es } from 'date-fns/locale';

const salaryEventService = new SalaryEventService();

const formSchema = z
  .object({
    type: z
      .enum(['BONUS', 'DEDUCTION'])
      .refine((v) => v === 'BONUS' || v === 'DEDUCTION', {
        message: 'El tipo es obligatorio',
      }),
    description: z
      .string()
      .trim()
      .max(250, 'La descripción no puede exceder los 250 caracteres')
      .optional()
      .transform((v) => (v === '' ? undefined : v)),
    amount: z.number().positive('El monto debe ser mayor a 0'),
    frequency: z.string().min(1, 'La frecuencia es obligatoria'),
    startDate: z.date({
      message: 'La fecha de inicio es obligatoria',
    }),
    endDate: z.date().optional(),
  })
  .refine((data) => !data.endDate || data.endDate >= data.startDate, {
    message: 'La fecha fin no puede ser menor a la fecha de inicio',
    path: ['endDate'],
  });
type SalaryEventFormValues = z.infer<typeof formSchema>;

interface SalaryEventFormProps {
  employeeId: string;
  salaryEvent?: SalaryEventResponse;
  useReplaceMode?: boolean;
  onSave?: (salaryEvent: SalaryEventResponse) => void;
  onCancel?: () => void;
  isDisassociated?: boolean;
}

export function SalaryEventForm({
  employeeId,
  salaryEvent,
  useReplaceMode = false,
  onSave,
  onCancel,
  isDisassociated,
}: SalaryEventFormProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!salaryEvent;

  const form = useForm<SalaryEventFormValues>({
    resolver: zodResolver(formSchema) as Resolver<SalaryEventFormValues>,
    defaultValues: {
      type: (salaryEvent?.type as 'BONUS' | 'DEDUCTION') || 'BONUS',
      description: salaryEvent?.description || '',
      amount: salaryEvent?.amount || undefined,
      frequency: salaryEvent?.frequency || 'ONE_TIME',
      startDate: salaryEvent?.startDate
        ? parseISO(salaryEvent.startDate)
        : undefined,
      endDate: salaryEvent?.endDate ? parseISO(salaryEvent.endDate) : undefined,
    },
  });

  useEffect(() => {
    if (salaryEvent) {
      form.reset({
        type: salaryEvent.type as 'BONUS' | 'DEDUCTION',
        description: salaryEvent.description || '',
        amount: salaryEvent.amount,
        frequency: salaryEvent.frequency,
        startDate: parseISO(salaryEvent.startDate),
        endDate: salaryEvent.endDate
          ? parseISO(salaryEvent.endDate)
          : undefined,
      });
    }
  }, [salaryEvent, form]);

  const onSubmit = async (values: SalaryEventFormValues) => {
    try {
      setLoading(true);

      let savedSalaryEvent: SalaryEventResponse;

      if (isEditing) {
        const updateData = {
          type: values.type,
          description: values.description || undefined,
          amount: values.amount,
          frequency: values.frequency,
          startDate: values.startDate.toISOString().split('T')[0],
          endDate: values.endDate
            ? values.endDate.toISOString().split('T')[0]
            : undefined,
        };

        if (useReplaceMode) {
          savedSalaryEvent = await salaryEventService.replacePatchSalaryEvent(
            salaryEvent.id,
            updateData
          );

          toast.success('Evento salarial reemplazado', {
            description: (
              <p className="text-slate-700 select-none">
                Se reemplazó correctamente
              </p>
            ),
          });
        } else {
          savedSalaryEvent = await salaryEventService.patchSalaryEvent(
            salaryEvent.id,
            updateData
          );

          toast.success('Evento salarial actualizado', {
            description: (
              <p className="text-slate-700 select-none">
                Se actualizó correctamente
              </p>
            ),
          });
        }
      } else {
        savedSalaryEvent = await salaryEventService.createSalaryEvent({
          employeeId,
          type: values.type,
          description: values.description || undefined,
          amount: values.amount,
          frequency: values.frequency,
          startDate: values.startDate.toISOString().split('T')[0],
          endDate: values.endDate
            ? values.endDate.toISOString().split('T')[0]
            : undefined,
        });

        toast.success('Evento salarial registrado', {
          description: (
            <p className="text-slate-700 select-none">
              {`Se registró correctamente como ${
                values.type === 'BONUS' ? 'bono' : 'descuento'
              }`}
            </p>
          ),
        });
      }

      if (onSave) {
        onSave(savedSalaryEvent);
      }

      if (!isEditing) {
        form.reset();
      }
    } catch (error) {
      console.error('Error al guardar evento salarial:', error);
      toast.error(
        isEditing
          ? useReplaceMode
            ? 'Error al reemplazar'
            : 'Error al actualizar'
          : 'Error al guardar',
        {
          description: (
            <p className="text-slate-700 select-none">
              Ocurrió un error al intentar guardar el evento salarial.
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
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de evento</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={loading}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2 border rounded-lg p-3 flex-1 cursor-pointer hover:bg-green-50">
                    <RadioGroupItem value="BONUS" id="bonus" />
                    <Label
                      htmlFor="bonus"
                      className="flex items-center gap-2 cursor-pointer flex-1"
                    >
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span>Bono</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-3 flex-1 cursor-pointer hover:bg-red-50">
                    <RadioGroupItem value="DEDUCTION" id="deduction" />
                    <Label
                      htmlFor="deduction"
                      className="flex items-center gap-2 cursor-pointer flex-1"
                    >
                      <TrendingDown className="h-4 w-4 text-red-600" />
                      <span>Descuento</span>
                    </Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monto (Bs)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  value={field.value || ''}
                  disabled={loading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
                    disabled={(date) => {
                      if (date < new Date('1900-01-01')) return true;
                      return false;
                    }}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción (opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe el motivo del evento salarial..."
                  {...field}
                  disabled={loading}
                  rows={4}
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
