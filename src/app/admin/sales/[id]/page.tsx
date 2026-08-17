import { notFound, redirect } from 'next/navigation';
import { getSafeSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { canWorkLeads, LEAD_ROLES } from '@/lib/roles';
import { LeadDetail } from './LeadDetail';

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const session = await getSafeSession();
  const me = session?.user as any;
  const role = me?.role as string | undefined;
  if (!canWorkLeads(role)) redirect('/admin');

  const [lead, reps] = await Promise.all([
    prisma.client.findUnique({
    relationLoadStrategy: 'join',
      where: { id: params.id },
      include: {
        owner: { select: { name: true, email: true, phone: true } },
        createdBy: { select: { name: true } },
        assignedTo: { select: { id: true, name: true } },
        activities: {
          where: { kind: 'NOTE' },
          orderBy: { createdAt: 'desc' },
          take: 100,
          include: { author: { select: { name: true } } },
        },
      },
    }),
    prisma.user.findMany({
    relationLoadStrategy: 'join',
      where: { role: { in: LEAD_ROLES } },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);
  if (!lead) notFound();

  return (
    <LeadDetail
      reps={reps}
      lead={{
        id: lead.id,
        firstName: lead.firstName ?? '',
        lastName: lead.lastName ?? '',
        contactName: lead.contactName ?? lead.businessName,
        businessName: lead.businessName,
        niche: lead.niche,
        phone: lead.owner.phone ?? '',
        email: lead.owner.email,
        salesStatus: lead.salesStatus,
        packageType: lead.packageType,
        sourceType: lead.sourceType,
        sourceUrl: lead.sourceUrl,
        sourceCover: lead.sourceCover,
        sourceNote: lead.sourceNote,
        telegram: lead.telegram,
        instagram: lead.instagram,
        comment: lead.comment ?? '',
        createdByName: lead.createdBy?.name ?? null,
        assignedToId: lead.assignedTo?.id ?? '',
        assignedToName: lead.assignedTo?.name ?? null,
        reminderAt: lead.reminderAt?.toISOString() ?? null,
        reminderNote: lead.reminderNote ?? '',
        createdAt: lead.createdAt.toISOString(),
      }}
      notes={lead.activities.map((a) => ({
        id: a.id,
        body: a.body,
        author: a.author?.name ?? 'Сотрудник',
        createdAt: a.createdAt.toISOString(),
      }))}
    />
  );
}
