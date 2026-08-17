import { redirect } from 'next/navigation';
import { getSafeSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { isStaff, isAdminLike } from '@/lib/roles';
import { PeopleClient } from './PeopleClient';

/**
 * «Команда» — профили всех сотрудников для всех, плюс управление
 * (создание, роли, пароли, одобрение) для админа/опер. директора.
 */
export default async function AdminPeoplePage() {
  const session = await getSafeSession();
  const me = session?.user as any;
  if (!isStaff(me?.role)) redirect('/admin');
  const canManage = isAdminLike(me?.role);

  const people = await prisma.user.findMany({
    where: canManage
      ? { role: { not: 'CLIENT' } }
      : { role: { not: 'CLIENT' }, approvedAt: { not: null } },
    orderBy: [{ approvedAt: 'asc' }, { name: 'asc' }],
    select: {
      id: true, name: true, email: true, phone: true, role: true,
      avatar: true, banner: true, jobTitle: true, bio: true, approvedAt: true,
    },
  });

  return (
    <PeopleClient
      meId={me.id}
      canManage={canManage}
      people={people.map((p) => ({
        id: p.id,
        name: p.name,
        email: p.email,
        phone: p.phone,
        role: p.role,
        avatar: p.avatar,
        banner: p.banner,
        jobTitle: p.jobTitle ?? '',
        bio: p.bio ?? '',
        approved: p.approvedAt !== null,
      }))}
    />
  );
}
