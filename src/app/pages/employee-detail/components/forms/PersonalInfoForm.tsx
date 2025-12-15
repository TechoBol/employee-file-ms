import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import PdfUploader from '@/app/shared/components/PdfUploader';

const formSchema = z.object({
  direccion: z.string().min(1, 'La dirección es requerida'),
  fechaNacimiento: z.string().min(1, 'La fecha es requerida'),
  contactoEmergencia: z.string().min(1, 'El contacto es requerido'),
  curriculum: z.instanceof(File).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function PersonalInfoForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      direccion: '',
      fechaNacimiento: '',
      contactoEmergencia: '',
      curriculum: undefined,
    },
  });

  const loading = false; // puedes conectarlo a tu estado de loading si necesitas

  return (
    <Form {...form}>
      <form className="space-y-4">
        {/* Dirección */}
        <FormField
          control={form.control}
          name="direccion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección</FormLabel>
              <FormControl>
                <Input
                  placeholder="Dirección completa"
                  {...field}
                  disabled={loading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Fecha de nacimiento */}
        <FormField
          control={form.control}
          name="fechaNacimiento"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Fecha de nacimiento</FormLabel>
              <Popover modal>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={'outline'}
                      className={`w-full pl-3 text-left font-normal ${
                        field.value ? '' : 'text-muted-foreground'
                      }`}
                      disabled={loading}
                    >
                      {field.value
                        ? format(new Date(field.value), 'dd/MM/yyyy')
                        : 'Selecciona una fecha'}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value ? parseISO(field.value) : undefined}
                    captionLayout="dropdown"
                    onSelect={(date) => {
                      field.onChange(date?.toISOString().split('T')[0]);
                    }}
                    disabled={(date) => date > new Date()}
                    autoFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Contacto de emergencia */}
        <FormField
          control={form.control}
          name="contactoEmergencia"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contacto de emergencia</FormLabel>
              <FormControl>
                <Input
                  placeholder="Nombre y teléfono"
                  {...field}
                  disabled={loading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Curriculum Vitae */}
        <div className="space-y-2">
          <FormLabel>Curriculum Vitae</FormLabel>
          <PdfUploader
            onFileAccepted={(file: File) => {
              form.setValue('curriculum', file);
              console.log('File accepted:', file);
            }}
          />
          <FormMessage />
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar Información'}
        </Button>
      </form>
    </Form>
  );
}
