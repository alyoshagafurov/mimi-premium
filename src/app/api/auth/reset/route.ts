import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { passwordProblem } from '@/lib/validation';

const schema = z.object({ token: z.string().min(10), password: z.string().max(200) });

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Проверьте поля' }, { status: 400 });
  const { token, password } = parsed.data;

  // Same strength policy as sign-up.
  const passErr = passwordProblem(password);
  if (passErr) return NextResponse.json({ error: passErr }, { status: 400 });

  const record = await prisma.passwordResetToken.findUnique({ where: { token }, include: { user: true } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Ссылка недействительна или истекла' }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { password: hashed } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    // invalidate any other outstanding tokens for this user
    prisma.passwordResetToken.updateMany({
      where: { userId: record.userId, usedAt: null },
      data: { usedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
