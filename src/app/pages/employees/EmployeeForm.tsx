import { useEffect, useState, useRef } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { CalendarIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { EmployeeService } from '@/rest-client/services/EmployeeService';
import { DepartmentService } from '@/rest-client/services/DepartmentService';
import { PositionService } from '@/rest-client/services/PositionService';
import type { PositionResponse } from '@/rest-client/interface/response/PositionResponse';
import type { DepartmentResponse } from '@/rest-client/interface/response/DepartmentResponse';
import type { EmployeeResponse } from '@/rest-client/interface/response/EmployeeResponse';
import { BranchService } from '@/rest-client/services/BranchService';
import type { BranchResponse } from '@/rest-client/interface/response/BranchResponse';
import { es } from 'date-fns/locale';

const formSchema = z.object({
  firstName: z
    .string()
    .min(2, 'Nombre requerido')
    .max(150, 'El nombre no puede exceder los 150 caracteres'),
  lastName: z
    .string()
    .min(2, 'Apellido requerido')
    .max(150, 'El apellido no puede exceder los 150 caracteres'),
  ci: z
    .string()
    .min(5, 'CI requerido')
    .max(15, 'El CI no puede exceder los 20 caracteres'),
  email: z.string().email('Correo inválido'),
  phone: z
    .string()
    .min(7, 'Teléfono requerido')
    .max(20, 'El teléfono no puede exceder los 20 caracteres'),
  address: z
    .string()
    .min(5, 'Dirección requerida')
    .max(180, 'La dirección no puede exceder los 180 caracteres'),
  birthDate: z.date({ error: 'Fecha de nacimiento requerida' }),
  hireDate: z.date({ error: 'Fecha de contratación requerida' }),
  type: z.enum(['FULL_TIME', 'CONSULTANT'] as const, {
    error: 'Tipo de empleado requerido',
  }),
  branchId: z.string().nonempty('Sucursal requerida'),
  departmentId: z.string().nonempty('Departamento requerido'),
  positionId: z.string().nonempty('Puesto requerido'),
  contractCompany: z
    .string()
    .max(150, 'La empresa (contrato) no puede exceder los 150 caracteres')
    .optional(),
});

type EmployeeFormValues = z.infer<typeof formSchema>;

function toLocalDate(value: Date | string | undefined): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  return parseISO(value);
}

interface UserFormProps {
  onSave?: (newEmployee: EmployeeResponse) => void;
  employee?: EmployeeResponse;
}

const employeeService = new EmployeeService();
const departmentService = new DepartmentService();
const positionService = new PositionService();
const branchService = new BranchService();

export default function UserForm({ onSave, employee }: UserFormProps) {
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [positions, setPositions] = useState<PositionResponse[]>([]);
  const [branches, setBranches] = useState<BranchResponse[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<
    string | null
  >(null);
  const [loading, setLoading] = useState(false);
  const isInitialized = useRef(false);

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      ci: '',
      email: '',
      phone: '',
      address: '',
      birthDate: new Date(),
      hireDate: new Date(),
      branchId: '',
      positionId: '',
      type: 'FULL_TIME',
      contractCompany: '',
    },
  });

  useEffect(() => {
    departmentService.getDepartments().then(setDepartments);
    branchService.getBranches().then(setBranches);
  }, []);

  useEffect(() => {
    if (!selectedDepartmentId) {
      setPositions([]);
      form.setValue('positionId', '');
      return;
    }
    positionService
      .getPositionsByDepartment(selectedDepartmentId)
      .then((positions) => {
        setPositions(positions);
      });
  }, [selectedDepartmentId, form]);

  useEffect(() => {
    if (employee) {
      const {
        firstName,
        lastName,
        ci,
        email,
        phone,
        address,
        birthDate,
        hireDate,
        branchId,
        departmentId,
        positionId,
        type,
        contractCompany,
      } = employee;

      form.reset({
        firstName,
        lastName,
        ci: ci || '',
        email,
        phone,
        address: address || '',
        birthDate: birthDate ? parseISO(birthDate) : new Date(),
        hireDate: hireDate ? parseISO(hireDate) : new Date(),
        branchId: branchId || '',
        departmentId: departmentId || '',
        positionId,
        contractCompany: contractCompany || '',
        type: (type as EmployeeFormValues['type']) || 'FULL_TIME',
      });

      const selectedDept = departments.find((d) => d.id === departmentId);
      setSelectedDepartmentId(selectedDept?.id || null);

      isInitialized.current = true;
    }
  }, [employee, departments, form]);

  useEffect(() => {
    if (employee && positions.length > 0 && !isInitialized.current) {
      form.setValue('positionId', employee.positionId || '');
      form.setValue('departmentId', employee.departmentId || '');
    }
  }, [employee, positions, form]);

  const onSubmit = async (values: EmployeeFormValues) => {
    try {
      setLoading(true);

      if (employee) {
        const result = await employeeService.patchEmployee(employee.id, values);

        toast('Empleado actualizado', {
          description: (
            <p className="text-slate-700 select-none">{`${values.firstName} ${values.lastName} ha sido actualizado.`}</p>
          ),
        });

        if (onSave) {
          onSave(result);
        }
      } else {
        const result = await employeeService.createEmployee(values);

        toast('Empleado creado', {
          description: (
            <p className="text-slate-700 select-none">{`${values.firstName} ${values.lastName} ha sido añadido.`}</p>
          ),
        });

        if (onSave) {
          onSave(result);
        }

        form.reset();
        setSelectedDepartmentId(null);
      }
    } catch (error) {
      console.error('Error al guardar el usuario:', error);
      toast('Error', {
        description: <p className="text-slate-700 select-none">{employee ? 'No se pudo actualizar el empleado.' : 'No se pudo crear el empleado.'}</p>,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 max-h-[60vh] overflow-y-auto px-1"
      >
        <div className="space-y-4">
          <h3 className="text-base font-semibold bg-background py-2 z-10">
            Información Personal
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Juan" {...field} disabled={loading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apellido</FormLabel>
                  <FormControl>
                    <Input placeholder="Pérez" {...field} disabled={loading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="ci"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CI</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="12345678"
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
              name="birthDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha de Nacimiento</FormLabel>
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
                        selected={
                          field.value ? new Date(field.value) : undefined
                        }
                        defaultMonth={
                          field.value ? new Date(field.value) : new Date()
                        }
                        locale={es}
                        captionLayout="dropdown"
                        formatters={{
                          formatCaption: (date) => {
                            const formatted = format(date, 'LLLL yyyy', {
                              locale: es,
                            });
                            return (
                              formatted.charAt(0).toUpperCase() +
                              formatted.slice(1)
                            );
                          },
                        }}
                        onSelect={(date) => field.onChange(date)}
                        disabled={(date) =>
                          date > new Date() || date < new Date('1900-01-01')
                        }
                        autoFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-base font-semibold bg-background py-2 z-10">
            Información de Contacto
          </h3>

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Correo</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="correo@ejemplo.com"
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
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono</FormLabel>
                <FormControl>
                  <Input
                    placeholder="+591 12345678"
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
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dirección</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Av. Principal #123"
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
            name="contractCompany"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Empresa (Contrato)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Nombre de la empresa (contrato) - OPCIONAL"
                    {...field}
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-base font-semibold bg-background py-2 z-10">
            Información Laboral
          </h3>

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Empleado</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={loading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tipo de empleado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="FULL_TIME">Planta</SelectItem>
                    <SelectItem value="CONSULTANT">Consultor</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="branchId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sucursal</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={loading || branches.length === 0}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una sucursal" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="departmentId"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Departamento</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      const selected = departments.find((d) => d.id === value);
                      setSelectedDepartmentId(selected?.id || null);
                    }}
                    disabled={loading || departments.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona un departamento" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="positionId"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Puesto</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={loading || positions.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona un puesto" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {positions.map((position) => (
                        <SelectItem key={position.id} value={position.id}>
                          {position.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="hireDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha de Contratación</FormLabel>
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
                          ? format(toLocalDate(field.value)!, 'dd/MM/yyyy')
                          : 'Selecciona una fecha'}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      defaultMonth={
                        field.value ? new Date(field.value) : new Date()
                      }
                      locale={es}
                      captionLayout="dropdown"
                      formatters={{
                        formatCaption: (date) => {
                          const formatted = format(date, 'LLLL yyyy', {
                            locale: es,
                          });
                          return (
                            formatted.charAt(0).toUpperCase() +
                            formatted.slice(1)
                          );
                        },
                      }}
                      onSelect={(date) => field.onChange(date)}
                      disabled={(date) => date > new Date()}
                      autoFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-row-reverse gap-3 sticky bottom-0 bg-background pt-4 pb-2">
          <Button
            type="submit"
            disabled={loading}
            className="flex-1 sm:flex-none"
          >
            {loading
              ? employee
                ? 'Actualizando...'
                : 'Creando...'
              : employee
              ? 'Actualizar usuario'
              : 'Crear usuario'}
          </Button>

          {employee && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                form.reset();
                setSelectedDepartmentId(null);
                isInitialized.current = false;
              }}
              disabled={loading}
              className="flex-1 sm:flex-none"
            >
              Cancelar
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}