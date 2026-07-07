import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { sendEmail, emailLayout } from '@/lib/email';
import { rateLimit } from '@/lib/rate-limit';
import { clientIp } from '@/lib/request';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mimi-agency-v2.vercel.app';
const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!(await rateLimit(`forgot:${ip}`, 5, 15 * 60 * 1000)).ok) {
    return NextResponse.json({ error: 'Слишком много попыток. Попробуйте позже.' }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  // Always respond OK — never reveal whether an email exists.
  if (!parsed.success) return NextResponse.json({ ok: true });

  const email = parsed.data.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await prisma.passwordResetToken.create({ data: { token, userId: user.id, expiresAt } });
    const link = `${APP_URL}/auth/reset?token=${token}`;
    await sendEmail({
      to: email,
      subject: 'Восстановление пароля — mimi',
      html: emailLayout({
        heading: 'Восстановление пароля',
        body: 'Вы запросили сброс пароля. Ссылка действует 1 час. Если это были не вы — просто проигнорируйте письмо.',
        ctaLabel: 'Задать новый пароль',
        ctaHref: link,
      }),
    });
  }

  return NextResponse.json({ ok: true });
}
