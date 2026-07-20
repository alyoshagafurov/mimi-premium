import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSafeSession } from '@/lib/session';
import { isAdminLike } from '@/lib/roles';
import { SALES_STATUSES, PACKAGES } from '@/lib/roles';

/**
 * Update the sales/CRM fields of a client.
 * Sales, admin and ops may edit CRM fields; only admin/ops may edit the tech spec.
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getSafeSession();
  const role = (session?.user as any)?.role as string | undefined;
  const adminLike = isAdminLike(role);
  if (!adminLike && role !== 'SALES') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
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

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Нечего обновлять' }, { status: 400 });
  }

  const client = await prisma.client.update({ where: { id: params.id }, data });
  return NextResponse.json({ ok: true, client: { id: client.id } });
}
