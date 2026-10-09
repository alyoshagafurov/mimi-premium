import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import type { LeadSource, WhatsAppStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { notifySales } from '@/lib/notify';
import {
  appSecret, verifyToken, verifySignature, whatsappWebhookEnabled,
  extractSourceTag, stripSourceTag, parseReferral, phoneTail,
  toE164, toWaId, type WhatsAppReferral,
} from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

/**
 * Webhook WhatsApp Cloud API.
 *
 * GET  — разовая проверка адреса со стороны Meta (hub.challenge).
 * POST — входящие сообщения и статусы доставки.
 *
 * Защита: подпись `X-Hub-Signature-256` считается по сырому телу запроса;
 * повторная доставка одного и того же события безопасна, потому что `wamid`
 * уникален в базе (Meta пересылает события до 7 дней).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  if (!whatsappWebhookEnabled) {
    return NextResponse.json({ error: 'WHATSAPP_VERIFY_TOKEN не задан' }, { status: 503 });
  }
  if (mode === 'subscribe' && token === verifyToken) {
    // Meta ждёт именно сырой текст challenge, а не JSON.
    return new NextResponse(challenge ?? '', { status: 200 });
  }
  return NextResponse.json({ error: 'forbidden' }, { status: 403 });
}

export async function POST(req: Request) {
  // Сырое тело нужно до разбора JSON: подпись считается по байтам как есть.
  const raw = await req.text();

  if (appSecret) {
    if (!verifySignature(raw, req.headers.get('x-hub-signature-256'))) {
      return NextResponse.json({ error: 'bad signature' }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === 'production') {
    // Без секрета подпись проверить нечем — принимать события небезопасно.
    console.error('[whatsapp] WHATSAPP_APP_SECRET не задан — webhook отклонён');
    return NextResponse.json({ error: 'WHATSAPP_APP_SECRET не задан' }, { status: 503 });
  } else {
    console.warn('[whatsapp] WHATSAPP_APP_SECRET не задан — подпись не проверяется (dev)');
  }

  let payload: any;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 });
  }

  if (payload?.object !== 'whatsapp_business_account') {
    return NextResponse.json({ ok: true, ignored: true });
  }

  let failed = false;
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== 'messages') continue;
      const value = change.value ?? {};
      const profileName: string | undefined = value.contacts?.[0]?.profile?.name;

      for (const message of value.messages ?? []) {
        try {
          await handleInbound(message, profileName);
        } catch (err) {
          console.error('[whatsapp] inbound failed', message?.id, err);
          failed = true;
        }
      }
      for (const status of value.statuses ?? []) {
        try {
          await handleStatus(status);
        } catch (err) {
          console.error('[whatsapp] status failed', status?.id, err);
          failed = true;
        }
      }
    }
  }

  // 500 просит Meta повторить доставку; дубликаты при этом не появятся —
  // их отсекает уникальный wamid.
  if (failed) return NextResponse.json({ ok: false }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/* ─────────────── Входящее сообщение ─────────────── */

type InboundMessage = {
  id?: string;
  from?: string;
  type?: string;
  timestamp?: string;
  text?: { body?: string };
  referral?: WhatsAppReferral;
  image?: { id?: string; mime_type?: string; caption?: string };
  video?: { id?: string; mime_type?: string; caption?: string };
  audio?: { id?: string; mime_type?: string };
  document?: { id?: string; mime_type?: string; caption?: string; filename?: string };
  sticker?: { id?: string; mime_type?: string };
  location?: { latitude?: number; longitude?: number; name?: string };
  button?: { text?: string };
  interactive?: { button_reply?: { title?: string }; list_reply?: { title?: string } };
};

/** Текст сообщения и вложение — из того поля, которое соответствует типу. */
function readContent(m: InboundMessage): { body: string; mediaId: string | null; mediaMime: string | null } {
  const media = m.image ?? m.video ?? m.audio ?? m.document ?? m.sticker;
  const location = m.location
    ? [m.location.name, m.location.latitude, m.location.longitude].filter(Boolean).join(' ')
    : '';
  const body =
    m.text?.body ??
    m.image?.caption ??
    m.video?.caption ??
    m.document?.caption ??
    m.document?.filename ??
    m.button?.text ??
    m.interactive?.button_reply?.title ??
    m.interactive?.list_reply?.title ??
    location;
  return {
    body: body ?? '',
    mediaId: media?.id ?? null,
    mediaMime: media?.mime_type ?? null,
  };
}

async function handleInbound(message: InboundMessage, profileName?: string) {
  const wamid = message.id;
  const waId = toWaId(message.from ?? '');
  if (!wamid || !waId) return;

  // Повторная доставка того же события — просто выходим.
  const seen = await prisma.whatsAppMessage.findUnique({ where: { wamid }, select: { id: true } });
  if (seen) return;

  const { body, mediaId, mediaMime } = readContent(message);
  const sentAt = message.timestamp ? new Date(Number(message.timestamp) * 1000) : new Date();
  const phone = toE164(waId);

  // Источник: метка из ссылки точнее (называет конкретную публикацию), данные
  // referral — подтверждение от самой Meta. Чего нет — остаётся неизвестным.
  const referral = parseReferral(message.referral);
  const tag = extractSourceTag(body);
  const link = tag ? await prisma.whatsAppLink.findUnique({ where: { code: tag } }) : null;

  const attribution: Attribution = {
    sourceType: (link?.source ?? referral.sourceType) as LeadSource,
    sourceCampaign: link?.campaign ?? referral.campaign,
    sourceAdName: link?.adName ?? referral.adName,
    sourceRefCode: link?.code ?? null,
    sourceClickId: referral.clickId,
    sourceAdId: referral.adId,
    sourceUrl: link?.postUrl ?? referral.url,
    confirmed: !!link || referral.confirmed,
  };

  const conversation = await prisma.whatsAppConversation.findUnique({ where: { waId } });
  let clientId = conversation?.clientId ?? (await findClientIdByPhone(waId));
  let createdClient = false;

  if (!clientId) {
    clientId = await createLeadFromWhatsApp({ waId, phone, profileName, sentAt, attribution });
    createdClient = true;
  } else if (attribution.confirmed) {
    // Первоначальный источник не перезаписываем — новый подтверждённый переход
    // становится отдельной записью в истории взаимодействий.
    await recordRepeatSource(clientId, attribution);
  }

  const convo = conversation
    ? await prisma.whatsAppConversation.update({
        where: { id: conversation.id },
        data: {
          phone,
          profileName: profileName ?? conversation.profileName,
          clientId: conversation.clientId ?? clientId,
          lastMessageAt: sentAt,
          lastInboundAt: sentAt,
          lastText: stripSourceTag(body).slice(0, 280),
          unread: { increment: 1 },
        },
      })
    : await prisma.whatsAppConversation.create({
        data: {
          waId,
          phone,
          profileName: profileName ?? null,
          clientId,
          lastMessageAt: sentAt,
          lastInboundAt: sentAt,
          lastText: stripSourceTag(body).slice(0, 280),
          unread: 1,
        },
      });

  try {
    await prisma.whatsAppMessage.create({
      data: {
        conversationId: convo.id,
        wamid,
        direction: 'IN',
        type: message.type ?? 'text',
        body,
        mediaId,
        mediaMime,
        status: 'DELIVERED',
        referral: message.referral ? (message.referral as object) : undefined,
        sentAt,
      },
    });
  } catch (err: any) {
    // Параллельная повторная доставка — сообщение уже записано, это не ошибка.
    if (err?.code !== 'P2002') throw err;
    return;
  }

  if (link) {
    await prisma.whatsAppLink.update({ where: { id: link.id }, data: { leads: { increment: 1 } } });
  }

  const who = profileName || phone;
  const preview = stripSourceTag(body).slice(0, 140) || 'Вложение';

  if (createdClient) {
    await notifySales({
      kind: 'LEAD',
      title: 'Новый лид из WhatsApp',
      body: `${who}: ${preview}`,
      link: '/admin/whatsapp',
      email: true,
    }).catch(() => {});
  } else if ((conversation?.unread ?? 0) === 0) {
    // Уведомляем о первом неотвеченном сообщении, а не о каждом подряд.
    await notifySales({
      kind: 'MESSAGE',
      title: `WhatsApp: ${who}`,
      body: preview,
      link: '/admin/whatsapp',
    }).catch(() => {});
  }
}

/* ─────────────── Клиент ─────────────── */

/**
 * Поиск существующей карточки по телефону — только по номеру, никогда по имени.
 *
 * Телефоны в базе записаны по-разному: лид из формы сохраняется как его ввёл
 * продажник («+992 90 111 22 33»), регистрация — нормализованным
 * («+992901112233»). Поэтому сравниваем одни цифры, и делаем это в SQL: иначе
 * пришлось бы вычитывать всех пользователей в память. Сравнение по последним
 * девяти цифрам — это и есть локальный номер без кода страны.
 */
async function findClientIdByPhone(waId: string): Promise<string | null> {
  const tail = phoneTail(waId);
  if (tail.length < 7) return null;

  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT c."id"
    FROM "Client" c
    JOIN "User" u ON u."id" = c."ownerId"
    WHERE length(regexp_replace(COALESCE(u."phone", ''), '[^0-9]', '', 'g')) >= 7
      AND regexp_replace(COALESCE(u."phone", ''), '[^0-9]', '', 'g') LIKE ${`%${tail}`}
    LIMIT 1
  `;
  return rows[0]?.id ?? null;
}

type Attribution = {
  sourceType: LeadSource;
  sourceCampaign: string | null;
  sourceAdName: string | null;
  sourceRefCode: string | null;
  sourceClickId: string | null;
  sourceAdId: string | null;
  sourceUrl: string | null;
  confirmed: boolean;
};

/**
 * Карточка нового лида из первого сообщения. Клиенту всегда нужен владелец-User,
 * а почты у него ещё нет — ставим заглушку по номеру, как это уже делает
 * создание лида вручную (/api/sales).
 */
async function createLeadFromWhatsApp({
  waId, phone, profileName, sentAt, attribution,
}: {
  waId: string;
  phone: string;
  profileName?: string;
  sentAt: Date;
  attribution: Attribution;
}): Promise<string> {
  const name = profileName?.trim() || phone;
  const user = await prisma.user.create({
    data: {
      email: `wa-${waId}@lead.mimitj.agency`,
      password: await bcrypt.hash(randomUUID(), 10),
      name,
      phone,
      role: 'CLIENT',
      emailVerified: new Date(),
      client: {
        create: {
          businessName: name,
          niche: 'Не указана',
          contactName: name,
          salesStatus: 'NEW_LEAD',
          sourceType: attribution.sourceType,
          sourceCampaign: attribution.sourceCampaign,
          sourceAdName: attribution.sourceAdName,
          sourceRefCode: attribution.sourceRefCode,
          sourceClickId: attribution.sourceClickId,
          sourceAdId: attribution.sourceAdId,
          sourceUrl: attribution.sourceUrl,
          sourceConfirmed: attribution.confirmed,
          sourceNote: attribution.confirmed ? null : 'Написал в WhatsApp — источник не определён',
          firstContactAt: sentAt,
        },
      },
    },
    select: { client: { select: { id: true } } },
  });
  const clientId = user.client?.id;
  if (!clientId) throw new Error('Не удалось создать карточку клиента');
  return clientId;
}

/** Повторный подтверждённый переход — отдельной записью, поверх ничего не пишем. */
async function recordRepeatSource(clientId: string, attribution: Attribution) {
  const parts = [
    attribution.sourceCampaign && `кампания «${attribution.sourceCampaign}»`,
    attribution.sourceAdName && `объявление «${attribution.sourceAdName}»`,
    attribution.sourceRefCode && `метка ${attribution.sourceRefCode}`,
    attribution.sourceClickId && `ctwa_clid ${attribution.sourceClickId}`,
  ].filter(Boolean);

  await prisma.activity.create({
    data: {
      kind: 'NOTE',
      clientId,
      body: `Повторный переход из WhatsApp${parts.length ? `: ${parts.join(', ')}` : ''}`,
    },
  });
}

/* ─────────────── Статусы доставки ─────────────── */

const STATUS_MAP: Record<string, WhatsAppStatus> = {
  sent: 'SENT',
  delivered: 'DELIVERED',
  read: 'READ',
  failed: 'FAILED',
};
/** Статусы приходят не по порядку — «доставлено» после «прочитано» не откатываем. */
const STATUS_RANK: Record<WhatsAppStatus, number> = {
  PENDING: 0, SENT: 1, DELIVERED: 2, READ: 3, FAILED: 4,
};

async function handleStatus(status: { id?: string; status?: string; errors?: { title?: string }[] }) {
  const wamid = status.id;
  const next = STATUS_MAP[status.status ?? ''];
  if (!wamid || !next) return;

  const current = await prisma.whatsAppMessage.findUnique({
    where: { wamid },
    select: { id: true, status: true },
  });
  if (!current) return;
  if (STATUS_RANK[next] <= STATUS_RANK[current.status]) return;

  await prisma.whatsAppMessage.update({
    where: { id: current.id },
    data: { status: next, error: status.errors?.[0]?.title ?? null },
  });
}
