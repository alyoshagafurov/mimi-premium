import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ChatPanel } from '@/components/dashboard/ChatPanel';

export default async function AdminClientChatPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const me = session?.user as any;
  const client = await prisma.client.findUnique({ where: { id: params.id } });
  if (!client) notFound();
  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/admin/clients/${client.id}`} className="text-xs uppercase tracking-[0.18em] text-light/45 hover:text-brand-lime">
            ← {client.businessName}
          </Link>
          <h1 className="mt-2 font-display text-2xl font-extrabold text-light sm:text-3xl">Чат с клиентом</h1>
        </div>
      </div>
      <ChatPanel clientId={client.id} currentUserId={me?.id} />
    </main>
  );
}
