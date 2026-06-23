import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureAdmin } from '@/lib/api-guard';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const me = await ensureAdmin();
  if (!me) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const body = await req.json();
  const data: any = {};
  if ('status' in body) {
    data.status = body.status;
    if (body.status === 'PAID') data.paidAt = new Date();
  }
  if ('amount' in body) data.amount = parseFloat(body.amount);
  if ('description' in body) data.description = body.description;
  if ('dueDate' in body) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
  const inv = await prisma.invoice.update({ where: { id: params.id }, data });
  return NextResponse.json(inv);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const me = await ensureAdmin();
  if (!me) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  await prisma.invoice.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
