import crypto from 'crypto';
import { BRAND } from '@/lib/seo';

/**
 * WhatsApp Business Cloud API (официальный API Meta).
 *
 * Деградирует мягко, как и lib/email.ts: пока переменные окружения не заданы,
 * отправка возвращает { skipped: true } и пишет предупреждение в лог, а не
 * падает. Приём сообщений при этом тоже отключён — webhook отвечает 503.
 */
const GRAPH = `https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION ?? 'v21.0'}`;

const token = process.env.WHATSAPP_ACCESS_TOKEN;
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

export const appSecret = process.env.WHATSAPP_APP_SECRET;
export const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

/** Отправка возможна только когда есть и токен, и id номера. */
export const whatsappSendEnabled = !!(token && phoneNumberId);
/** Приём сообщений возможен, когда задан токен проверки webhook. */
export const whatsappWebhookEnabled = !!verifyToken;

/**
 * Страховка на время настройки: пока здесь перечислены номера, сообщения уходят
 * только им. Пустое значение = ограничения нет. Нужно, чтобы первые тесты не
 * ушли живым клиентам.
 */
const allowedRecipients = (process.env.WHATSAPP_ALLOWED_RECIPIENTS ?? '')
  .split(',')
  .map((s) => s.replace(/\D/g, ''))
  .filter(Boolean);

/** Номер, который подставляется в ссылки-метки для Reels и Stories. */
export const linkNumber = (process.env.WHATSAPP_LINK_NUMBER ?? BRAND.phoneE164).replace(/\D/g, '');

/* ─────────────── Номера ─────────────── */

/** wa_id у Meta — только цифры, без «+». */
export function toWaId(raw: string): string {
  return (raw ?? '').replace(/\D/g, '');
}

/** Тот же номер в виде «+992…» для показа и ссылок tel:. */
export function toE164(raw: string): string {
  const digits = toWaId(raw);
  return digits ? `+${digits}` : '';
}

/**
 * Последние 9 цифр номера — это локальный номер без кода страны. По ним ищем
 * уже существующую карточку клиента, потому что в базе телефоны записаны
 * по-разному: с пробелами, с «+» и без.
 */
export function phoneTail(raw: string): string {
  return toWaId(raw).slice(-9);
}

/* ─────────────── Подпись webhook ─────────────── */

/**
 * Проверка подписи Meta (`X-Hub-Signature-256`).
 *
 * Считается HMAC-SHA256 по СЫРОМУ телу запроса: если тело сначала разобрать в
 * JSON и собрать обратно, подпись не совпадёт. Сравнение — постоянное по
 * времени.
 */
export function verifySignature(rawBody: string, header: string | null): boolean {
  if (!appSecret || !header) return false;
  const expected = `sha256=${crypto.createHmac('sha256', appSecret).update(rawBody, 'utf8').digest('hex')}`;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/* ─────────────── Метки источника в тексте ─────────────── */

/**
 * Метка источника в предзаполненном тексте ссылки: «#m-reels07».
 * Клиент видит её в своём WhatsApp (текст его сообщения мы изменить не можем),
 * но в CRM она вырезается — сотрудник читает обычное сообщение.
 */
export const SOURCE_TAG_RE = /#m-([a-z0-9_-]{2,24})/i;

export function extractSourceTag(text: string): string | null {
  const m = (text ?? '').match(SOURCE_TAG_RE);
  return m ? m[1].toLowerCase() : null;
}

/** Текст без технической метки — то, что показывается сотруднику. */
export function stripSourceTag(text: string): string {
  return (text ?? '').replace(SOURCE_TAG_RE, '').replace(/\s{2,}/g, ' ').trim();
}

/** Предзаполненный текст для ссылки под конкретную публикацию. */
export function prefilledText(code: string): string {
  // Meta ограничивает предзаполненный текст 140 символами.
  return `Здравствуйте! Хочу узнать подробнее #m-${code}`.slice(0, 140);
}

/**
 * Ссылка wa.me с предзаполненным текстом. Кодируем ровно один раз штатной
 * функцией: ручная сборка строки приводит к двойному кодированию пробелов.
 */
export function waLink(code: string): string {
  return `https://wa.me/${linkNumber}?text=${encodeURIComponent(prefilledText(code))}`;
}

/* ─────────────── Referral от Meta ─────────────── */

export type WhatsAppReferral = {
  source_url?: string;
  source_id?: string;
  source_type?: string;
  headline?: string;
  body?: string;
  media_type?: string;
  image_url?: string;
  video_url?: string;
  thumbnail_url?: string;
  ctwa_clid?: string;
};

export type ParsedSource = {
  /** Значение LeadSource — строкой, чтобы файл не зависел от Prisma. */
  sourceType: 'INSTAGRAM_ADS' | 'INSTAGRAM' | 'UNKNOWN';
  campaign: string | null;
  adName: string | null;
  adId: string | null;
  clickId: string | null;
  url: string | null;
  /** Подтверждено платформой — не догадка. */
  confirmed: boolean;
};

const EMPTY_SOURCE: ParsedSource = {
  sourceType: 'UNKNOWN',
  campaign: null,
  adName: null,
  adId: null,
  clickId: null,
  url: null,
  confirmed: false,
};

/**
 * Разбор объекта `referral`, который Meta прикладывает к сообщению из рекламы
 * Click-to-WhatsApp. Названия кампании в нём нет — есть только заголовок и
 * текст объявления, поэтому в «кампанию» пишем заголовок, а не выдумываем.
 *
 * Площадку (Instagram или Facebook) Meta в referral не передаёт, поэтому
 * платная реклама помечается одним значением INSTAGRAM_ADS, а не угадывается.
 * `source_type: 'post'` — переход с публикации, которую Meta отследила сама.
 */
export function parseReferral(referral?: WhatsAppReferral | null): ParsedSource {
  if (!referral || (!referral.source_id && !referral.ctwa_clid && !referral.source_url)) {
    return EMPTY_SOURCE;
  }
  return {
    sourceType: referral.source_type === 'ad' ? 'INSTAGRAM_ADS' : 'INSTAGRAM',
    campaign: referral.headline?.trim() || null,
    adName: referral.body?.trim().slice(0, 200) || null,
    adId: referral.source_id ?? null,
    clickId: referral.ctwa_clid ?? null,
    url: referral.source_url ?? null,
    confirmed: true,
  };
}

/* ─────────────── Отправка ─────────────── */

type SendResult =
  | { ok: true; wamid: string }
  | { ok: false; error: string; skipped?: true; retryable?: boolean };

/**
 * Отправить текстовое сообщение. Вне 24-часового окна Meta отклонит обычный
 * текст — ошибку показываем как есть, молча не глотаем.
 */
export async function sendText(to: string, body: string): Promise<SendResult> {
  if (!whatsappSendEnabled) {
    console.warn('[whatsapp] WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID не заданы — отправка пропущена');
    return { ok: false, skipped: true, error: 'WhatsApp не настроен' };
  }
  const digits = toWaId(to);
  if (!digits) return { ok: false, error: 'Неверный номер' };
  if (allowedRecipients.length && !allowedRecipients.includes(digits)) {
    return { ok: false, error: 'Номер не в списке WHATSAPP_ALLOWED_RECIPIENTS — отправка запрещена' };
  }

  try {
    const res = await fetch(`${GRAPH}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: digits,
        type: 'text',
        text: { preview_url: false, body },
      }),
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message = data?.error?.message ?? `HTTP ${res.status}`;
      console.error('[whatsapp] send failed', res.status, message);
      // 429 и 5xx имеет смысл повторить позже, остальное — ошибка запроса.
      return { ok: false, error: message, retryable: res.status === 429 || res.status >= 500 };
    }
    const wamid = data?.messages?.[0]?.id;
    if (!wamid) return { ok: false, error: 'Meta не вернула id сообщения' };
    return { ok: true, wamid };
  } catch (err) {
    console.error('[whatsapp] send error', err);
    return { ok: false, error: 'Сеть недоступна', retryable: true };
  }
}

/** Ссылка на медиафайл у Meta — живёт недолго, поэтому берётся по запросу. */
export async function mediaUrl(mediaId: string): Promise<string | null> {
  if (!whatsappSendEnabled) return null;
  try {
    const res = await fetch(`${GRAPH}/${mediaId}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.url ?? null;
  } catch {
    return null;
  }
}

/** 24-часовое окно: вне него обычный текст Meta не пропустит. */
export function insideServiceWindow(lastInboundAt?: Date | null): boolean {
  if (!lastInboundAt) return false;
  return Date.now() - lastInboundAt.getTime() < 24 * 60 * 60 * 1000;
}
