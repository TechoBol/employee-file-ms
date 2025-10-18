import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
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

const advanceService = new AdvanceService();

const formSchema = z.object({
  percentageAmount: z
    .number()
    .min(1, 'El porcentaje debe ser al menos 1%')
    .max(20, 'El porcentaje no puede ser mayor a 20%'),
  advanceDate: z.date({
    message: 'La fecha es obligatoria',
  }),
});

type AdvanceFormValues = z.infer<typeof formSchema>;

interface AdvanceFormProps {
  employeeId: string;
  onSave?: (newAdvance: AdvanceResponse) => void;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
    minimumFractionDigits: 2,
  }).format(value);

export function AdvanceForm({ employeeId, onSave }: AdvanceFormProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<AdvanceFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      percentageAmount: undefined,
      advanceDate: new Date(),
    },
  });

  const onSubmit = async (values: AdvanceFormValues) => {
    try {
      setLoading(true);

      // Convertir el porcentaje de 20% a 0.20 (20/100)
      const percentageDecimal = values.percentageAmount / 100;

      const newAdvance = await advanceService.createAdvance({
        employeeId,
        percentageAmount: percentageDecimal,
        advanceDate: format(values.advanceDate, 'yyyy-MM-dd'),
      });

      toast.success('Adelanto registrado', {
        description: `Se registró correctamente. Monto: ${formatCurrency(
          newAdvance.totalAmount
        )} (${values.percentageAmount}%)`,
      });

      if (onSave) {
        onSave(newAdvance);
      }

      form.reset({
        percentageAmount: undefined,
        advanceDate: new Date(),
      });
    } catch (error) {
      console.error('Error al registrar adelanto:', error);
      toast.error('Error al registrar', {
        description: 'Ocurrió un error al intentar guardar el adelanto.',
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
          name="percentageAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Porcentaje del salario (%)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Ej: 10 (Máx. 20%)"
                  step="1"
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
                    disabled={(date) =>
                      date > new Date() || date < new Date('1900-01-01')
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Registrando...' : 'Registrar Adelanto'}
        </Button>
      </form>
    </Form>
  );
}
