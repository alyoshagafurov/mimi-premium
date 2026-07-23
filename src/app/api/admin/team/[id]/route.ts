import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { ensureAdminLike } from '@/lib/api-guard';
import { ASSIGNABLE_ROLES } from '@/lib/roles';
import { passwordProblem } from '@/lib/validation';
import type { Role } from '@prisma/client';

/** Update a staff member (role, name, phone, optional new password). */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await ensureAdminLike();
  if (!session) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target || target.role === 'CLIENT') return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const data: any = {};
  if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim();
  if (typeof body.phone === 'string') data.phone = body.phone.trim() || null;
  if (body.role) {
    if (!ASSIGNABLE_ROLES.includes(body.role as Role)) {
      return NextResponse.json({ error: 'Недопустимая роль' }, { status: 400 });
    }
    data.role = body.role;
  }
  if (typeof body.password === 'string' && body.password) {
    const passErr = passwordProblem(body.password);
    if (passErr) return NextResponse.json({ error: passErr }, { status: 400 });
    data.password = await bcrypt.hash(body.password, 12);
  }
  const user = await prisma.user.update({
    where: { id: params.id },
    data,
    select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
  });
  return NextResponse.json(user);
}

/** Delete a staff member. Cannot delete yourself. */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await ensureAdminLike();
  if (!session) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const me = session.user as any;
  if (me.id === params.id) return NextResponse.json({ error: 'Нельзя удалить свой аккаунт' }, { status: 400 });
  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target || target.role === 'CLIENT') return NextResponse.json({ error: 'not_found' }, { status: 404 });
  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
