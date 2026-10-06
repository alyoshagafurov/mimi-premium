import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { sealSecret } from '@/lib/secret-box';
import { ensureAdminLike } from '@/lib/api-guard';
import { ROLE_LABEL, parseRoleSet } from '@/lib/roles';
import { adminPasswordProblem, emailProblem } from '@/lib/validation';
import { logAudit } from '@/lib/audit';
import type { Role } from '@prisma/client';

/** List all agency staff (non-client users). */
export async function GET() {
  const session = await ensureAdminLike();
  if (!session) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const staff = await prisma.user.findMany({
    where: { role: { not: 'CLIENT' } },
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, email: true, phone: true, role: true, roles: true, createdAt: true },
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
  const parsed = parseRoleSet(body.roles ?? body.role);
  const phone = body.phone ? String(body.phone).trim() : null;

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Заполните имя, email и пароль' }, { status: 400 });
  }
  const passErr = adminPasswordProblem(password);
  if (passErr) return NextResponse.json({ error: passErr }, { status: 400 });
  const emailErr = emailProblem(email);
  if (emailErr) return NextResponse.json({ error: emailErr }, { status: 400 });
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const roles = parsed.roles;
  const role = roles[0];
  // Администратор в системе один: вторую такую учётку не заводим.
  if (role === 'ADMIN') {
    const admins = await prisma.user.count({ where: { role: 'ADMIN' } });
    if (admins > 0) {
      return NextResponse.json({ error: 'Администратор уже есть — он может быть только один' }, { status: 400 });
    }
  }
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: 'Пользователь с таким email уже есть' }, { status: 409 });

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    // Сотрудника заводит админ — он же за него ручается: почта считается
    // подтверждённой, доступ сразу одобрен, иначе войти нельзя.
    data: {
      name, email, password: hashed, role, roles, phone,
      passwordCipher: sealSecret(password),
      emailVerified: new Date(), approvedAt: new Date(),
    },
    select: { id: true, name: true, email: true, phone: true, role: true, roles: true, createdAt: true },
  });
  await logAudit({
    action: 'created',
    entity: 'user',
    entityId: user.id,
    summary: `Создан сотрудник «${user.name}» (${ROLE_LABEL[user.role as Role]})`,
  });
  return NextResponse.json(user);
}
