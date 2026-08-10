import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ensureStaff } from '@/lib/api-guard';

const schema = z.object({ body: z.string().min(1).max(2000) });

/** Staff: add an internal note to a project (stored as an Activity, kind NOTE). */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await ensureStaff();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const { body } = schema.parse(await req.json());
    const note = await prisma.activity.create({
      data: { kind: 'NOTE', body, clientId: params.id, authorId: (session.user as any).id ?? null },
      include: { author: { select: { name: true } } },
    });
    return NextResponse.json({
      id: note.id,
      body: note.body,
      author: note.author?.name ?? 'Сотрудник',
      createdAt: note.createdAt.toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Bad request' }, { status: 400 });
  }
}
