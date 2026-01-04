import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import type { GeneralSettingsResponse } from '@/rest-client/interface/response/GeneralSettingsResponse';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GeneralSettingsService } from '@/rest-client/services/GeneralSettingsService';

interface AlertState {
  type: 'success' | 'error' | null;
  message: string;
}

const settingsService = new GeneralSettingsService();

export default function GeneralSettingsPage() {
  const [settings, setSettings] = useState<GeneralSettingsResponse | null>(
    null
  );
  const [formData, setFormData] = useState({
    workingDaysPerMonth: 0,
    seniorityIncreasePercentage: 0,
    contributionAfpPercentage: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [alert, setAlert] = useState<AlertState>({ type: null, message: '' });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const data = await settingsService.getSettings();
      setSettings(data);
      setFormData({
        workingDaysPerMonth: data.workingDaysPerMonth,
        seniorityIncreasePercentage: data.seniorityIncreasePercentage,
        contributionAfpPercentage: data.contributionAfpPercentage,
      });
    } catch {
      showAlert('error', 'Error al cargar la configuración');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === '' ? 0 : parseFloat(value),
    }));
  };

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();

    try {
      setIsSaving(true);
      const data = settings
        ? await settingsService.patchSettings(settings.id, formData)
        : await settingsService.createSettings(formData);
      setSettings(data);
      showAlert('success', 'Configuración guardada exitosamente');
    } catch {
      showAlert('error', 'Error al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert({ type: null, message: '' }), 3000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className=" bg-gradient-to-br 0 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Configuración General
          </h1>
          <p className="text-slate-600">
            Gestiona los parámetros generales del sistema
          </p>
        </div>

        {alert.type && (
          <Alert
            className={`mb-6 border-l-4 ${
              alert.type === 'success'
                ? 'bg-green-50 border-green-500'
                : 'bg-red-50 border-red-500'
            }`}
          >
            {alert.type === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription
              className={
                alert.type === 'success' ? 'text-green-700' : 'text-red-700'
              }
            >
              {alert.message}
            </AlertDescription>
          </Alert>
        )}

        <Card className="shadow-sm border border-slate-200">
          <CardHeader className="border-b border-slate-200">
            <CardTitle className="text-xl">Parámetros del Sistema</CardTitle>
            <CardDescription>
              Actualiza los valores clave para la gestión operacional
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="workingDaysPerMonth"
                  className="text-slate-700 font-medium"
                >
                  Días Laborales por Mes
                </Label>
                <div className="relative">
                  <Input
                    id="workingDaysPerMonth"
                    name="workingDaysPerMonth"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.workingDaysPerMonth}
                    onChange={handleChange}
                    className="pr-8"
                    placeholder="Ej: 20"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                    días
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Número promedio de días laborales en un mes
                </p>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="seniorityIncreasePercentage"
                  className="text-slate-700 font-medium"
                >
                  Aumento de Antigüedad
                </Label>
                <div className="relative">
                  <Input
                    id="seniorityIncreasePercentage"
                    name="seniorityIncreasePercentage"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.seniorityIncreasePercentage}
                    onChange={handleChange}
                    className="pr-8"
                    placeholder="Ej: 5"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                    %
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Porcentaje de incremento anual por antigüedad
                </p>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="contributionAfpPercentage"
                  className="text-slate-700 font-medium"
                >
                  Aporte AFP
                </Label>
                <div className="relative">
                  <Input
                    id="contributionAfpPercentage"
                    name="contributionAfpPercentage"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.contributionAfpPercentage}
                    onChange={handleChange}
                    className="pr-8"
                    placeholder="Ej: 10"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                    %
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Porcentaje de contribución al fondo de pensiones
                </p>
              </div>

              <div className="flex gap-3 pt-6 border-t border-slate-200">
                <Button
                  variant="outline"
                  onClick={loadSettings}
                  disabled={isSaving}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className="flex-1"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar Cambios'
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 p-4 bg-slate-100 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-600">
            <span className="font-semibold">Nota:</span> Los cambios se aplican
            inmediatamente a todos los cálculos del sistema.
          </p>
        </div>
      </div>
    </div>
  );
}
