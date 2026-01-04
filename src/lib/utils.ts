import { clsx, type ClassValue } from "clsx"
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string) {
  try {
    return format(parseISO(dateString), 'PPP', { locale: es })
  } catch {
    return '';
  }
};
