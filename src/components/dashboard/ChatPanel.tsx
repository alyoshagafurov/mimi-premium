'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

type Msg = {
  id: string;
  body: string;
  createdAt: string;
  sender: { id: string; name: string; role: string; avatar?: string | null };
};

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'агентство', OPS_DIRECTOR: 'опер. директор', VIDEOGRAPHER: 'видеограф',
  SALES: 'продажи', DESIGNER: 'дизайнер', TARGETOLOGIST: 'таргетолог',
  DEVELOPER: 'разработка', CLIENT: 'клиент',
};

/** Deterministic avatar colour from a name, so each person is recognisable. */
function avatarHue(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return h;
}

function Avatar({ name, avatar }: { name: string; avatar?: string | null }) {
  if (avatar) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={avatar} alt={name} className="h-7 w-7 shrink-0 rounded-full object-cover" />;
  }
  const hue = avatarHue(name || '?');
  return (
    <span
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-[#0A0712]"
      style={{ background: `hsl(${hue} 70% 70%)` }}
    >
      {(name || '?').charAt(0).toUpperCase()}
    </span>
  );
}

export function ChatPanel({ clientId, currentUserId }: { clientId?: string; currentUserId: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    const u = clientId ? `/api/messages?clientId=${clientId}` : '/api/messages';
    const r = await fetch(u, { cache: 'no-store' });
    if (!r.ok) return;
    const data = await r.json();
    setMessages(data.messages ?? []);
  };

  useEffect(() => {
    load();
    const i = setInterval(load, 8000);
    return () => clearInterval(i);
  }, [clientId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const send = async () => {
    if (!body.trim() || sending) return;
    setSending(true);
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, body }),
      });
      setBody('');
      await load();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-[70vh] min-h-[480px] flex-col overflow-hidden rounded-3xl border border-white/[0.06] bg-ink2/30">
      <div className="border-b border-white/[0.06] px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 animate-pulse rounded-full bg-brand-lime" />
          <h2 className="font-display text-lg font-bold text-light">Чат с агентством</h2>
        </div>
        <p className="mt-0.5 text-[11px] text-light/45">Ответим в течение рабочего дня</p>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-center text-sm text-light/45">
            Здесь будет переписка с командой mimi.
          </div>
        )}
        <AnimatePresence initial={false}>
          {messages.map((m) => {
            const mine = m.sender.id === currentUserId;
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={cn('flex items-end gap-2', mine ? 'justify-end' : 'justify-start')}
              >
                {!mine && <Avatar name={m.sender.name} avatar={m.sender.avatar} />}
                <div
                  className={cn(
                    'max-w-[78%] rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed',
                    mine
                      ? 'bg-brand-lime/15 text-light border border-brand-lime/30'
                      : 'bg-white/[0.04] text-light/90 border border-white/[0.06]',
                  )}
                >
                  {!mine && (
                    <div className="mb-1 text-[10px] uppercase tracking-[0.18em] text-brand-orange/80">
                      {m.sender.name} · {ROLE_LABEL[m.sender.role] ?? m.sender.role}
                    </div>
                  )}
                  <div className="whitespace-pre-wrap">{m.body}</div>
                  <div className="mt-1 text-[10px] text-light/35">
                    {new Date(m.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                {mine && <Avatar name={m.sender.name} avatar={m.sender.avatar} />}
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>
      <div className="border-t border-white/[0.06] p-4">
        <div className="flex gap-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Напишите сообщение..."
            rows={2}
            className="input-glass flex-1 resize-none"
          />
          <button onClick={send} disabled={sending || !body.trim()} className="btn-lime self-end disabled:opacity-50">
            {sending ? '...' : 'Отправить'}
          </button>
        </div>
      </div>
    </div>
  );
}
