import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ensureAdmin } from '@/lib/api-guard';
import { ActivityKind } from '@prisma/client';

const schema = z
  .object({
    kind: z.enum(['NOTE', 'CALL', 'MEETING', 'EMAIL']).default('NOTE'),
    body: z.string().min(1),
    clientId: z.string().nullable().optional(),
    dealId: z.string().nullable().optional(),
  })
  .refine((d) => d.clientId || d.dealId, { message: 'clientId or dealId required' });

/** Admin: log a timeline entry (note / call / meeting / email) on a client or deal. */
export async function POST(req: Request) {
  const session = await ensureAdmin();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const data = schema.parse(await req.json());
    const activity = await prisma.activity.create({
      data: {
        kind: data.kind as ActivityKind,
        body: data.body,
        clientId: data.clientId ?? null,
        dealId: data.dealId ?? null,
        authorId: (session.user as any).id ?? null,
      },
    });
    return NextResponse.json(activity);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Bad request' }, { status: 400 });
  }
}
