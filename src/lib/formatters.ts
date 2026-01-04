import { FormatTexts } from '@/constants/localize';
import { intervalToDuration, formatDuration } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatDate(
  date: string | Date,
  locale: string = 'es-ES'
): string {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  };

  return new Date(date).toLocaleDateString(locale, options);
}

export function formatDateHireDate(hireDate: Date): string {
  const duration = intervalToDuration({
    start: hireDate,
    end: new Date(),
  });

  const formatted = formatDuration(duration, {
    format: ['years', 'months', 'weeks', 'days'],
    locale: es,
  });

  return formatted || FormatTexts.lessThanOneDay;
}
