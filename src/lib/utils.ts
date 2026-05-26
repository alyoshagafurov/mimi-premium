import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Money formatter — agency quotes in Tajik Somoni. */
export const formatMoney = (n: number) =>
  `${new Intl.NumberFormat('ru-RU').format(Math.round(n))} сомони`;

/** Back-compat alias used by dashboards built earlier. */
export const formatRub = formatMoney;

export const formatInt = (n: number) =>
  new Intl.NumberFormat('ru-RU').format(Math.round(n));

export const formatPct = (n: number, withSign = false) =>
  `${withSign && n > 0 ? '+' : ''}${Math.round(n)}%`;

/**
 * Tariff names per brandbook brochure:
 *   START   → PRO       2 500 сомони / мес
 *   GROWTH  → STANDART  6 000 первый месяц, 5 000 со второго
 *   PREMIUM → ELITE     10 000 первый месяц, 8 000 со второго
 * Enum stored unchanged in DB to keep schema stable.
 */
export const tariffLabel = (t: string) => {
  switch (t) {
    case 'START': return 'PRO';
    case 'GROWTH': return 'STANDART';
    case 'PREMIUM': return 'ELITE';
    default: return 'Не выбран';
  }
};

/** First-month price in somoni (used by checkout). */
export const tariffPrice = (t: string) => {
  switch (t) {
    case 'START': return 2500;
    case 'GROWTH': return 6000;
    case 'PREMIUM': return 10000;
    default: return 0;
  }
};

/** Recurring price from month 2 (some tariffs have a different rate). */
export const tariffRecurring = (t: string) => {
  switch (t) {
    case 'START': return 2500;
    case 'GROWTH': return 5000;
    case 'PREMIUM': return 8000;
    default: return 0;
  }
};

export const statusColor = (status: string) => {
  switch (status) {
    case 'ACTIVE': return 'text-brand-lime';
    case 'PAUSED': return 'text-brand-orange';
    case 'SCALING': return 'text-brand-lime';
    case 'ARCHIVED': return 'text-muted';
    case 'NEW': return 'text-brand-lime';
    case 'WORKING': return 'text-brand-orange';
    case 'CLOSED': return 'text-muted';
    default: return 'text-light';
  }
};

export const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    ACTIVE: 'Активна',
    PAUSED: 'Пауза',
    SCALING: 'Масштабируем',
    ARCHIVED: 'Архив',
    NEW: 'Новая',
    WORKING: 'В работе',
    CLOSED: 'Закрыта',
  };
  return map[status] ?? status;
};
