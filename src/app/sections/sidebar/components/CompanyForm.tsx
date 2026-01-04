import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useState } from 'react';
import {
  CompanyFormTexts,
  FormsButtonTexts,
  FormsValidationTexts,
} from '@/constants/localize';
import { LoaderCircle } from 'lucide-react';
import type { CompanyCreateRequest } from '@/rest-client/interface/request/CompanyCreateRequest';

const formSchema = z.object({
  name: z.string().min(1, FormsValidationTexts.required).max(80, 'El nombre no puede exceder los 100 caracteres'),
  type: z.string().min(1, FormsValidationTexts.required).max(10, 'El tipo no puede exceder los 100 caracteres'),
});

type FormValues = z.infer<typeof formSchema>;

interface CompanyFormProps {
  onSave: (data: CompanyCreateRequest, isCreating: boolean) => void;
}

export function CompanyForm({ onSave }: CompanyFormProps) {
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type: '',
    },
  });

  function onSubmit(data: FormValues) {
    setSubmitting(true);
    onSave(data, true);
    setSubmitting(false);
    form.reset();
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 max-w-md"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{CompanyFormTexts.name}</FormLabel>
              <FormControl>
                <Input
                  placeholder={CompanyFormTexts.namePlaceholder}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{CompanyFormTexts.type}</FormLabel>
              <FormControl>
                <Input
                  placeholder={CompanyFormTexts.typePlaceholder}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <section className="flex justify-end">
          <Button variant="outline" type="button" onClick={() => form.reset()}>
            {FormsButtonTexts.cancel}
          </Button>
          <Button type="submit" className="ml-2" disabled={submitting}>
            {submitting ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              FormsButtonTexts.save
            )}
          </Button>
        </section>
      </form>
    </Form>
  );
}
