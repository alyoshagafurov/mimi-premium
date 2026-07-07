import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notifyAdmins } from '@/lib/notify';
import { fetchLead } from '@/lib/facebook';

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

        // Fetch the full lead via Graph API when we have a token; else use the
        // limited fields Facebook included in the webhook payload.
        let name = v.full_name as string | undefined;
        let phone = v.phone_number as string | undefined;
        let email = v.email as string | undefined;
        if (acc.accessToken && v.leadgen_id) {
          const full = await fetchLead(String(v.leadgen_id), acc.accessToken);
          if (full) {
            name = full.fullName ?? name;
            phone = full.phone ?? phone;
            email = full.email ?? email;
          }
        }

        const deal = await prisma.deal.create({
          data: {
            title: name ?? 'Facebook Lead',
            contactName: name ?? 'Facebook lead',
            phone: phone ?? null,
            email: email ?? null,
            source: 'Facebook',
            stage: 'NEW',
            clientId: acc.clientId,
          },
        });
        await notifyAdmins({
          kind: 'LEAD',
          title: 'Лид из Facebook',
          body: name ? `${name}${phone ? ` · ${phone}` : ''}` : `Лид #${deal.id.slice(0, 8)}`,
          link: '/admin/leads',
          email: true,
        });
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 400 });
  }
}
