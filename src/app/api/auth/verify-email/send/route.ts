import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { normalizeEmail } from '@/lib/validation';
import { sendVerificationCode } from '@/lib/email-verify';
import { rateLimit } from '@/lib/rate-limit';
import { clientIp } from '@/lib/request';

const schema = z.object({ email: z.string().email().max(160) });

/** (Re)send a verification code. Always returns ok — never reveals whether the
 *  email is registered. Rate-limited per IP to avoid mail-bombing. */
export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!(await rateLimit(`verify-send:${ip}`, 5, 10 * 60 * 1000)).ok) {
    return NextResponse.json({ error: 'Слишком часто. Подождите несколько минут.' }, { status: 429 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Проверьте email' }, { status: 400 });

  const email = normalizeEmail(parsed.data.email);
  const user = await prisma.user.findUnique({ where: { email } });
  if (user && !user.emailVerified && user.password) {
    await sendVerificationCode({ id: user.id, email: user.email, name: user.name });
  }
  return NextResponse.json({ ok: true });
}
