import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, parseISO, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
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
import { MONTH_CUTOFF_DAY } from '@/lib/date-utils';

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

const formSchema = z.object({
  type: z.nativeEnum(AbsencePermissionType),
  date: z.date({
    message: 'La fecha es obligatoria',
  }),
  duration: z.nativeEnum(PermissionDuration),
  reason: z
    .string()
    .max(150, 'La razón no puede exceder 150 caracteres')
    .optional(),
  description: z
    .string()
    .max(250, 'La descripción no puede exceder 250 caracteres')
    .optional(),
});

type AbsencePermissionFormValues = z.infer<typeof formSchema>;

interface AbsencePermissionFormProps {
  employeeId: string;
  absence?: AbsenceResponse;
  useReplaceMode?: boolean;
  isDisassociated?: boolean;
  onSave?: (newEvent: AbsenceResponse) => void;
  onCancel?: () => void;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
    minimumFractionDigits: 2,
  }).format(value);

// Función mejorada para extraer información del absence existente
const parseAbsenceData = (absence: AbsenceResponse) => {
  const description = absence.description || '';
  const lowerDesc = description.toLowerCase();

  // Determinar tipo - buscar las palabras clave
  let type: AbsencePermissionType;
  if (lowerDesc.includes('falta')) {
    type = AbsencePermissionType.ABSENCE;
  } else if (lowerDesc.includes('permiso')) {
    type = AbsencePermissionType.PERMISSION;
  } else {
    // Default si no se encuentra ninguna palabra clave
    type = AbsencePermissionType.PERMISSION;
  }

  // Determinar duración - buscar "medio" o "medio día"
  let duration: PermissionDuration;
  if (lowerDesc.includes('medio')) {
    duration = PermissionDuration.HALF_DAY;
  } else {
    // Por defecto es día completo si no dice "medio"
    duration = PermissionDuration.FULL_DAY;
  }

  // Extraer reason y description adicional
  // El formato es: "Permiso/Falta [duración] - [reason] - [description]"
  const parts = description.split(' - ');

  // parts[0] es "Permiso medio día" o "Falta 1 día", etc.
  // parts[1] es el reason (si existe)
  // parts[2] es la descripción adicional (si existe)

  const reason = parts.length > 1 ? parts[1].trim() : '';
  const additionalDesc = parts.length > 2 ? parts[2].trim() : '';

  console.log('Parsing absence:', {
    original: description,
    type,
    duration,
    reason,
    additionalDesc,
  });

  return { type, duration, reason, additionalDesc };
};

export function AbsencePermissionForm({
  employeeId,
  absence,
  useReplaceMode = false,
  isDisassociated,
  onSave,
  onCancel,
}: AbsencePermissionFormProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!absence;

  // Calcular el mes por defecto basado en isDisassociated y MONTH_CUTOFF_DAY
  const getDefaultMonth = () => {
    const now = new Date();
    if (isDisassociated) {
      return now; // Mes actual si está desasociado
    }
    // Si no está desasociado y estamos en los primeros MONTH_CUTOFF_DAY días
    if (now.getDate() <= MONTH_CUTOFF_DAY) {
      return subMonths(now, 1); // Mes anterior
    }
    return now; // Mes actual
  };

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
      const { type, duration, reason, additionalDesc } =
        parseAbsenceData(absence);

      console.log('Setting form values:', {
        type,
        date: absence.date,
        duration,
        reason,
        description: additionalDesc,
      });

      form.reset({
        type,
        date: parseISO(absence.date),
        duration,
        reason,
        description: additionalDesc,
      });
    } else {
      form.reset({
        type: undefined,
        date: undefined,
        duration: undefined,
        reason: '',
        description: '',
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
        const updateData = {
          type: values.type,
          duration: values.duration,
          date: format(values.date, 'yyyy-MM-dd'),
          description: detailedDescription,
          reason: values.reason,
        };

        // Usar replacePatchAbsence o patchAbsence según el modo
        if (useReplaceMode) {
          savedAbsence = await absenceService.replacePatchAbsence(
            absence.id,
            updateData
          );

          toast.success('Permiso/Falta reemplazado', {
            description: (
              <p className="text-slate-700 select-none">
                {`Se reemplazó correctamente. Descuento: ${formatCurrency(
                  savedAbsence.deductionAmount
                )}`}
              </p>
            ),
          });
        } else {
          savedAbsence = await absenceService.patchAbsence(
            absence.id,
            updateData
          );

          toast.success('Permiso/Falta actualizado', {
            description: (
              <p className="text-slate-700 select-none">
                {`Se actualizó correctamente. Descuento: ${formatCurrency(
                  savedAbsence.deductionAmount
                )}`}
              </p>
            ),
          });
        }
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
          description: (
            <p className="text-slate-700 select-none">
              {`Se registró correctamente. Descuento: ${formatCurrency(
                savedAbsence.deductionAmount
              )}`}
            </p>
          ),
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
      console.error('Error al guardar:', error);
      toast.error(
        isEditing
          ? useReplaceMode
            ? 'Error al reemplazar'
            : 'Error al actualizar'
          : 'Error al guardar',
        {
          description: (
            <p className="text-slate-700 select-none">
              Ocurrió un error al intentar guardar.
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
                    defaultMonth={getDefaultMonth()}
                    locale={es}
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
                      const today = new Date();
                      if (date > today) return true;

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
