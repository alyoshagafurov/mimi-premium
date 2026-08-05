import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { ensureAdminLike } from '@/lib/api-guard';
import { ASSIGNABLE_ROLES, ROLE_LABEL } from '@/lib/roles';
import { passwordProblem, emailProblem } from '@/lib/validation';
import { logAudit } from '@/lib/audit';
import type { Role } from '@prisma/client';

/** List all agency staff (non-client users). */
export async function GET() {
  const session = await ensureAdminLike();
  if (!session) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const staff = await prisma.user.findMany({
    where: { role: { not: 'CLIENT' } },
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
  });
  return NextResponse.json({ staff });
}

/** Create a staff account with a role + login. */
export async function POST(req: Request) {
  const session = await ensureAdminLike();
  if (!session) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? '').trim();
  const email = String(body.email ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');
  const role = body.role as Role;
  const phone = body.phone ? String(body.phone).trim() : null;

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Заполните имя, email и пароль' }, { status: 400 });
  }
  const passErr = passwordProblem(password);
  if (passErr) return NextResponse.json({ error: passErr }, { status: 400 });
  const emailErr = emailProblem(email);
  if (emailErr) return NextResponse.json({ error: emailErr }, { status: 400 });
  if (!ASSIGNABLE_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Недопустимая роль' }, { status: 400 });
  }
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: 'Пользователь с таким email уже есть' }, { status: 409 });

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    // Staff are created by an admin who vouches for them → email pre-verified.
    data: { name, email, password: hashed, role, phone, emailVerified: new Date() },
    select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
  });
  await logAudit({
    action: 'created',
    entity: 'user',
    entityId: user.id,
    summary: `Создан сотрудник «${user.name}» (${ROLE_LABEL[user.role as Role]})`,
  });
  return NextResponse.json(user);
}
