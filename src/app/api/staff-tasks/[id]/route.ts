import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSafeSession } from '@/lib/session';
import { ensureAdminLike } from '@/lib/api-guard';
import { isAdminLike, isStaff, visibleCategories } from '@/lib/roles';

/** Toggle done / edit a task. Assignee (or anyone on that team) + admin/ops. */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getSafeSession();
  const me = session?.user as any;
  const role = me?.role as string | undefined;
  if (!isStaff(role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const task = await prisma.task.findUnique({ where: { id: params.id } });
  if (!task) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  // Non-admins may only touch tasks of their own team.
  if (!isAdminLike(role) && !visibleCategories(role).includes(task.category as any)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const data: any = {};
  if (typeof body.done === 'boolean') data.done = body.done;
  if (isAdminLike(role)) {
    if (typeof body.title === 'string' && body.title.trim()) data.title = body.title.trim();
    if (typeof body.description === 'string') data.description = body.description.trim() || null;
    if ('dueDate' in body) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if ('ownerId' in body) data.ownerId = body.ownerId || null;
  }
  if (Object.keys(data).length === 0) return NextResponse.json({ error: 'Нечего обновлять' }, { status: 400 });

  const updated = await prisma.task.update({ where: { id: params.id }, data });
  return NextResponse.json(updated);
}

/** Delete a task — admin / ops only. */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await ensureAdminLike();
  if (!session) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  await prisma.task.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
