import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
import type { AbsenceResponse } from '@/rest-client/interface/response/AbsenceResponse';
import { AbsenceService } from '@/rest-client/services/AbsenceService';

// Tipos específicos para el formulario
export const AbsencePermissionType = {
  PERMISSION: 'PERMISSION',
  ABSENCE: 'ABSENCE',
} as const;
type AbsencePermissionType =
  (typeof AbsencePermissionType)[keyof typeof AbsencePermissionType];

export const PermissionDuration = {
  HALF_DAY: 'HALF_DAY',
  FULL_DAY: 'FULL_DAY',
} as const;
type PermissionDuration =
  (typeof PermissionDuration)[keyof typeof PermissionDuration];

const absenceService = new AbsenceService();

// Función para obtener el rango de fechas permitidas
const getDateRange = () => {
  const today = new Date();
  const currentDay = today.getDate();
  
  // Si estamos en los primeros 5 días, permitir mes anterior
  if (currentDay <= 5) {
    // Primer día del mes anterior
    const minDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    // Último día del mes actual
    const maxDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return { minDate, maxDate };
  } else {
    // Primer día del mes actual
    const minDate = new Date(today.getFullYear(), today.getMonth(), 1);
    // Último día del mes actual
    const maxDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return { minDate, maxDate };
  }
};

const formSchema = z.object({
  type: z.nativeEnum(AbsencePermissionType),
  date: z.date({
    message: 'La fecha es obligatoria',
  }),
  duration: z.nativeEnum(PermissionDuration),
  reason: z.string().optional(),
  description: z.string().optional(),
});

type AbsencePermissionFormValues = z.infer<typeof formSchema>;

interface AbsencePermissionFormProps {
  employeeId: string;
  absence?: AbsenceResponse;
  onSave?: (newEvent: AbsenceResponse) => void;
  onCancel?: () => void;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
    minimumFractionDigits: 2,
  }).format(value);

// Función para extraer información del absence existente
const parseAbsenceData = (absence: AbsenceResponse) => {
  const description = absence.description || '';
  
  // Determinar tipo
  const type = description.toLowerCase().includes('falta')
    ? AbsencePermissionType.ABSENCE
    : AbsencePermissionType.PERMISSION;
  
  // Determinar duración
  const duration = description.toLowerCase().includes('medio')
    ? PermissionDuration.HALF_DAY
    : PermissionDuration.FULL_DAY;
  
  // Extraer reason y description adicional si existen
  const parts = description.split(' - ');
  const reason = parts[1] || '';
  const additionalDesc = parts[2] || '';
  
  return { type, duration, reason, additionalDesc };
};

export function AbsencePermissionForm({
  employeeId,
  absence,
  onSave,
  onCancel,
}: AbsencePermissionFormProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!absence;
  const { minDate, maxDate } = getDateRange();

  const form = useForm<AbsencePermissionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: undefined,
      date: undefined,
      duration: undefined,
      reason: '',
      description: '',
    },
  });

  useEffect(() => {
    if (absence) {
      const { type, duration, reason, additionalDesc } = parseAbsenceData(absence);
      form.reset({
        type,
        date: new Date(absence.date),
        duration,
        reason,
        description: additionalDesc,
      });
    }
  }, [absence, form]);

  const onSubmit = async (values: AbsencePermissionFormValues) => {
    try {
      setLoading(true);

      // Crear descripción detallada
      let detailedDescription = '';
      const durationText =
        values.duration === PermissionDuration.HALF_DAY ? 'medio día' : '1 día';

      if (values.type === AbsencePermissionType.PERMISSION) {
        detailedDescription = `Permiso ${durationText}`;
      } else {
        detailedDescription = `Falta ${durationText}`;
      }

      if (values.reason) {
        detailedDescription += ` - ${values.reason}`;
      }

      if (values.description) {
        detailedDescription += ` - ${values.description}`;
      }

      let savedAbsence: AbsenceResponse;

      if (isEditing) {
        savedAbsence = await absenceService.patchAbsence(absence.id, {
          type: values.type,
          duration: values.duration,
          date: format(values.date, 'yyyy-MM-dd'),
          description: detailedDescription,
          reason: values.reason,
        });

        toast.success('Permiso/Falta actualizado', {
          description: `Se actualizó correctamente. Descuento: ${formatCurrency(
            savedAbsence.deductionAmount
          )}`,
        });
      } else {
        savedAbsence = await absenceService.createAbsence({
          employeeId,
          type: values.type,
          duration: values.duration,
          date: format(values.date, 'yyyy-MM-dd'),
          description: detailedDescription,
          reason: values.reason,
        });

        const typeLabel =
          values.type === AbsencePermissionType.ABSENCE ? 'Falta' : 'Permiso';
        toast.success(`${typeLabel} registrado`, {
          description: `Se registró correctamente. Descuento: ${formatCurrency(
            savedAbsence.deductionAmount
          )}`,
        });
      }

      if (onSave) {
        onSave(savedAbsence);
      }

      if (!isEditing) {
        form.reset({
          type: undefined,
          date: undefined,
          duration: undefined,
          reason: '',
          description: '',
        });
      }
    } catch (error) {
      console.error('Error al registrar:', error);
      toast.error('Error al guardar', {
        description: 'Ocurrió un error al intentar guardar.',
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
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value || ''}
                disabled={loading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={AbsencePermissionType.PERMISSION}>
                    Permiso
                  </SelectItem>
                  <SelectItem value={AbsencePermissionType.ABSENCE}>
                    Falta
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Fecha</FormLabel>
              <Popover>
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
                    disabled={(date) => date < minDate || date > maxDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duración</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value || ''}
                disabled={loading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona la duración" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={PermissionDuration.HALF_DAY}>
                    Medio día
                  </SelectItem>
                  <SelectItem value={PermissionDuration.FULL_DAY}>
                    1 día
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Motivo (opcional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: Cita médica, asuntos personales..."
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
              <FormLabel>Descripción adicional (opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Detalles adicionales..."
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