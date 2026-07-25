import { redirect } from 'next/navigation';
import { getSafeSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { isAdminLike } from '@/lib/roles';
import { ChatInboxClient } from './ChatInboxClient';

export default async function AdminChatPage({ searchParams }: { searchParams: { client?: string } }) {
  const session = await getSafeSession();
  const me = session?.user as any;
  if (!isAdminLike(me?.role)) redirect('/admin/calendar');

  const [clients, unread] = await Promise.all([
    prisma.client.findMany({
      where: { messages: { some: {} } },
      include: {
        owner: { select: { name: true, avatar: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { body: true, createdAt: true, sender: { select: { role: true } } } },
      },
    }),
    prisma.message.findMany({ where: { read: false, sender: { role: 'CLIENT' } }, select: { clientId: true } }),
  ]);

  const unreadMap = new Map<string, number>();
  for (const m of unread) unreadMap.set(m.clientId, (unreadMap.get(m.clientId) ?? 0) + 1);

  const conversations = clients
    .map((c) => ({
      id: c.id,
      businessName: c.businessName,
      contactName: c.contactName ?? c.owner.name,
      avatar: c.logo ?? c.owner.avatar ?? null,
      lastBody: c.messages[0]?.body ?? '',
      lastAt: c.messages[0]?.createdAt.toISOString() ?? c.updatedAt.toISOString(),
      lastFromClient: c.messages[0]?.sender.role === 'CLIENT',
      unread: unreadMap.get(c.id) ?? 0,
    }))
    .sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());

  return <ChatInboxClient meId={me.id} conversations={conversations} initialClient={searchParams.client ?? null} />;
}
