import { NextResponse } from 'next/server';
import { getSafeSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { ensureAdmin } from '@/lib/api-guard';
import { notify } from '@/lib/notify';

export async function GET(req: Request) {
  const session = await getSafeSession();
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const me = session.user as any;
  const url = new URL(req.url);
  let clientId = url.searchParams.get('clientId');
  if (me.role === 'CLIENT') {
    const c = await prisma.client.findUnique({ where: { ownerId: me.id }, select: { id: true } });
    if (!c) return NextResponse.json({ invoices: [] });
    clientId = c.id;
  }
  const where = clientId ? { clientId } : {};
  const invoices = await prisma.invoice.findMany({
    where,
    orderBy: { issuedAt: 'desc' },
    include: { client: { select: { businessName: true } } },
  });
  return NextResponse.json({ invoices });
}

export async function POST(req: Request) {
  const me = await ensureAdmin();
  if (!me) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const body = await req.json();
  const count = await prisma.invoice.count();
  const number = `INV-${String(count + 1).padStart(5, '0')}`;
  const inv = await prisma.invoice.create({
    data: {
      number,
      clientId: body.clientId,
      amount: parseFloat(body.amount),
      description: body.description ?? null,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      status: 'SENT',
    },
  });
  const c = await prisma.client.findUnique({ where: { id: body.clientId }, include: { owner: true } });
  if (c?.owner) {
    await notify({
      userId: c.owner.id,
      kind: 'PAYMENT',
      title: `Новый счёт ${number}`,
      body: `${body.amount} сомони · ${body.description ?? ''}`,
      link: '/dashboard/invoices',
      email: true,
    });
  }
  return NextResponse.json(inv);
}
