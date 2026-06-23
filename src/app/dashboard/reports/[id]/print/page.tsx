import { notFound } from 'next/navigation';
import { getSafeSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { ReportPrintClient } from './ReportPrintClient';

export default async function ReportPrintPage({ params }: { params: { id: string } }) {
  const session = await getSafeSession();
  const me = session?.user as any;
  const report = await prisma.monthlyReport.findUnique({
    where: { id: params.id },
    include: {
      client: { include: { owner: true } },
      platforms: { orderBy: { name: 'asc' } },
      campaigns: { orderBy: { createdAt: 'asc' } },
      audience: true,
    },
  });
  if (!report) notFound();

  // Permissions: client can only see own
  if (me.role === 'CLIENT') {
    if (report.client.owner.id !== me.id) notFound();
  }

  return (
    <ReportPrintClient
      report={{
        month: report.month,
        year: report.year,
        spent: report.spent,
        budget: report.budget,
        reach: report.reach,
        clicks: report.clicks,
        leads: report.leads,
        platforms: report.platforms.map((p) => ({ name: p.name, spent: p.spent, roas: p.roas })),
        campaigns: report.campaigns.map((c) => ({ name: c.name, platform: c.platform, status: c.status })),
        audience: report.audience
          ? {
              age18_24: report.audience.age18_24,
              age25_34: report.audience.age25_34,
              age35_44: report.audience.age35_44,
              age45plus: report.audience.age45plus,
            }
          : null,
      }}
      client={{ businessName: report.client.businessName, niche: report.client.niche }}
    />
  );
}
