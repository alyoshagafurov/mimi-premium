import { prisma } from '@/lib/prisma';
import { CampaignsClient } from './CampaignsClient';

export default async function AdminCampaignsPage() {
  const [campaigns, clients] = await Promise.all([
    prisma.campaign.findMany({ include: { client: true }, orderBy: { createdAt: 'desc' } }),
    prisma.client.findMany(),
  ]);
  return (
    <CampaignsClient
      campaigns={campaigns.map((c) => ({
        id: c.id,
        name: c.name,
        platform: c.platform,
        budget: c.budget,
        spent: c.spent,
        leads: c.leads,
        sales: c.sales,
        romi: c.romi,
        status: c.status,
        clientId: c.clientId,
        clientName: c.client.businessName,
      }))}
      clients={clients.map((c) => ({ id: c.id, name: c.businessName }))}
    />
  );
}
