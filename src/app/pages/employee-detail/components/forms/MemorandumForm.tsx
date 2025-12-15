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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ThumbsUp, ThumbsDown, CalendarIcon } from 'lucide-react';
import { MemorandumService } from '@/rest-client/services/MemorandumService';
import type { MemorandumResponse } from '@/rest-client/interface/response/MemorandumResponse';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const memorandumService = new MemorandumService();

const formSchema = z.object({
  type: z.string().min(1, 'El tipo es obligatorio'),
  description: z
    .string()
    .min(1, 'La descripción es obligatoria')
    .max(1000, 'La descripción no puede exceder los 1000 caracteres'),
  memorandumDate: z.date({
    error: 'La fecha es obligatoria',
  }),
  isPositive: z.boolean(),
});

type MemorandumFormValues = z.infer<typeof formSchema>;

interface MemorandumFormProps {
  employeeId: string;
  memorandum?: MemorandumResponse;
  onSave?: (memorandum: MemorandumResponse) => void;
  onCancel?: () => void;
}

export function MemorandumForm({
  employeeId,
  memorandum,
  onSave,
  onCancel,
}: MemorandumFormProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!memorandum;

  const form = useForm<MemorandumFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: memorandum?.type || '',
      description: memorandum?.description || '',
      memorandumDate: memorandum?.memorandumDate
        ? parseISO(memorandum.memorandumDate)
        : undefined,
      isPositive: memorandum?.isPositive ?? true,
    },
  });

  useEffect(() => {
    if (memorandum) {
      form.reset({
        type: memorandum.type,
        description: memorandum.description,
        memorandumDate: parseISO(memorandum.memorandumDate),
        isPositive: memorandum.isPositive,
      });
    }
  }, [memorandum, form]);

  const onSubmit = async (values: MemorandumFormValues) => {
    try {
      setLoading(true);

      let savedMemorandum: MemorandumResponse;

      if (isEditing) {
        savedMemorandum = await memorandumService.patchMemorandum(
          memorandum.id,
          {
            type: values.type,
            description: values.description,
            memorandumDate: values.memorandumDate,
            isPositive: values.isPositive,
          }
        );

        toast.success('Memorándum actualizado', {
          description: (
            <p className="text-slate-700 select-none">
              Se actualizó correctamente
            </p>
          ),
        });
      } else {
        savedMemorandum = await memorandumService.createMemorandum({
          employeeId,
          type: values.type,
          description: values.description,
          memorandumDate: values.memorandumDate,
          isPositive: values.isPositive,
        });

        toast.success('Memorándum registrado', {
          description: (
            <p className="text-slate-700 select-none">
              {`Se registró correctamente como ${
                values.isPositive ? 'positivo' : 'negativo'
              }`}
            </p>
          ),
        });
      }

      if (onSave) {
        onSave(savedMemorandum);
      }

      if (!isEditing) {
        form.reset();
      }
    } catch (error) {
      console.error('Error al guardar memorándum:', error);
      toast.error('Error al guardar', {
        description: (
          <p className="text-slate-700 select-none">
            Ocurrió un error al intentar guardar el memorándum.
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
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={loading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="VERBAL_WARNING">
                    Advertencia verbal
                  </SelectItem>
                  <SelectItem value="WRITTEN_WARNING">
                    Advertencia escrita
                  </SelectItem>
                  <SelectItem value="SUSPENSION">Suspensión</SelectItem>
                  <SelectItem value="CALL_TO_ATTENTION">
                    Llamada de atención
                  </SelectItem>
                  <SelectItem value="RECOGNITION">Reconocimiento</SelectItem>
                  <SelectItem value="CONGRATULATION">Felicitación</SelectItem>
                  <SelectItem value="PERFORMANCE_BONUS">
                    Bono por desempeño
                  </SelectItem>
                  <SelectItem value="OTHER">Otro</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="memorandumDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Fecha del memorándum</FormLabel>
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
          name="isPositive"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de memorándum</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={(value) => field.onChange(value === 'true')}
                  value={field.value.toString()}
                  disabled={loading}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2 border rounded-lg p-3 flex-1 cursor-pointer hover:bg-green-50">
                    <RadioGroupItem value="true" id="positive" />
                    <Label
                      htmlFor="positive"
                      className="flex items-center gap-2 cursor-pointer flex-1"
                    >
                      <ThumbsUp className="h-4 w-4 text-green-600" />
                      <span>Positivo</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-3 flex-1 cursor-pointer hover:bg-red-50">
                    <RadioGroupItem value="false" id="negative" />
                    <Label
                      htmlFor="negative"
                      className="flex items-center gap-2 cursor-pointer flex-1"
                    >
                      <ThumbsDown className="h-4 w-4 text-red-600" />
                      <span>Negativo</span>
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe el motivo del memorándum..."
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
