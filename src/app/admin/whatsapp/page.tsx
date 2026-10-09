import { redirect } from 'next/navigation';
import { getSafeSession } from '@/lib/session';
import { canAccessSection, userRoles } from '@/lib/roles';
import { whatsappSendEnabled, whatsappWebhookEnabled, appSecret } from '@/lib/whatsapp';
import { WhatsAppClient } from './WhatsAppClient';

export default async function AdminWhatsAppPage() {
  const session = await getSafeSession();
  const roles = userRoles(session?.user as any);
  if (!canAccessSection(roles, 'whatsapp')) redirect('/admin');

  // Что из настройки Meta ещё не сделано — показываем прямо в интерфейсе,
  // чтобы не искать причину «почему ничего не приходит».
  const missing = [
    !whatsappWebhookEnabled && 'WHATSAPP_VERIFY_TOKEN',
    !appSecret && 'WHATSAPP_APP_SECRET',
    !whatsappSendEnabled && 'WHATSAPP_ACCESS_TOKEN + WHATSAPP_PHONE_NUMBER_ID',
  ].filter(Boolean) as string[];

  return <WhatsAppClient missingEnv={missing} />;
}
