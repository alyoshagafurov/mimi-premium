import type { Role } from '@prisma/client';

/** Calendar / event categories — drive the calendar tabs and per-role visibility. */
export type EventCategory = 'GENERAL' | 'VIDEO' | 'DESIGN' | 'SALES' | 'TARGET' | 'WEB';
export const EVENT_CATEGORIES: EventCategory[] = ['GENERAL', 'VIDEO', 'DESIGN', 'SALES', 'TARGET', 'WEB'];

/** Admin panel sections (used for the sidebar + route gating). */
export type AdminSection =
  | 'dashboard' | 'clients' | 'projects' | 'leads' | 'content' | 'cases' | 'blog'
  | 'media' | 'calendar' | 'analytics' | 'team' | 'integrations' | 'settings';

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
export function canAccessSection(role: string | null | undefined, section: AdminSection): boolean {
  if (role === 'ADMIN') return true;
  if (role === 'OPS_DIRECTOR') return true;
  // Other staff: calendar + read-only projects (specialised sections open later).
  if (isStaff(role)) return section === 'calendar' || section === 'projects';
  return false;
}

/** Map an /admin pathname to its section (for middleware gating). */
export function sectionFromPath(pathname: string): AdminSection {
  if (pathname === '/admin' || pathname === '/admin/') return 'dashboard';
  const seg = pathname.replace(/^\/admin\/?/, '').split('/')[0];
  const map: Record<string, AdminSection> = {
    clients: 'clients', projects: 'projects', leads: 'leads', content: 'content', cases: 'cases', blog: 'blog',
    media: 'media', calendar: 'calendar', analytics: 'analytics', team: 'team',
    integrations: 'integrations', settings: 'settings',
  };
  return map[seg] ?? 'dashboard';
}
