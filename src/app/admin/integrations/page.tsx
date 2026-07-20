import { prisma } from '@/lib/prisma';
import { IntegrationsClient } from './IntegrationsClient';

export default async function AdminIntegrationsPage() {
  const [clients, accounts] = await Promise.all([
    prisma.client.findMany({ select: { id: true, businessName: true }, orderBy: { businessName: 'asc' } }),
    prisma.facebookAccount.findMany({ include: { client: { select: { businessName: true } } } }),
  ]);
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://mimitj.agency').replace(/\/$/, '');
  return (
    <IntegrationsClient
      webhookUrl={`${appUrl}/api/facebook/webhook`}
      verifyToken={process.env.FB_VERIFY_TOKEN ?? ''}
      clients={clients}
      accounts={accounts.map((a) => ({
        id: a.id,
        clientId: a.clientId,
        clientName: a.client.businessName,
        pageId: a.pageId ?? '',
        pageName: a.pageName ?? '',
        adAccountId: a.adAccountId ?? '',
        hasToken: !!a.accessToken,
        connectedAt: a.connectedAt?.toISOString() ?? null,
      }))}
    />
  );
}
