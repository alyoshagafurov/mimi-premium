'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/admin/PageHeader';
import { ChatPanel } from '@/components/dashboard/ChatPanel';
import { cn } from '@/lib/utils';

type Conversation = {
  id: string;
  businessName: string;
  contactName: string;
  avatar: string | null;
  lastBody: string;
  lastAt: string;
  lastFromClient: boolean;
  unread: number;
};

function Avatar({ name, avatar }: { name: string; avatar: string | null }) {
  if (avatar) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={avatar} alt={name} className="h-10 w-10 shrink-0 rounded-full object-cover" />;
  }
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-[#0A0712]" style={{ background: `hsl(${h} 70% 70%)` }}>
      {(name || '?').charAt(0).toUpperCase()}
    </span>
  );
}

const fmt = (iso: string) => new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });

export function ChatInboxClient({
  meId, conversations, initialClient,
}: {
  meId: string;
  conversations: Conversation[];
  initialClient: string | null;
}) {
  const [active, setActive] = useState<string | null>(
    initialClient && conversations.some((c) => c.id === initialClient) ? initialClient : conversations[0]?.id ?? null,
  );

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Chat" title={<>Сообщения</>} subtitle="Переписка с клиентами. Новые сообщения помечены точкой." />

      {conversations.length === 0 ? (
        <p className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-12 text-center text-light/50">
          Пока нет сообщений от клиентов.
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          {/* Conversation list */}
          <div className={cn('rounded-3xl border border-white/[0.06] bg-white/[0.02] p-2', active && 'hidden lg:block')}>
            <div className="max-h-[70vh] space-y-1 overflow-y-auto">
              {conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActive(c.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors',
                    active === c.id ? 'bg-brand-lime/[0.08] border border-brand-lime/25' : 'border border-transparent hover:bg-white/[0.03]',
                  )}
                >
                  <Avatar name={c.businessName} avatar={c.avatar} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-light">{c.businessName}</span>
                      <span className="shrink-0 text-[10px] text-light/35">{fmt(c.lastAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[12px] text-light/45">
                        {c.lastFromClient ? '' : 'Вы: '}{c.lastBody || 'нет сообщений'}
                      </span>
                      {c.unread > 0 && (
                        <span className="ml-auto flex h-4 min-w-[16px] shrink-0 items-center justify-center rounded-full bg-brand-lime px-1 text-[10px] font-bold text-[#0A0712]">
                          {c.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Thread */}
          <div>
            {active && (
              <>
                <button onClick={() => setActive(null)} className="mb-2 text-[12px] text-light/50 hover:text-brand-lime lg:hidden">← К списку</button>
                <ChatPanel key={active} clientId={active} currentUserId={meId} />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
