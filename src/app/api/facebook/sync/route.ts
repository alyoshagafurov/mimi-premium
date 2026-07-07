import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureAdmin } from '@/lib/api-guard';
import { fetchInsights } from '@/lib/facebook';

async function runSync(clientId?: string) {
  const where: any = { accessToken: { not: null }, adAccountId: { not: null } };
  if (clientId) where.clientId = clientId;
  const accounts = await prisma.facebookAccount.findMany({ where });
  let synced = 0;
  for (const acc of accounts) {
    const insights = await fetchInsights(acc.adAccountId!, acc.accessToken!, 7);
    for (const day of insights) {
      const date = new Date(day.date);
      await prisma.adMetric.upsert({
        where: { clientId_date_platform: { clientId: acc.clientId, date, platform: 'Facebook' } },
        create: { clientId: acc.clientId, date, platform: 'Facebook', spent: day.spend, reach: day.reach, clicks: day.clicks, impressions: day.impressions, leads: day.leads },
        update: { spent: day.spend, reach: day.reach, clicks: day.clicks, impressions: day.impressions, leads: day.leads },
      });
      synced++;
    }
    await prisma.facebookAccount.update({ where: { id: acc.id }, data: { lastSyncAt: new Date() } });
  }
  return { accounts: accounts.length, daysSynced: synced };
}

// Vercel Cron hits this daily with `Authorization: Bearer ${CRON_SECRET}`.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  const result = await runSync();
  return NextResponse.json({ ok: true, ...result });
}

/**
 * Pull daily Facebook ad insights into AdMetric for connected clients.
 *   • Admin-triggered: POST /api/facebook/sync            → all connected clients
 *   • POST /api/facebook/sync  { clientId }               → single client
 *   • Cron:  POST with header  x-cron-secret: CRON_SECRET → all (no session)
 */
export async function POST(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const isCron = cronSecret && req.headers.get('x-cron-secret') === cronSecret;
  if (!isCron) {
    const admin = await ensureAdmin();
    if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const result = await runSync(body?.clientId);
  return NextResponse.json({ ok: true, ...result });
}
