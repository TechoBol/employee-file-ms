import { format } from 'date-fns';

export const MONTH_CUTOFF_DAY = 15;

const formatMonthYear = (date: Date) => {
  return date.toLocaleDateString('es-BO', {
    year: 'numeric',
    month: 'long',
  });
};

/**
 * Obtiene el rango de fechas para un mes específico, considerando
 * el día de corte para determinar si aún estamos en el "mes actual".
 * 
 * @param monthsAgo - Número de meses hacia atrás (0 = mes actual, 1 = mes anterior, etc.)
 * @param applyCutoff - Si true, aplica la lógica de MONTH_CUTOFF_DAY. Por defecto true.
 *                      Si false, ignora el día de corte y calcula normalmente.
 * @returns Objeto con startDate, endDate (formato 'yyyy-MM-dd') y label (mes/año formateado)
 */
export const getMonthRange = (monthsAgo: number, applyCutoff: boolean = true) => {
  const now = new Date();

  const adjustedMonthsAgo = applyCutoff && now.getDate() <= MONTH_CUTOFF_DAY
    ? monthsAgo + 1
    : monthsAgo;

  const startDate = new Date(
    now.getFullYear(),
    now.getMonth() - adjustedMonthsAgo,
    1
  );

  const endDate = new Date(
    now.getFullYear(),
    now.getMonth() - adjustedMonthsAgo + 1,
    0,
    23,
    59,
    59
  );

  return {
    startDate: format(startDate, 'yyyy-MM-dd'),
    endDate: format(endDate, 'yyyy-MM-dd'),
    label: formatMonthYear(startDate),
  };
};
