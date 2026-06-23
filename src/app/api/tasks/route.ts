import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ensureAdmin } from '@/lib/api-guard';
import { TaskPriority } from '@prisma/client';

const schema = z.object({
  title: z.string().min(1),
  dueDate: z.string().nullable().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  ownerId: z.string().nullable().optional(),
  clientId: z.string().nullable().optional(),
  dealId: z.string().nullable().optional(),
});

/** Admin: create a task (optionally linked to a client or a deal). */
export async function POST(req: Request) {
  if (!(await ensureAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const data = schema.parse(await req.json());
    const task = await prisma.task.create({
      data: {
        title: data.title,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        priority: (data.priority as TaskPriority) ?? 'MEDIUM',
        ownerId: data.ownerId ?? null,
        clientId: data.clientId ?? null,
        dealId: data.dealId ?? null,
      },
    });
    return NextResponse.json(task);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Bad request' }, { status: 400 });
  }
}
