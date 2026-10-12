import { NextResponse } from 'next/server';
import { ensureAdminLike } from '@/lib/api-guard';
import { graphGet, whatsappSendEnabled, appSecret, verifyToken } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

/**
 * Проверка подключения к Meta: отвечает на вопрос «почему не приходят
 * сообщения», не раскрывая секретов. Токены и ключи наружу не отдаются —
 * только признак «задано / не задано» и ответы Graph API.
 *
 * Самая частая причина молчания вебхука: приложение прошло проверку адреса,
 * но не подписано на сам аккаунт WhatsApp Business — тогда Meta не присылает
 * ни одного события.
 */
export async function GET() {
  const session = await ensureAdminLike();
  if (!session) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const wabaId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  const env = {
    WHATSAPP_ACCESS_TOKEN: !!process.env.WHATSAPP_ACCESS_TOKEN,
    WHATSAPP_PHONE_NUMBER_ID: !!phoneNumberId,
    WHATSAPP_BUSINESS_ACCOUNT_ID: !!wabaId,
    WHATSAPP_APP_SECRET: !!appSecret,
    WHATSAPP_VERIFY_TOKEN: !!verifyToken,
    WHATSAPP_ALLOWED_RECIPIENTS: !!process.env.WHATSAPP_ALLOWED_RECIPIENTS,
  };

  if (!whatsappSendEnabled || !wabaId) {
    return NextResponse.json({
      env,
      error: 'Нужны WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID и WHATSAPP_BUSINESS_ACCOUNT_ID',
    });
  }

  const [number, subscribed, numbers] = await Promise.all([
    graphGet(`${phoneNumberId}?fields=display_phone_number,verified_name,quality_rating,platform_type,code_verification_status`),
    graphGet(`${wabaId}/subscribed_apps`),
    graphGet(`${wabaId}/phone_numbers?fields=display_phone_number,verified_name,platform_type`),
  ]);

  const apps = (subscribed.ok ? (subscribed.data?.data ?? []) : []) as {
    whatsapp_business_api_data?: { name?: string; id?: string };
  }[];

  return NextResponse.json({
    env,
    /** Токен рабочий и номер виден — значит, связка «токен ↔ номер» верна. */
    number: number.ok ? number.data : { error: number.error },
    /** Пусто = приложение не подписано на аккаунт, событий не будет вообще. */
    subscribedApps: subscribed.ok
      ? apps.map((a) => ({ name: a.whatsapp_business_api_data?.name ?? null, id: a.whatsapp_business_api_data?.id ?? null }))
      : { error: subscribed.error },
    appSubscribed: subscribed.ok ? apps.length > 0 : null,
    /** Все номера аккаунта — чтобы увидеть, на тот ли номер писали. */
    wabaNumbers: numbers.ok ? (numbers.data?.data ?? []) : { error: numbers.error },
  });
}
