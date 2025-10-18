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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { MemorandumService } from '@/rest-client/services/MemorandumService';
import type { MemorandumResponse } from '@/rest-client/interface/response/MemorandumResponse';

const memorandumService = new MemorandumService();

const formSchema = z.object({
  type: z.string().min(1, 'El tipo es obligatorio'),
  description: z.string().min(1, 'La descripción es obligatoria'),
  memorandumDate: z
    .string()
    .min(1, 'La fecha es obligatoria')
    .refine((date) => {
      const parsedDate = new Date(date);
      return !isNaN(parsedDate.getTime());
    }, 'Fecha inválida'),
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
      memorandumDate: memorandum?.memorandumDate || '',
      isPositive: memorandum?.isPositive ?? true,
    },
  });

  useEffect(() => {
    if (memorandum) {
      form.reset({
        type: memorandum.type,
        description: memorandum.description,
        memorandumDate: memorandum.memorandumDate,
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
          description: 'Se actualizó correctamente',
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
          description: `Se registró correctamente como ${
            values.isPositive ? 'positivo' : 'negativo'
          }`,
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
        description: 'Ocurrió un error al intentar guardar el memorándum.',
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
            <FormItem>
              <FormLabel>Fecha del memorándum</FormLabel>
              <FormControl>
                <Input type="date" {...field} disabled={loading} />
              </FormControl>
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
