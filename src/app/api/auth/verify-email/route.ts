import { NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyCode } from '@/lib/email-verify';
import { rateLimit } from '@/lib/rate-limit';
import { clientIp } from '@/lib/request';

const schema = z.object({ email: z.string().email().max(160), code: z.string().max(12) });

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!(await rateLimit(`verify:${ip}`, 20, 15 * 60 * 1000)).ok) {
    return NextResponse.json({ error: 'Слишком много попыток. Попробуйте позже.' }, { status: 429 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Проверьте поля' }, { status: 400 });

  const result = await verifyCode(parsed.data.email, parsed.data.code);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
