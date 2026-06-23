import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureAdmin } from '@/lib/api-guard';

export async function GET() {
  const me = await ensureAdmin();
  if (!me) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const accounts = await prisma.facebookAccount.findMany({
    include: { client: { select: { id: true, businessName: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({
    accounts: accounts.map((a) => ({
      id: a.id,
      clientId: a.clientId,
      clientName: a.client.businessName,
      pageId: a.pageId,
      pageName: a.pageName,
      adAccountId: a.adAccountId,
      hasToken: !!a.accessToken,
      connectedAt: a.connectedAt,
      lastSyncAt: a.lastSyncAt,
    })),
  });
}

export async function POST(req: Request) {
  const me = await ensureAdmin();
  if (!me) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const body = await req.json();
  const acc = await prisma.facebookAccount.upsert({
    where: { clientId: body.clientId },
    create: {
      clientId: body.clientId,
      pageId: body.pageId ?? null,
      pageName: body.pageName ?? null,
      adAccountId: body.adAccountId ?? null,
      accessToken: body.accessToken ?? null,
      connectedAt: body.accessToken ? new Date() : null,
    },
    update: {
      pageId: body.pageId ?? null,
      pageName: body.pageName ?? null,
      adAccountId: body.adAccountId ?? null,
      accessToken: body.accessToken ?? undefined,
      connectedAt: body.accessToken ? new Date() : undefined,
    },
  });
  return NextResponse.json({ id: acc.id, ok: true });
}
