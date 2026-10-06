import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { sealSecret } from '@/lib/secret-box';
import { ensureAdminLike } from '@/lib/api-guard';
import { ROLE_LABEL, parseRoleSet } from '@/lib/roles';
import { adminPasswordProblem, emailProblem, normalizeEmail } from '@/lib/validation';
import { logAudit } from '@/lib/audit';
import { notify } from '@/lib/notify';
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
  // Специальности: можно выдать несколько сразу (видеограф + монтажёр).
  if (body.roles || body.role) {
    const parsed = parseRoleSet(body.roles ?? body.role);
    if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const roles = parsed.roles;
    if (roles[0] === 'ADMIN' && target.role !== 'ADMIN') {
      const others = await prisma.user.count({ where: { role: 'ADMIN', id: { not: params.id } } });
      if (others > 0) {
        return NextResponse.json({ error: 'Администратор уже есть — он может быть только один' }, { status: 400 });
      }
    }
    // Последнего администратора нельзя разжаловать — иначе в систему никто не войдёт.
    if (target.role === 'ADMIN' && roles[0] !== 'ADMIN') {
      const others = await prisma.user.count({ where: { role: 'ADMIN', id: { not: params.id } } });
      if (others === 0) {
        return NextResponse.json({ error: 'Это единственный администратор — сначала назначьте другого' }, { status: 400 });
      }
    }
    data.role = roles[0];
    data.roles = roles;
  }
  // Одобрение / отзыв доступа сотрудника.
  if (typeof body.approved === 'boolean') {
    data.approvedAt = body.approved ? new Date() : null;
  }
  if (typeof body.jobTitle === 'string') data.jobTitle = body.jobTitle.trim() || null;
  if (typeof body.bio === 'string') data.bio = body.bio.trim() || null;
  if (typeof body.avatar === 'string' || body.avatar === null) data.avatar = body.avatar || null;

  // Логин сотрудника — админ может выдать новый адрес.
  if (typeof body.email === 'string') {
    if (!body.email.trim()) return NextResponse.json({ error: 'Укажите email' }, { status: 400 });
    const normalized = normalizeEmail(body.email);
    const emailErr = emailProblem(normalized);
    if (emailErr) return NextResponse.json({ error: emailErr }, { status: 400 });
    const taken = await prisma.user.findFirst({
      where: { email: normalized, id: { not: params.id } },
      select: { id: true },
    });
    if (taken) return NextResponse.json({ error: 'Email уже занят' }, { status: 400 });
    data.email = normalized;
  }

  if (typeof body.password === 'string' && body.password) {
    const passErr = adminPasswordProblem(body.password);
    if (passErr) return NextResponse.json({ error: passErr }, { status: 400 });
    data.password = await bcrypt.hash(body.password.trim(), 12);
    data.passwordCipher = sealSecret(body.password.trim());
  }

  // Без подтверждённой почты вход блокируется (callbacks.signIn в lib/auth.ts),
  // а доступ выдаёт сам админ — значит адрес подтверждён.
  if (data.email || data.password) data.emailVerified = new Date();
  const user = await prisma.user.update({
    where: { id: params.id },
    data,
    select: { id: true, name: true, email: true, phone: true, role: true, roles: true, createdAt: true, approvedAt: true },
  });
  const roleChanged = data.role && data.role !== target.role;
  await logAudit({
    action: 'updated',
    entity: 'user',
    entityId: user.id,
    summary: roleChanged
      ? `Специальности «${user.name}»: ${(target.roles?.length ? target.roles : [target.role]).map((r) => ROLE_LABEL[r as Role]).join(', ')} → ${(user.roles?.length ? user.roles : [user.role]).map((r) => ROLE_LABEL[r as Role]).join(', ')}`
      : `Изменён сотрудник «${user.name}»`,
  });
  if (body.approved === true && !target.approvedAt) {
    await notify({
      userId: user.id,
      kind: 'SYSTEM',
      title: 'Доступ одобрен',
      body: 'Администратор подтвердил вашу учётную запись — можно входить.',
      link: '/admin',
      email: true,
    }).catch(() => {});
  }

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
  await logAudit({ action: 'deleted', entity: 'user', entityId: params.id, summary: `Удалён сотрудник «${target.name}»` });
  return NextResponse.json({ ok: true });
}
