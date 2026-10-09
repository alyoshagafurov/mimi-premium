import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ensureStaff } from '@/lib/api-guard';
import { SITE_URL } from '@/lib/seo';
import { waLink, prefilledText } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

const SOURCES = ['INSTAGRAM', 'INSTAGRAM_ADS', 'WEBSITE', 'TELEGRAM', 'REFERRAL', 'OTHER'] as const;

const schema = z.object({
  label: z.string().trim().min(1).max(160),
  source: z.enum(SOURCES).default('INSTAGRAM'),
  campaign: z.string().trim().max(160).optional(),
  adName: z.string().trim().max(200).optional(),
  postUrl: z.string().trim().max(500).optional(),
  /** Можно задать свою метку — иначе генерируется короткая случайная. */
  code: z.string().trim().max(24).optional(),
});

const view = (l: {
  id: string; code: string; label: string; source: string; campaign: string | null;
  adName: string | null; postUrl: string | null; clicks: number; leads: number;
  active: boolean; createdAt: Date;
}) => ({
  id: l.id,
  code: l.code,
  label: l.label,
  source: l.source,
  campaign: l.campaign,
  adName: l.adName,
  postUrl: l.postUrl,
  clicks: l.clicks,
  leads: l.leads,
  active: l.active,
  createdAt: l.createdAt.toISOString(),
  /** Короткая ссылка — её и размещают в Instagram. */
  shortUrl: `${SITE_URL}/r/${l.code}`,
  /** Прямая ссылка WhatsApp с предзаполненным текстом. */
  waUrl: waLink(l.code),
  text: prefilledText(l.code),
});

export async function GET() {
  const session = await ensureStaff();
  if (!session) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const links = await prisma.whatsAppLink.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
  return NextResponse.json({ items: links.map(view) });
}

export async function POST(req: Request) {
  const session = await ensureStaff();
  if (!session) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Укажите название публикации' }, { status: 400 });
  const d = parsed.data;

  const custom = d.code?.toLowerCase().replace(/[^a-z0-9_-]/g, '');
  const code = custom && custom.length >= 2 ? custom : randomUUID().replace(/-/g, '').slice(0, 6);

  try {
    const link = await prisma.whatsAppLink.create({
      data: {
        code,
        label: d.label,
        source: d.source,
        campaign: d.campaign || null,
        adName: d.adName || null,
        postUrl: d.postUrl || null,
      },
    });
    return NextResponse.json(view(link));
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return NextResponse.json({ error: 'Такая метка уже есть — выберите другую' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Не удалось создать ссылку' }, { status: 400 });
  }
}
