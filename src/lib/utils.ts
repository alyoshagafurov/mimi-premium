import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Money formatter — agency quotes in Tajik Somoni. */
export const formatMoney = (n: number) =>
  `${new Intl.NumberFormat('ru-RU').format(Math.round(n))} сомони`;

export const formatInt = (n: number) =>
  new Intl.NumberFormat('ru-RU').format(Math.round(n));

export const formatPct = (n: number, withSign = false) =>
  `${withSign && n > 0 ? '+' : ''}${Math.round(n)}%`;

/**
 * Tariff names per brandbook brochure (сомони):
 *   START   → PRO       5 000 / мес
 *   GROWTH  → STANDART  1-й мес 9 000, далее 8 000
 *   PREMIUM → ELITE     1-й мес 12 000, далее 10 000
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
    case 'START': return 5000;
    case 'GROWTH': return 9000;
    case 'PREMIUM': return 12000;
    default: return 0;
  }
};

/** Recurring monthly price (from the second month). */
export const tariffRecurring = (t: string) => {
  switch (t) {
    case 'START': return 5000;
    case 'GROWTH': return 8000;
    case 'PREMIUM': return 10000;
    default: return 0;
  }
};

export const statusColor = (status: string) => {
  switch (status) {
    case 'ACTIVE': return 'text-brand-lime';
    case 'PAUSED': return 'text-brand-orange';
    case 'FINISHED': return 'text-muted';
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
    FINISHED: 'Завершена',
    ARCHIVED: 'Архив',
    NEW: 'Новая',
    WORKING: 'В работе',
    CLOSED: 'Закрыта',
  };
  return map[status] ?? status;
};

/** Russian month names, indexed 1–12. */
export const MONTHS_RU = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
] as const;

/** "Июнь 2026" from month (1–12) + year. */
export const monthLabel = (month: number, year: number) =>
  `${MONTHS_RU[month - 1] ?? '—'} ${year}`;

/** Short lower-case month label, e.g. "июнь" (1–12). */
export const monthName = (month: number) => (MONTHS_RU[month - 1] ?? '—').toLowerCase();

/** ROAS like "3.4×" — revenue returned per somoni spent. */
export const formatRoas = (n: number) =>
  `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(n)}×`;

/* ─────────────────────────  CRM  ───────────────────────── */

/** Sales-pipeline stages in display order. */
export const DEAL_STAGES = ['NEW', 'NEGOTIATION', 'PROPOSAL', 'WON', 'LOST'] as const;
export type DealStage = (typeof DEAL_STAGES)[number];

export const dealStageLabel = (s: string) =>
  (({
    NEW: 'Новая заявка',
    NEGOTIATION: 'Переговоры',
    PROPOSAL: 'Коммерческое',
    WON: 'Клиент',
    LOST: 'Отказ',
  }) as Record<string, string>)[s] ?? s;

/** Accent classes per stage (text / border / bg) for column headers and pills. */
export const dealStageAccent = (s: string) =>
  (({
    NEW: 'text-brand-lime border-brand-lime/30 bg-brand-lime/[0.06]',
    NEGOTIATION: 'text-brand-orange border-brand-orange/30 bg-brand-orange/[0.06]',
    PROPOSAL: 'text-brand-purpleSoft border-brand-purpleLight/30 bg-brand-purple/[0.12]',
    WON: 'text-brand-lime border-brand-lime/40 bg-brand-lime/[0.1]',
    LOST: 'text-muted border-white/10 bg-white/[0.03]',
  }) as Record<string, string>)[s] ?? 'text-light border-white/10 bg-white/[0.03]';

export const taskPriorityLabel = (p: string) =>
  (({ LOW: 'Низкий', MEDIUM: 'Средний', HIGH: 'Высокий' }) as Record<string, string>)[p] ?? p;

export const taskPriorityAccent = (p: string) =>
  (({
    LOW: 'text-muted border-white/10',
    MEDIUM: 'text-brand-lime border-brand-lime/30',
    HIGH: 'text-brand-orange border-brand-orange/40',
  }) as Record<string, string>)[p] ?? 'text-light border-white/10';

export const paymentStatusLabel = (s: string) =>
  (({ PAID: 'Оплачено', PENDING: 'Ожидается', OVERDUE: 'Просрочено' }) as Record<string, string>)[s] ?? s;

export const paymentStatusAccent = (s: string) =>
  (({
    PAID: 'text-brand-lime border-brand-lime/30 bg-brand-lime/[0.08]',
    PENDING: 'text-brand-orange border-brand-orange/30 bg-brand-orange/[0.06]',
    OVERDUE: 'text-rose-400 border-rose-400/30 bg-rose-400/[0.06]',
  }) as Record<string, string>)[s] ?? 'text-light border-white/10';

export const activityKindLabel = (k: string) =>
  (({
    NOTE: 'Заметка',
    CALL: 'Звонок',
    MEETING: 'Встреча',
    EMAIL: 'Письмо',
    STAGE: 'Этап',
  }) as Record<string, string>)[k] ?? k;

export const activityKindIcon = (k: string) =>
  (({ NOTE: '✎', CALL: '☎', MEETING: '⏷', EMAIL: '✉', STAGE: '➜' }) as Record<string, string>)[k] ?? '•';

/** "12 июня 2026" */
export const formatDate = (d: string | Date) => {
  const date = typeof d === 'string' ? new Date(d) : d;
  return `${date.getDate()} ${MONTHS_RU_GENITIVE[date.getMonth()]} ${date.getFullYear()}`;
};

/** Genitive month names for date phrasing. */
export const MONTHS_RU_GENITIVE = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
] as const;

/** True when a due date is in the past (day-resolution). */
export const isOverdue = (d?: string | Date | null) => {
  if (!d) return false;
  const date = typeof d === 'string' ? new Date(d) : d;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

/** True when a date falls on today. */
export const isToday = (d?: string | Date | null) => {
  if (!d) return false;
  const date = typeof d === 'string' ? new Date(d) : d;
  const t = new Date();
  return date.getFullYear() === t.getFullYear() && date.getMonth() === t.getMonth() && date.getDate() === t.getDate();
};
