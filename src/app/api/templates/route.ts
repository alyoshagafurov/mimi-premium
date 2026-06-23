import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureAdmin } from '@/lib/api-guard';

export async function GET() {
  const me = await ensureAdmin();
  if (!me) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const templates = await prisma.taskTemplate.findMany({
    include: { items: { orderBy: { position: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ templates });
}

export async function POST(req: Request) {
  const me = await ensureAdmin();
  if (!me) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const body = await req.json();
  const t = await prisma.taskTemplate.create({
    data: {
      name: body.name,
      description: body.description ?? null,
      items: {
        create: (body.items ?? []).map((it: any, i: number) => ({
          title: it.title,
          offsetDays: it.offsetDays ?? 0,
          priority: it.priority ?? 'MEDIUM',
          position: i,
        })),
      },
    },
    include: { items: true },
  });
  return NextResponse.json(t);
}
