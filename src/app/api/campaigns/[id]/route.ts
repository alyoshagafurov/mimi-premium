import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ensureAdmin } from '@/lib/api-guard';

const schema = z.object({
  name: z.string().min(1).optional(),
  platform: z.string().min(1).optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'FINISHED']).optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!(await ensureAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const data = schema.parse(await req.json());
    const campaign = await prisma.campaign.update({ where: { id: params.id }, data });
    return NextResponse.json(campaign);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Bad request' }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!(await ensureAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  await prisma.campaign.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
