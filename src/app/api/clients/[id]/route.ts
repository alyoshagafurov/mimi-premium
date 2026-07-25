import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ensureAdmin } from '@/lib/api-guard';
import { Tariff } from '@prisma/client';

const schema = z.object({
  businessName: z.string().optional(),
  niche: z.string().optional(),
  logo: z.string().nullable().optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
  tariff: z.enum(['NONE', 'START', 'GROWTH', 'PREMIUM']).optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!(await ensureAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const { tariff, ...clientData } = schema.parse(await req.json());
    const client = await prisma.client.update({
      where: { id: params.id },
      data: {
        ...clientData,
        ...(tariff ? { owner: { update: { tariff: tariff as Tariff } } } : {}),
      },
    });
    return NextResponse.json(client);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Bad request' }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!(await ensureAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    // Removing the owning user cascades to the client and all its reports.
    const client = await prisma.client.findUnique({ where: { id: params.id } });
    if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await prisma.user.delete({ where: { id: client.ownerId } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Bad request' }, { status: 400 });
  }
}
