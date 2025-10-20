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
  amount: z.number().min(1, 'El monto debe ser al menos 1'),
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
      amount: undefined,
      advanceDate: new Date(),
    },
  });

  const onSubmit = async (values: AdvanceFormValues) => {
    try {
      setLoading(true);

      const amountDecimal = values.amount;

      const newAdvance = await advanceService.createAdvance({
        employeeId,
        amount: amountDecimal,
        advanceDate: format(values.advanceDate, 'yyyy-MM-dd'),
      });

      toast.success('Adelanto registrado', {
        description: `Se registró correctamente. Monto: ${formatCurrency(
          newAdvance.amount
        )} (${values.amount})`,
      });

      if (onSave) {
        onSave(newAdvance);
      }

      form.reset({
        amount: undefined,
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
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monto del adelanto</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Ej: 1000 (Bs)"
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
