import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ensureAdmin } from '@/lib/api-guard';
import { DealStage } from '@prisma/client';

const schema = z.object({
  title: z.string().min(1),
  contactName: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().optional(),
  message: z.string().optional(),
  source: z.string().optional(),
  amount: z.number().nonnegative().optional(),
  stage: z.enum(['NEW', 'NEGOTIATION', 'PROPOSAL', 'WON', 'LOST']).optional(),
  ownerId: z.string().nullable().optional(),
  clientId: z.string().nullable().optional(),
});

/** Admin: list every deal (for the pipeline board). */
export async function GET() {
  if (!(await ensureAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const deals = await prisma.deal.findMany({
    orderBy: [{ stage: 'asc' }, { position: 'asc' }, { createdAt: 'desc' }],
    include: { owner: { select: { id: true, name: true } }, client: { select: { id: true, businessName: true } } },
  });
  return NextResponse.json(deals);
}

/** Admin: create a deal manually. */
export async function POST(req: Request) {
  if (!(await ensureAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const data = schema.parse(await req.json());
    const deal = await prisma.deal.create({
      data: {
        title: data.title,
        contactName: data.contactName,
        phone: data.phone,
        email: data.email,
        message: data.message,
        source: data.source ?? 'Вручную',
        amount: data.amount ?? 0,
        stage: (data.stage as DealStage) ?? 'NEW',
        ownerId: data.ownerId ?? null,
        clientId: data.clientId ?? null,
      },
    });
    return NextResponse.json(deal);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Bad request' }, { status: 400 });
  }
}
