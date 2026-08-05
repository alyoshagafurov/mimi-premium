import type { Role } from '@prisma/client';

/** Calendar / event categories — drive the calendar tabs and per-role visibility. */
export type EventCategory = 'GENERAL' | 'VIDEO' | 'DESIGN' | 'SALES' | 'TARGET' | 'WEB';
export const EVENT_CATEGORIES: EventCategory[] = ['GENERAL', 'VIDEO', 'DESIGN', 'SALES', 'TARGET', 'WEB'];

/** Admin panel sections (used for the sidebar + route gating). */
export type AdminSection =
  | 'dashboard' | 'clients' | 'projects' | 'sales' | 'tasks' | 'ads' | 'leads'
  | 'content' | 'cases' | 'blog' | 'media' | 'calendar' | 'analytics' | 'team'
  | 'chat' | 'integrations' | 'audit' | 'settings';

/** Everyone who works at the agency (may enter /admin). Clients use /dashboard. */
export const STAFF_ROLES: Role[] = [
  'ADMIN', 'OPS_DIRECTOR', 'VIDEOGRAPHER', 'SALES', 'DESIGNER', 'TARGETOLOGIST', 'DEVELOPER',
];

export function isStaff(role?: string | null): boolean {
  return !!role && (STAFF_ROLES as string[]).includes(role);
}
/** Admin + Operations Director see the whole panel (ops has revenue hidden). */
export function isAdminLike(role?: string | null): boolean {
  return role === 'ADMIN' || role === 'OPS_DIRECTOR';
}
/** Only the full ADMIN sees company revenue figures. */
export function canSeeRevenue(role?: string | null): boolean {
  return role === 'ADMIN';
}

export const ROLE_LABEL: Record<Role, string> = {
  CLIENT: 'Клиент',
  ADMIN: 'Администратор',
  OPS_DIRECTOR: 'Операционный директор',
  VIDEOGRAPHER: 'Видеограф',
  SALES: 'Продажник',
  DESIGNER: 'Дизайнер',
  TARGETOLOGIST: 'Таргетолог',
  DEVELOPER: 'Разработчик',
};

/** Staff roles that can be created in the Team section (not CLIENT). */
export const ASSIGNABLE_ROLES: Role[] = [
  'OPS_DIRECTOR', 'VIDEOGRAPHER', 'SALES', 'DESIGNER', 'TARGETOLOGIST', 'DEVELOPER', 'ADMIN',
];

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
 * its three states. There is no separate «монтажёр» account role yet, so the
 * video team (VIDEOGRAPHER) owns both съёмка and монтаж.
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
  { kind: 'montage', field: 'montageStatus', title: 'Монтаж', ownerRoles: ['VIDEOGRAPHER'],
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
export function canEditProduction(role: string | null | undefined, kind: ProductionKind): boolean {
  if (isAdminLike(role)) return true;
  const p = PRODUCTION_BY_KIND[kind];
  return !!role && !!p && (p.ownerRoles as string[]).includes(role);
}

export const CATEGORY_LABEL: Record<EventCategory, string> = {
  GENERAL: 'Общий',
  VIDEO: 'Видео',
  DESIGN: 'Дизайн',
  SALES: 'Продажи',
  TARGET: 'Таргет',
  WEB: 'Веб',
};

/** Which event categories a role may see on the calendar. */
export function visibleCategories(role?: string | null): EventCategory[] {
  switch (role) {
    case 'ADMIN':
    case 'OPS_DIRECTOR':
      return [...EVENT_CATEGORIES];
    case 'VIDEOGRAPHER':
      return ['VIDEO'];
    case 'DESIGNER':
      return ['DESIGN'];
    case 'SALES':
      return ['SALES', 'GENERAL'];
    case 'TARGETOLOGIST':
      return ['TARGET'];
    case 'DEVELOPER':
      return ['WEB'];
    default:
      return [];
  }
}

/**
 * Section access. Phase 1: admin + ops see everything; every other staff role
 * is limited to the calendar (their specialised sections open in later phases).
 */
/** Sections each specialised staff role may open (beyond calendar + projects). */
const ROLE_SECTIONS: Record<string, AdminSection[]> = {
  SALES: ['calendar', 'projects', 'sales'],
  DESIGNER: ['calendar', 'projects', 'tasks'],
  DEVELOPER: ['calendar', 'projects', 'tasks'],
  TARGETOLOGIST: ['calendar', 'projects', 'ads'],
  VIDEOGRAPHER: ['calendar', 'projects'],
};

export function canAccessSection(role: string | null | undefined, section: AdminSection): boolean {
  if (role === 'ADMIN') return true;
  if (role === 'OPS_DIRECTOR') return true;
  if (isStaff(role)) return (ROLE_SECTIONS[role as string] ?? []).includes(section);
  return false;
}

/** Map an /admin pathname to its section (for middleware gating). */
export function sectionFromPath(pathname: string): AdminSection {
  if (pathname === '/admin' || pathname === '/admin/') return 'dashboard';
  const seg = pathname.replace(/^\/admin\/?/, '').split('/')[0];
  const map: Record<string, AdminSection> = {
    clients: 'clients', projects: 'projects', sales: 'sales', tasks: 'tasks', ads: 'ads',
    leads: 'leads', content: 'content', cases: 'cases', blog: 'blog',
    media: 'media', calendar: 'calendar', analytics: 'analytics', team: 'team',
    chat: 'chat', integrations: 'integrations', audit: 'audit', settings: 'settings',
  };
  return map[seg] ?? 'dashboard';
}
