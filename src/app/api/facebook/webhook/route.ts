import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notifyAdmins } from '@/lib/notify';

// Facebook Lead Ads webhook verification (GET) — Facebook calls this first
export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');
  if (mode === 'subscribe' && token === process.env.FB_VERIFY_TOKEN) {
    return new NextResponse(challenge ?? '', { status: 200 });
  }
  return NextResponse.json({ error: 'forbidden' }, { status: 403 });
}

// Facebook posts new leads here
export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const entries = payload?.entry ?? [];
    for (const entry of entries) {
      for (const change of entry.changes ?? []) {
        if (change.field !== 'leadgen') continue;
        const v = change.value ?? {};
        const pageId = v.page_id;
        const acc = await prisma.facebookAccount.findFirst({ where: { pageId } });
        if (!acc) continue;

        // For full lead data we'd need to call Graph API with the access token.
        // Stub: create a Deal with what we have.
        const deal = await prisma.deal.create({
          data: {
            title: 'Facebook Lead',
            contactName: v.full_name ?? 'Facebook lead',
            phone: v.phone_number ?? null,
            email: v.email ?? null,
            source: 'Facebook',
            stage: 'NEW',
            clientId: acc.clientId,
          },
        });
        await notifyAdmins({
          kind: 'LEAD',
          title: 'Лид из Facebook',
          body: `Лид #${deal.id.slice(0, 8)}`,
          link: '/admin/leads',
        });
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 400 });
  }
}
