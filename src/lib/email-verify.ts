import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { sendEmail, emailLayout, emailEnabled } from './email';

const CODE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 6;

function sixDigits() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * Create a fresh 6-digit code for the user and email it.
 * Returns whether a mail was actually dispatched (false when Resend isn't
 * configured — the caller then auto-verifies so the site keeps working).
 */
export async function sendVerificationCode(user: { id: string; email: string; name: string }): Promise<boolean> {
  if (!emailEnabled) return false;

  const code = sixDigits();
  const codeHash = await bcrypt.hash(code, 8);

  // Replace any previous codes for this user.
  await prisma.emailVerificationCode.deleteMany({ where: { userId: user.id } });
  await prisma.emailVerificationCode.create({
    data: { userId: user.id, codeHash, expiresAt: new Date(Date.now() + CODE_TTL_MS) },
  });

  await sendEmail({
    to: user.email,
    subject: `Код подтверждения mimi: ${code}`,
    html: emailLayout({
      heading: 'Подтверждение почты',
      body: `Здравствуйте${user.name ? ', ' + user.name : ''}!<br/><br/>Ваш код подтверждения:<br/>
        <div style="font-size:32px;font-weight:800;letter-spacing:8px;margin:18px 0;color:#3C1975">${code}</div>
        Код действует 15 минут. Если вы не регистрировались в mimi — просто проигнорируйте это письмо.`,
    }),
  });
  return true;
}

export type VerifyResult = { ok: true } | { ok: false; error: string };

/** Check a submitted code and, on success, mark the user's email verified. */
export async function verifyCode(email: string, code: string): Promise<VerifyResult> {
  const clean = (code ?? '').replace(/\D/g, '');
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user) return { ok: false, error: 'Неверный код' }; // no user enumeration
  if (user.emailVerified) return { ok: true };

  const record = await prisma.emailVerificationCode.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });
  if (!record) return { ok: false, error: 'Код не найден — запросите новый' };
  if (record.expiresAt < new Date()) return { ok: false, error: 'Код истёк — запросите новый' };
  if (record.attempts >= MAX_ATTEMPTS) return { ok: false, error: 'Слишком много попыток — запросите новый код' };

  const match = clean.length === 6 && (await bcrypt.compare(clean, record.codeHash));
  if (!match) {
    await prisma.emailVerificationCode.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
    return { ok: false, error: 'Неверный код' };
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } }),
    prisma.emailVerificationCode.deleteMany({ where: { userId: user.id } }),
  ]);
  return { ok: true };
}
