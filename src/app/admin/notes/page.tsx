import { redirect } from 'next/navigation';
import { getSafeSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { isStaff } from '@/lib/roles';
import { NotesClient } from './NotesClient';

export default async function AdminNotesPage() {
  const session = await getSafeSession();
  const me = session?.user as any;
  if (!isStaff(me?.role)) redirect('/admin');

  // Личные заметки: только свои, включая оставленные на событиях календаря.
  const notes = await prisma.staffNote.findMany({
    relationLoadStrategy: 'join',
    where: { authorId: me.id },
    orderBy: { createdAt: 'desc' },
    take: 300,
    include: { event: { select: { id: true, title: true, startAt: true } } },
  });

  return (
    <NotesClient
      notes={notes.map((n) => ({
        id: n.id,
        body: n.body,
        createdAt: n.createdAt.toISOString(),
        eventId: n.event?.id ?? null,
        eventTitle: n.event?.title ?? null,
        eventAt: n.event?.startAt.toISOString() ?? null,
        remindAt: n.remindAt?.toISOString() ?? null,
        remindText: n.remindText ?? '',
      }))}
    />
  );
}
