import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const deductionSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  monto: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'Debe ser un monto numérico mayor a 0',
  }),
});

type DeductionFormValues = z.infer<typeof deductionSchema>;

export function DeductionForm({
  onSubmit,
}: {
  onSubmit: (deduccion: { nombre: string; monto: number }) => void;
}) {
  const form = useForm<DeductionFormValues>({
    resolver: zodResolver(deductionSchema),
    defaultValues: {
      nombre: '',
      monto: '',
    },
  });

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((values) => {
          onSubmit({ nombre: values.nombre, monto: parseFloat(values.monto) });
          form.reset();
        })}
      >
        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de la deducción</FormLabel>
              <FormControl>
                <Input placeholder="Ej. AFP, RC-IVA" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="monto"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monto</FormLabel>
              <FormControl>
                <Input placeholder="Ej. 300" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          Registrar Deducción
        </Button>
      </form>
    </Form>
  );
}
