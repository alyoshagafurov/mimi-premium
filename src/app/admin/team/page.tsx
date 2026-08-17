import { redirect } from 'next/navigation';
import { getSafeSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { isAdminLike } from '@/lib/roles';
import { TeamClient } from './TeamClient';

export default async function AdminTeamPage() {
  const session = await getSafeSession();
  if (!isAdminLike((session?.user as any)?.role)) redirect('/admin/calendar');

  const staff = await prisma.user.findMany({
    where: { role: { not: 'CLIENT' } },
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true, approvedAt: true, avatar: true, jobTitle: true, bio: true },
  });

  return (
    <TeamClient
      meId={(session!.user as any).id}
      staff={staff.map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        phone: s.phone,
        role: s.role,
        approved: s.approvedAt !== null,
        avatar: s.avatar,
        jobTitle: s.jobTitle ?? '',
        bio: s.bio ?? '',
      }))}
    />
  );
}
