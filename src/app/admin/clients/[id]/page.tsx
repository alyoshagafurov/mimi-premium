import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/admin/PageHeader';
import { ClientAbout } from '@/components/admin/ClientAbout';
import { CredentialsPanel } from '@/components/admin/CredentialsPanel';
import { StatusPill } from '@/components/ui/StatusPill';
import { ClientCrmPanel } from './ClientCrmPanel';
import { ClientReportsPanel } from './ClientReportsPanel';
import { compareReports, tariffLabel } from '@/lib/utils';

export default async function AdminClientManagePage({ params }: { params: { id: string } }) {
  const [client, team] = await Promise.all([
    prisma.client.findUnique({
    relationLoadStrategy: 'join',
      where: { id: params.id },
      include: {
        owner: { select: { id: true, name: true, email: true, phone: true, avatar: true, tariff: true, tariffEnd: true } },
        payments: { orderBy: [{ year: 'desc' }, { month: 'desc' }] },
        tasks: { orderBy: [{ done: 'asc' }, { dueDate: 'asc' }] },
        activities: { orderBy: { createdAt: 'desc' }, include: { author: { select: { name: true } } } },
        messages: { orderBy: { createdAt: 'desc' }, include: { sender: { select: { name: true } } } },
        files: {
          where: { mime: 'application/pdf' },
          select: { id: true, name: true, url: true, size: true, createdAt: true },
        },
      },
    }),
    prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true, name: true } }),
  ]);

  if (!client) notFound();

  return (
    <div className="space-y-8">
      <Link href="/admin/clients" className="btn-quiet text-[11px]">
        ← Все клиенты
      </Link>

      <PageHeader
        eyebrow="Управление клиентом"
        title={<span className="text-lime-grad">{client.businessName}</span>}
        subtitle={`${client.niche} · ${client.owner.name} · ${client.owner.email}`}
        action={
          <div className="flex items-center gap-2">
            <span className="chip text-gold/90">{tariffLabel(client.owner.tariff)}</span>
            <StatusPill status={client.status} />
          </div>
        }
      />

      <CredentialsPanel endpoint={`/api/clients/${client.id}`} email={client.owner.email} />

      <ClientAbout value={client.description ?? ''} endpoint={`/api/clients/${client.id}`} />

      <ClientReportsPanel
        clientId={client.id}
        reports={client.files
          .map((f) => ({ id: f.id, name: f.name, url: f.url, size: f.size, createdAt: f.createdAt.toISOString() }))
          .sort(compareReports)}
      />

      <ClientCrmPanel
        clientId={client.id}
        team={team}
        payments={client.payments.map((p) => ({
          id: p.id,
          amount: p.amount,
          status: p.status,
          month: p.month,
          year: p.year,
          dueDate: p.dueDate?.toISOString() ?? null,
          paidAt: p.paidAt?.toISOString() ?? null,
          method: p.method ?? '',
          note: p.note ?? '',
        }))}
        tasks={client.tasks.map((t) => ({
          id: t.id,
          title: t.title,
          done: t.done,
          dueDate: t.dueDate?.toISOString() ?? null,
          priority: t.priority,
        }))}
        activities={client.activities.map((a) => ({
          id: a.id,
          kind: a.kind,
          body: a.body,
          createdAt: a.createdAt.toISOString(),
          authorName: a.author?.name ?? null,
        }))}
        tariffEnd={client.owner.tariffEnd?.toISOString() ?? null}
        clientNotes={client.messages.map((m) => ({
          id: m.id,
          body: m.body,
          createdAt: m.createdAt.toISOString(),
          authorName: m.sender?.name ?? null,
        }))}
      />
    </div>
  );
}
