import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ChatPanel } from '@/components/dashboard/ChatPanel';

export default async function DashboardChatPage() {
  const session = await getServerSession(authOptions);
  const me = session?.user as any;
  return (
    <main className="mx-auto max-w-3xl px-4 py-6 lg:px-6">
      <div className="mb-6">
        <p className="text-[10px] uppercase tracking-[0.32em] text-brand-orange">Поддержка</p>
        <h1 className="mt-2 font-display text-2xl font-extrabold text-light sm:text-3xl">Чат с командой</h1>
      </div>
      <ChatPanel currentUserId={me?.id} />
    </main>
  );
}
