'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { SalarySummaryTexts } from '@/constants/localize';
import { BanknoteArrowDown, BanknoteArrowUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import { BonoForm } from './forms/BonoForm';
import { DeductionForm } from './forms/DeductionForm';
import { ReusableDialog } from '@/app/shared/components/ReusableDialog';

type Bono = {
  nombre: string;
  monto: number;
};

type Deduccion = {
  nombre: string;
  monto: number;
};

type SalarySummaryProps = {
  salarioBase: number;
  bonoAntiguedad: number;
  bonosAdicionales: Bono[];
  deducciones: Deduccion[];
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
    minimumFractionDigits: 2,
  }).format(value);

type DialogContentType = 'BONUS' | 'DEDUCTION' | null;

export function SalarySummary({
  salarioBase,
  bonoAntiguedad,
  bonosAdicionales,
  deducciones,
}: SalarySummaryProps) {
  const totalBonosAdicionales = bonosAdicionales.reduce(
    (acc, b) => acc + b.monto,
    0
  );
  const totalDeducciones = deducciones.reduce((acc, d) => acc + d.monto, 0);
  const salarioFinal =
    salarioBase + bonoAntiguedad + totalBonosAdicionales - totalDeducciones;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState<DialogContentType>(null);

  const handleOpen = (type: DialogContentType) => {
    setDialogContent(type);
    setDialogOpen(true);
  };

  const renderDialogContent = useMemo(() => {
    switch (dialogContent) {
      case 'BONUS':
        return <BonoForm onSubmit={() => {}} />;
      case 'DEDUCTION':
        return <DeductionForm onSubmit={() => {}} />;
      default:
        return null;
    }
  }, [dialogContent]);

  return (
    <section className="flex flex-col gap-6 p-4">
      <ReusableDialog
        title={
          dialogContent === 'BONUS' ? 'Registrar Bono' : 'Registrar Deducción'
        }
        description={
          dialogContent === 'BONUS'
            ? 'Ingresa los detalles del bono'
            : 'Ingresa los detalles de la deducción'
        }
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      >
        {renderDialogContent}
      </ReusableDialog>
      <div className="flex justify-between">
        <span className="text-xl font-bold">{SalarySummaryTexts.title}</span>
        <section className="flex gap-4">
          <Button
            className="w-60"
            variant="outline"
            onClick={() => handleOpen('BONUS')}
          >
            <BanknoteArrowUp />
            <span>{SalarySummaryTexts.addBonus}</span>
          </Button>
          <Button className="w-40" onClick={() => handleOpen('DEDUCTION')}>
            <BanknoteArrowDown />
            <span>{SalarySummaryTexts.addDeduction}</span>
          </Button>
        </section>
      </div>
      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl shadow-md">
          <CardContent className="p-6 flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">Salario Base</span>
            <span className="text-2xl font-semibold">
              {formatCurrency(salarioBase)}
            </span>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-md">
          <CardContent className="p-6 flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">
              Bono por Antigüedad
            </span>
            <span className="text-2xl font-semibold">
              {formatCurrency(bonoAntiguedad)}
            </span>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-md bg-green-50">
          <CardContent className="p-6 flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">Salario Final</span>
            <span className="text-2xl font-bold text-green-700">
              {formatCurrency(salarioFinal)}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Detalle */}
      <section className="flex flex-col gap-2 rounded-xl border p-4">
        <span className="text-lg font-semibold">Detalle de cálculo</span>
        <Separator />
        <div className="flex justify-between text-sm">
          <span>Salario base</span>
          <span>{formatCurrency(salarioBase)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Bono por antigüedad</span>
          <span>{formatCurrency(bonoAntiguedad)}</span>
        </div>

        {/* Bonos adicionales */}
        {bonosAdicionales.length > 0 && (
          <>
            <span className="text-sm font-medium mt-2">Bonos adicionales:</span>
            {bonosAdicionales.map((bono, idx) => (
              <div key={idx} className="flex justify-between text-sm pl-4">
                <span>{bono.nombre}</span>
                <span>{formatCurrency(bono.monto)}</span>
              </div>
            ))}
          </>
        )}

        {/* Deducciones */}
        {deducciones.length > 0 && (
          <>
            <span className="text-sm font-medium mt-2 text-red-600">
              Deducciones:
            </span>
            {deducciones.map((deduccion, idx) => (
              <div
                key={idx}
                className="flex justify-between text-sm pl-4 text-red-600"
              >
                <span>{deduccion.nombre}</span>
                <span>- {formatCurrency(deduccion.monto)}</span>
              </div>
            ))}
          </>
        )}

        <Separator className="my-2" />
        <div className="flex justify-between font-bold text-base">
          <span>Total</span>
          <span>{formatCurrency(salarioFinal)}</span>
        </div>
      </section>
    </section>
  );
}
