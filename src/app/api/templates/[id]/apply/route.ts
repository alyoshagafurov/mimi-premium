import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureAdmin } from '@/lib/api-guard';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const me = await ensureAdmin();
  if (!me) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const { clientId } = await req.json();
  if (!clientId) return NextResponse.json({ error: 'no_client' }, { status: 400 });
  const tpl = await prisma.taskTemplate.findUnique({
    where: { id: params.id },
    include: { items: { orderBy: { position: 'asc' } } },
  });
  if (!tpl) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const now = new Date();
  await prisma.$transaction(
    tpl.items.map((it) =>
      prisma.task.create({
        data: {
          title: it.title,
          priority: it.priority,
          clientId,
          dueDate: new Date(now.getTime() + it.offsetDays * 24 * 60 * 60 * 1000),
        },
      }),
    ),
  );
  return NextResponse.json({ ok: true, created: tpl.items.length });
}
