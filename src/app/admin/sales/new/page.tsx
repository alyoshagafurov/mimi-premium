import { redirect } from 'next/navigation';
import { getSafeSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { isAdminLike } from '@/lib/roles';
import { NewLeadForm } from './NewLeadForm';

export default async function NewLeadPage() {
  const session = await getSafeSession();
  const me = session?.user as any;
  const role = me?.role as string | undefined;
  if (!isAdminLike(role) && role !== 'SALES') redirect('/admin');

  // Only admin/ops may hand a new lead straight to another salesperson.
  const reps = isAdminLike(role)
    ? await prisma.user.findMany({
        where: { role: { in: ['SALES', 'ADMIN', 'OPS_DIRECTOR'] } },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      })
    : [];

  return <NewLeadForm reps={reps} meId={me?.id ?? ''} canAssign={isAdminLike(role)} />;
}
