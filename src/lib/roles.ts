import type { Role } from '@prisma/client';

/** Calendar / event categories — drive the calendar tabs and per-role visibility. */
export type EventCategory = 'GENERAL' | 'VIDEO' | 'MONTAGE' | 'DESIGN' | 'SALES' | 'TARGET' | 'WEB';
export const EVENT_CATEGORIES: EventCategory[] = ['GENERAL', 'VIDEO', 'MONTAGE', 'DESIGN', 'SALES', 'TARGET', 'WEB'];

/** Admin panel sections (used for the sidebar + route gating). */
export type AdminSection =
  | 'dashboard' | 'clients' | 'projects' | 'sales' | 'whatsapp'
  | 'calendar' | 'notes' | 'people' | 'finance' | 'tasks' | 'cases' | 'reviews' | 'settings';

/** Everyone who works at the agency (may enter /admin). Clients use /dashboard. */
export const STAFF_ROLES: Role[] = [
  'ADMIN', 'OPS_DIRECTOR', 'VIDEOGRAPHER', 'MONTAGE', 'SALES', 'DESIGNER', 'TARGETOLOGIST', 'DEVELOPER',
];

/**
 * У сотрудника может быть несколько специальностей: видеограф + монтажёр,
 * разработчик + продажник и т.д. Основная роль лежит в `User.role`, весь набор —
 * в `User.roles`. Хелперы ниже принимают и одну роль, и список, поэтому старые
 * вызовы вида isStaff(user.role) продолжают работать.
 */
export type RoleInput = string | null | undefined | readonly (string | null | undefined)[];

/** Привести роль или список ролей к массиву без пустых значений. */
export function asRoles(role?: RoleInput): string[] {
  if (!role) return [];
  return (Array.isArray(role) ? role : [role]).filter(Boolean) as string[];
}

/** Все роли пользователя: набор специальностей, а если его нет — основная роль. */
export function userRoles(user?: { role?: string | null; roles?: readonly string[] | null } | null): string[] {
  if (!user) return [];
  return user.roles?.length ? [...user.roles] : asRoles(user.role);
}

export function isStaff(role?: RoleInput): boolean {
  return asRoles(role).some((r) => (STAFF_ROLES as string[]).includes(r));
}
/** Admin + Operations Director see the whole panel (ops has revenue hidden). */
export function isAdminLike(role?: RoleInput): boolean {
  return asRoles(role).some((r) => r === 'ADMIN' || r === 'OPS_DIRECTOR');
}
/**
 * Roles that work the CRM: they may add leads and see every lead on the board.
 * Personal lead *statistics* are still scoped — only ADMIN sees everyone's
 * numbers (see canSeeRevenue).
 */
export const LEAD_ROLES: Role[] = ['ADMIN', 'OPS_DIRECTOR', 'SALES', 'DEVELOPER'];

export function canWorkLeads(role?: RoleInput): boolean {
  return asRoles(role).some((r) => (LEAD_ROLES as string[]).includes(r));
}

/** Only the full ADMIN sees company revenue figures. */
export function canSeeRevenue(role?: RoleInput): boolean {
  return asRoles(role).includes('ADMIN');
}

export const ROLE_LABEL: Record<Role, string> = {
  CLIENT: 'Клиент',
  ADMIN: 'Администратор',
  OPS_DIRECTOR: 'Операционный директор',
  VIDEOGRAPHER: 'Видеограф',
  MONTAGE: 'Монтажёр',
  SALES: 'Продажник',
  DESIGNER: 'Дизайнер',
  TARGETOLOGIST: 'Таргетолог',
  DEVELOPER: 'Разработчик',
};

/** Staff roles that can be created in the Team section (not CLIENT). */
export const ASSIGNABLE_ROLES: Role[] = [
  'OPS_DIRECTOR', 'VIDEOGRAPHER', 'MONTAGE', 'SALES', 'DESIGNER', 'DEVELOPER', 'ADMIN',
];

/**
 * Разобрать набор специальностей из запроса админки.
 * Возвращает либо список ролей (основная — первая), либо причину отказа.
 * Правило: ADMIN не совмещается с другими специальностями.
 */
export function parseRoleSet(raw: unknown): { roles: Role[] } | { error: string } {
  const list = (Array.isArray(raw) ? raw : [raw]).filter(Boolean) as string[];
  const uniq = Array.from(new Set(list));
  if (!uniq.length) return { error: 'Выберите хотя бы одну специальность' };
  if (uniq.some((r) => !(ASSIGNABLE_ROLES as string[]).includes(r))) {
    return { error: 'Недопустимая специальность' };
  }
  if (uniq.includes('ADMIN') && uniq.length > 1) {
    return { error: 'Администратор не совмещается с другими специальностями' };
  }
  return { roles: uniq as Role[] };
}

/** Sales pipeline statuses — order defines the board columns. */
export const SALES_STATUSES = ['NEW_LEAD', 'POTENTIAL_LEAD', 'CONSULTATION', 'PREPAYMENT', 'PARTNER'] as const;
export type SalesStatus = (typeof SALES_STATUSES)[number];
export const SALES_STATUS_LABEL: Record<SalesStatus, string> = {
  NEW_LEAD: 'Новый лид',
  POTENTIAL_LEAD: 'Потенциальный лид',
  CONSULTATION: 'Запись на консультацию',
  PREPAYMENT: 'Предоплата',
  PARTNER: 'Партнёр',
};

/**
 * Источники лидов — порядок задаёт колонки в статистике по источникам.
 * UNKNOWN ставится автоматически, когда достоверных данных нет: догадка
 * источником не считается.
 */
export const LEAD_SOURCES = [
  'INSTAGRAM', 'INSTAGRAM_ADS', 'VIDEO', 'WHATSAPP', 'WEBSITE', 'TELEGRAM', 'REFERRAL', 'OTHER', 'UNKNOWN',
] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];
export const LEAD_SOURCE_LABEL: Record<LeadSource, string> = {
  INSTAGRAM: 'Instagram',
  INSTAGRAM_ADS: 'Реклама Instagram',
  VIDEO: 'Видео',
  WHATSAPP: 'WhatsApp',
  WEBSITE: 'Сайт',
  TELEGRAM: 'Telegram',
  REFERRAL: 'Рекомендация',
  OTHER: 'Другое',
  UNKNOWN: 'Неизвестный источник',
};

export const PACKAGES = [
  'NONE', 'PRO', 'STANDART', 'ELITE', 'TARGET_2500', 'TARGET_3000',
  'DEVELOPMENT', 'DESIGN', 'SCRIPT', 'MASTERCLASS',
] as const;
export type ClientPackage = (typeof PACKAGES)[number];
export const PACKAGE_LABEL: Record<ClientPackage, string> = {
  NONE: 'Не выбран',
  PRO: 'PRO',
  STANDART: 'STANDART',
  ELITE: 'ELITE',
  TARGET_2500: 'Таргет 2500',
  TARGET_3000: 'Таргет 3000',
  DEVELOPMENT: 'Разработка',
  DESIGN: 'Дизайн',
  SCRIPT: 'Скрипт продаж',
  MASTERCLASS: 'Мастер-класс',
};

/* ─── Production statuses (per-role project workflow) ─── */
export const WORK_STATUSES = ['PLANNED', 'IN_PROGRESS', 'DONE'] as const;
export type WorkStatus = (typeof WORK_STATUSES)[number];

export type ProductionKind = 'shooting' | 'montage' | 'design' | 'dev';
export type ProductionField = 'shootingStatus' | 'montageStatus' | 'designStatus' | 'devStatus';

/**
 * The four production disciplines, who owns each, and the wording each uses for
 * its three states: съёмка → видеограф, монтаж → монтажёр, дизайн → дизайнер,
 * разработка → разработчик (admin/ops can change any).
 */
export const PRODUCTION: {
  kind: ProductionKind;
  field: ProductionField;
  title: string;
  ownerRoles: Role[];
  labels: Record<WorkStatus, string>;
}[] = [
  { kind: 'shooting', field: 'shootingStatus', title: 'Съёмка', ownerRoles: ['VIDEOGRAPHER'],
    labels: { PLANNED: 'Планируется', IN_PROGRESS: 'В ожидании', DONE: 'Съёмка проведена' } },
  { kind: 'montage', field: 'montageStatus', title: 'Монтаж', ownerRoles: ['MONTAGE'],
    labels: { PLANNED: 'Планируется', IN_PROGRESS: 'В ожидании', DONE: 'Монтаж сдан' } },
  { kind: 'design', field: 'designStatus', title: 'Дизайн', ownerRoles: ['DESIGNER'],
    labels: { PLANNED: 'Планируется', IN_PROGRESS: 'В ожидании', DONE: 'Сделано' } },
  { kind: 'dev', field: 'devStatus', title: 'Разработка', ownerRoles: ['DEVELOPER'],
    labels: { PLANNED: 'Планируется', IN_PROGRESS: 'В процессе', DONE: 'Готово' } },
];

export const PRODUCTION_BY_KIND = Object.fromEntries(
  PRODUCTION.map((p) => [p.kind, p]),
) as Record<ProductionKind, (typeof PRODUCTION)[number]>;

/** Admin/ops can change any discipline; a specialist only the one they own. */
export function canEditProduction(role: RoleInput, kind: ProductionKind): boolean {
  if (isAdminLike(role)) return true;
  const p = PRODUCTION_BY_KIND[kind];
  // Хватает одной подходящей специальности: монтажёр-дизайнер ведёт оба этапа.
  return !!p && asRoles(role).some((r) => (p.ownerRoles as string[]).includes(r));
}

export const CATEGORY_LABEL: Record<EventCategory, string> = {
  GENERAL: 'Общий',
  VIDEO: 'Видео',
  MONTAGE: 'Монтаж',
  DESIGN: 'Дизайн',
  SALES: 'Продажи',
  TARGET: 'Таргет',
  WEB: 'Веб',
};

/** Какие календари видит одна специальность. */
const CATEGORIES_BY_ROLE: Record<string, EventCategory[]> = {
  VIDEOGRAPHER: ['VIDEO'],
  MONTAGE: ['MONTAGE'],
  DESIGNER: ['DESIGN'],
  SALES: ['SALES', 'GENERAL'],
  TARGETOLOGIST: ['TARGET'],
  DEVELOPER: ['WEB'],
};

/**
 * Календари сотрудника — объединение по всем его специальностям: видеограф +
 * монтажёр видит и «Видео», и «Монтаж».
 */
export function visibleCategories(role?: RoleInput): EventCategory[] {
  const roles = asRoles(role);
  if (isAdminLike(roles)) return [...EVENT_CATEGORIES];
  const seen = new Set<EventCategory>();
  for (const r of roles) for (const c of CATEGORIES_BY_ROLE[r] ?? []) seen.add(c);
  return EVENT_CATEGORIES.filter((c) => seen.has(c));
}

/**
 * Section access. Phase 1: admin + ops see everything; every other staff role
 * is limited to the calendar (their specialised sections open in later phases).
 */
/** Sections each specialised staff role may open (beyond calendar + projects). */
const ROLE_SECTIONS: Record<string, AdminSection[]> = {
  SALES: ['calendar', 'notes', 'people', 'settings', 'tasks', 'projects', 'sales', 'whatsapp'],
  DESIGNER: ['calendar', 'notes', 'people', 'settings', 'tasks', 'projects'],
  DEVELOPER: ['calendar', 'notes', 'people', 'settings', 'tasks', 'projects', 'sales', 'whatsapp'],
  VIDEOGRAPHER: ['calendar', 'notes', 'people', 'settings', 'tasks', 'projects'],
  MONTAGE: ['calendar', 'notes', 'people', 'settings', 'tasks', 'projects'],
};

export function canAccessSection(role: RoleInput, section: AdminSection): boolean {
  const roles = asRoles(role);
  if (roles.includes('ADMIN')) return true;
  // «Финансы» — это выручка целиком, её видит только полный админ.
  if (roles.includes('OPS_DIRECTOR')) return section !== 'finance';
  // Разделы складываются: разработчик + продажник открывает и «Продажи».
  return roles.some((r) => (ROLE_SECTIONS[r] ?? []).includes(section));
}

/** Map an /admin pathname to its section (for middleware gating). */
export function sectionFromPath(pathname: string): AdminSection {
  if (pathname === '/admin' || pathname === '/admin/') return 'dashboard';
  const seg = pathname.replace(/^\/admin\/?/, '').split('/')[0];
  const map: Record<string, AdminSection> = {
    clients: 'clients', projects: 'projects', sales: 'sales', whatsapp: 'whatsapp',
    calendar: 'calendar', notes: 'notes', people: 'people', team: 'people',
    finance: 'finance', tasks: 'tasks', settings: 'settings',
    cases: 'cases', reviews: 'reviews',
  };
  return map[seg] ?? 'dashboard';
}
