import { prisma } from './prisma';
import { getSafeSession } from './session';

type AuditAction = 'created' | 'updated' | 'deleted' | 'status';

type AuditEntry = {
  action: AuditAction;
  entity: string; // client | report | payment | user | project | ...
  entityId?: string | null;
  summary: string;
  /** Override the actor; by default it is taken from the current session. */
  actorId?: string | null;
  actorName?: string;
  actorRole?: string | null;
};

/**
 * Record one audit-trail entry. Resolves the acting user from the session when
 * not supplied. Never throws — auditing must not break the action it logs.
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    let { actorId, actorName, actorRole } = entry;
    if (!actorName) {
      const session = await getSafeSession();
      const u = session?.user as any;
      actorId = u?.id ?? null;
      actorName = session?.user?.name ?? 'Система';
      actorRole = u?.role ?? null;
    }
    await prisma.auditLog.create({
      data: {
        actorId: actorId ?? null,
        actorName: actorName || 'Система',
        actorRole: actorRole ?? null,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId ?? null,
        summary: entry.summary,
      },
    });
  } catch {
    // swallow — a failed audit write must never surface to the user
  }
}
