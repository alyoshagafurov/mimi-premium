import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSafeSession } from '@/lib/session';
import { isAdminLike, canWorkLeads } from '@/lib/roles';
import { SALES_STATUSES, PACKAGES } from '@/lib/roles';
import { notify } from '@/lib/notify';
import { logAudit } from '@/lib/audit';
import { resolveVideoCover } from '@/lib/link-preview';

/**
 * Update the sales/CRM fields of a client.
 * Sales, admin and ops may edit CRM fields; only admin/ops may edit the tech spec.
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getSafeSession();
  const role = (session?.user as any)?.role as string | undefined;
  const adminLike = isAdminLike(role);
  if (!canWorkLeads(role)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  // A rep may only touch leads assigned to them; admin/ops may touch any.
  if (!adminLike) {
    const own = await prisma.client.findUnique({
      where: { id: params.id },
      select: { assignedToId: true },
    });
    if (!own || own.assignedToId !== (session?.user as any)?.id) {
      return NextResponse.json({ error: 'Это не ваш лид' }, { status: 403 });
    }
  }

  const body = await req.json().catch(() => ({}));
  const data: any = {};

  if (body.salesStatus && (SALES_STATUSES as readonly string[]).includes(body.salesStatus)) {
    data.salesStatus = body.salesStatus;
  }
  if (body.packageType && (PACKAGES as readonly string[]).includes(body.packageType)) {
    data.packageType = body.packageType;
  }
  if (typeof body.contactName === 'string') data.contactName = body.contactName.trim() || null;

  // Lead identity — keep contactName (used across the board) in sync.
  if (typeof body.firstName === 'string' || typeof body.lastName === 'string') {
    const existing = await prisma.client.findUnique({
      where: { id: params.id },
      select: { firstName: true, lastName: true },
    });
    const first = (typeof body.firstName === 'string' ? body.firstName : existing?.firstName ?? '').trim();
    const last = (typeof body.lastName === 'string' ? body.lastName : existing?.lastName ?? '').trim();
    data.firstName = first || null;
    data.lastName = last || null;
    const full = [first, last].filter(Boolean).join(' ');
    if (full) data.contactName = full;
  }

  // Lead origin (video / other source). The cover is always derived from the
  // link — re-resolve it whenever the link changes.
  if (body.sourceType === 'VIDEO' || body.sourceType === 'OTHER') data.sourceType = body.sourceType;
  if (typeof body.sourceUrl === 'string') {
    const url = body.sourceUrl.trim() || null;
    data.sourceUrl = url;
    data.sourceCover = url ? await resolveVideoCover(url) : null;
  }
  if (typeof body.sourceNote === 'string') data.sourceNote = body.sourceNote.trim() || null;
  if (typeof body.telegram === 'string') data.telegram = body.telegram.trim() || null;
  if (typeof body.instagram === 'string') data.instagram = body.instagram.trim() || null;
  if (typeof body.comment === 'string') data.comment = body.comment.trim() || null;
  if (typeof body.niche === 'string' && body.niche.trim()) data.niche = body.niche.trim();
  if ('reminderAt' in body) {
    data.reminderAt = body.reminderAt ? new Date(body.reminderAt) : null;
    if (body.reminderAt) data.reminderDone = false;
  }
  if (typeof body.reminderNote === 'string') data.reminderNote = body.reminderNote.trim() || null;
  if (typeof body.reminderDone === 'boolean') data.reminderDone = body.reminderDone;

  // Tech spec (ТЗ) — admin / ops director only.
  if (typeof body.techSpec === 'string') {
    if (!adminLike) return NextResponse.json({ error: 'ТЗ может заполнять только админ или опер. директор' }, { status: 403 });
    data.techSpec = body.techSpec.trim() || null;
  }

  // ── Transfer: hand the lead to another salesperson ──────────────
  // The notes stay on the lead, so the new owner inherits the full history.
  let transfer: { from: string; to: string; toId: string } | null = null;
  if (typeof body.assignedToId === 'string' && body.assignedToId) {
    const current = await prisma.client.findUnique({
      where: { id: params.id },
      select: { assignedToId: true, contactName: true, assignedTo: { select: { name: true } } },
    });
    if (current && current.assignedToId !== body.assignedToId) {
      const next = await prisma.user.findUnique({
        where: { id: body.assignedToId },
        select: { id: true, name: true, role: true },
      });
      if (!next) return NextResponse.json({ error: 'Сотрудник не найден' }, { status: 400 });
      data.assignedToId = next.id;
      transfer = { from: current.assignedTo?.name ?? '—', to: next.name, toId: next.id };
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Нечего обновлять' }, { status: 400 });
  }

  const client = await prisma.client.update({ where: { id: params.id }, data });

  if (transfer) {
    const summary = `Лид передан: ${transfer.from} → ${transfer.to}`;
    // Visible in the lead's notes feed so the new owner sees who had it before.
    await prisma.activity.create({
      data: { kind: 'NOTE', body: summary, clientId: params.id, authorId: (session!.user as any).id ?? null },
    });
    await notify({
      userId: transfer.toId,
      kind: 'LEAD',
      title: 'Вам передали лид',
      body: client.contactName ?? client.businessName,
      link: `/admin/sales/${params.id}`,
    }).catch(() => {});
    await logAudit({ action: 'updated', entity: 'lead', entityId: params.id, summary });
  }

  return NextResponse.json({ ok: true, client: { id: client.id } });
}

/**
 * Delete a lead. Removing the owning user cascades to the client and its notes.
 * Everyone who can add a lead (sales, admin, ops) can delete one, so a mistaken
 * entry is fixable by whoever made it.
 */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSafeSession();
  const me = session?.user as any;
  const role = me?.role as string | undefined;
  const adminLike = isAdminLike(role);
  if (!canWorkLeads(role)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const client = await prisma.client.findUnique({
    where: { id: params.id },
    select: {
      ownerId: true, businessName: true, contactName: true,
      salesStatus: true, createdById: true, assignedToId: true,
    },
  });
  if (!client) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  if (!adminLike) {
    if (client.assignedToId !== me?.id) {
      return NextResponse.json({ error: 'Это не ваш лид' }, { status: 403 });
    }
    // A converted partner is a real client, not a lead — admin only.
    if (client.salesStatus === 'PARTNER') {
      return NextResponse.json({ error: 'Партнёра удаляет только администратор' }, { status: 403 });
    }
  }

  await prisma.user.delete({ where: { id: client.ownerId } });
  await logAudit({
    action: 'deleted',
    entity: 'lead',
    entityId: params.id,
    summary: `Удалён лид «${client.contactName ?? client.businessName}»`,
  });
  return NextResponse.json({ ok: true });
}
