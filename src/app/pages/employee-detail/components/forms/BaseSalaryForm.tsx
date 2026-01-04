import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';
import { BaseSalaryService } from '@/rest-client/services/BaseSalaryService';
import type { BaseSalaryResponse } from '@/rest-client/interface/response/BaseSalaryResponse';
import { parseISO } from 'date-fns';

const baseSalaryService = new BaseSalaryService();

const formSchema = z.object({
  amount: z
    .string()
    .min(1, 'El monto es obligatorio')
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'El monto debe ser un número mayor a 0',
    }),
  startDate: z.string().refine((date) => {
    const parsedDate = parseISO(date);
    return !isNaN(parsedDate.getTime());
  }, 'Fecha inválida'),
});

type BaseSalaryFormValues = z.infer<typeof formSchema>;

interface BaseSalaryFormProps {
  employeeId: string;
  onSave?: (baseSalary: BaseSalaryResponse) => void;
  baseSalary?: BaseSalaryResponse | null;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
  }).format(value);

export function BaseSalaryForm({
  employeeId,
  onSave,
  baseSalary,
}: BaseSalaryFormProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!baseSalary;

  const form = useForm<BaseSalaryFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: '',
      startDate: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    if (baseSalary) {
      form.reset({
        amount: baseSalary.amount.toString(),
        startDate: baseSalary.startDate.split('T')[0],
      });
    } else {
      form.reset({
        amount: '',
        startDate: new Date().toISOString().split('T')[0],
      });
    }
  }, [baseSalary, form]);

  const onSubmit = async (values: BaseSalaryFormValues) => {
    try {
      setLoading(true);

      let result: BaseSalaryResponse;

      if (isEditing && baseSalary) {
        // Actualizar salario base existente
        result = await baseSalaryService.patchBaseSalary(baseSalary.id, {
          amount: Number(values.amount),
          startDate: values.startDate,
        });

        toast.success('Salario base actualizado', {
          description: (
            <p className="text-slate-700 select-none">
              {`Se actualizó correctamente: ${formatCurrency(result.amount)}`}
            </p>
          ),
        });
      } else {
        // Crear nuevo salario base
        result = await baseSalaryService.createBaseSalary({
          employeeId,
          amount: Number(values.amount),
          startDate: values.startDate,
        });

        toast.success('Salario base creado', {
          description: (
            <p className="text-slate-700 select-none">
              {`Se creó correctamente: ${formatCurrency(result.amount)}`}
            </p>
          ),
        });
      }

      if (onSave) {
        onSave(result);
      }

      form.reset();
    } catch (error) {
      console.error('Error al guardar el salario base:', error);
      toast.error(
        isEditing ? 'Error al actualizar' : 'Error al crear el salario base',
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
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monto (BOB)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Ej: 5000.00"
                  {...field}
                  disabled={loading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={loading} className="w-full">
          {loading
            ? 'Guardando...'
            : isEditing
            ? 'Actualizar salario base'
            : 'Crear salario base'}
        </Button>
      </form>
    </Form>
  );
}
