import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Дешёвый пинг для внешнего keep-alive (cron-job.org, UptimeRobot и т.п.).
 *
 * Neon на free tier засыпает через ~5 минут простоя, и первый запрос после
 * этого платит ~2.5 с на пробуждение. Пинг раз в 4–5 минут держит компьют
 * тёплым. Открыт без авторизации специально — наружу ничего не отдаёт, только
 * ok/время, и стоит один `select 1`.
 */
export async function GET() {
  const t0 = Date.now();
  try {
    await prisma.$queryRawUnsafe('select 1');
    return NextResponse.json({ ok: true, dbMs: Date.now() - t0 });
  } catch {
    // 200 и здесь: пингеры не должны заваливать почту алертами из-за
    // холодного старта базы — важен сам факт «разбудили».
    return NextResponse.json({ ok: false, dbMs: Date.now() - t0 });
  }
}
