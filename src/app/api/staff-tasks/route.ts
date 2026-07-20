import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureAdminLike } from '@/lib/api-guard';
import { EVENT_CATEGORIES } from '@/lib/roles';

/** Create a task for a team/assignee. Admin + ops director only. */
export async function POST(req: Request) {
  const session = await ensureAdminLike();
  if (!session) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const title = String(body.title ?? '').trim();
  if (!title) return NextResponse.json({ error: 'Введите название задачи' }, { status: 400 });

  const category = (EVENT_CATEGORIES as readonly string[]).includes(body.category) ? body.category : 'GENERAL';

  const task = await prisma.task.create({
    data: {
      title,
      description: body.description?.trim() || null,
      category,
      priority: ['LOW', 'MEDIUM', 'HIGH'].includes(body.priority) ? body.priority : 'MEDIUM',
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      ownerId: body.ownerId || null,
      clientId: body.clientId || null,
    },
  });
  return NextResponse.json(task);
}
