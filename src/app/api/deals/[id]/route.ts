import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ensureAdmin } from '@/lib/api-guard';
import { dealStageLabel } from '@/lib/utils';

const schema = z.object({
  title: z.string().min(1).optional(),
  contactName: z.string().min(1).optional(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  message: z.string().nullable().optional(),
  amount: z.number().nonnegative().optional(),
  stage: z.enum(['NEW', 'NEGOTIATION', 'PROPOSAL', 'WON', 'LOST']).optional(),
  position: z.number().int().optional(),
  ownerId: z.string().nullable().optional(),
  clientId: z.string().nullable().optional(),
});

/** Admin: full deal with its timeline + tasks (for the pipeline drawer). */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  if (!(await ensureAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const deal = await prisma.deal.findUnique({
    where: { id: params.id },
    include: {
      owner: { select: { id: true, name: true } },
      client: { select: { id: true, businessName: true } },
      activities: {
        orderBy: { createdAt: 'desc' },
        include: { author: { select: { name: true } } },
      },
      tasks: { orderBy: [{ done: 'asc' }, { dueDate: 'asc' }] },
    },
  });
  if (!deal) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(deal);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await ensureAdmin();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const data = schema.parse(await req.json());

    const existing = await prisma.deal.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const deal = await prisma.deal.update({ where: { id: params.id }, data });

    // Log a timeline entry when the pipeline stage changes.
    if (data.stage && data.stage !== existing.stage) {
      await prisma.activity.create({
        data: {
          kind: 'STAGE',
          body: `Этап: ${dealStageLabel(existing.stage)} → ${dealStageLabel(data.stage)}`,
          dealId: deal.id,
          authorId: (session.user as any).id ?? null,
        },
      });
    }

    return NextResponse.json(deal);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Bad request' }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!(await ensureAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  await prisma.deal.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
