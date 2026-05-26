import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SettingsClient } from './SettingsClient';

export default async function AdminSettingsPage() {
  const session = await getServerSession(authOptions);
  const user = await prisma.user.findUnique({ where: { id: (session!.user as any).id } });
  return (
    <SettingsClient
      user={{ id: user!.id, name: user!.name, email: user!.email, phone: user!.phone ?? '' }}
    />
  );
}
