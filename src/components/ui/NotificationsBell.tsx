'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type Item = {
  id: string;
  kind: 'LEAD' | 'PAYMENT' | 'TASK' | 'REPORT' | 'MESSAGE' | 'SYSTEM';
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
};

const KIND_ICON: Record<Item['kind'], string> = {
  LEAD: '◆',
  PAYMENT: '$',
  TASK: '✓',
  REPORT: '▤',
  MESSAGE: '✉',
  SYSTEM: '◷',
};

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'только что';
  if (m < 60) return `${m} мин`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч`;
  const d = Math.floor(h / 24);
  return `${d} д`;
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const load = async () => {
    try {
      const r = await fetch('/api/notifications', { cache: 'no-store' });
      if (!r.ok) return;
      const data = await r.json();
      setItems(data.items ?? []);
      setUnread(data.unread ?? 0);
    } catch {}
  };

  useEffect(() => {
    load();
    const i = setInterval(load, 30000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const markAll = async () => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    });
    setItems((xs) => xs.map((x) => ({ ...x, read: true })));
    setUnread(0);
  };

  const markOne = async (id: string) => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, read: true } : x)));
    setUnread((n) => Math.max(0, n - 1));
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-light/70 transition hover:border-brand-lime/40 hover:text-brand-lime"
        aria-label="Уведомления"
      >
        <span className="text-base">◷</span>
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-lime px-1 text-[10px] font-bold text-[#0A0712]">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 top-12 z-50 w-[340px] overflow-hidden rounded-2xl border border-white/10 bg-ink2/95 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)] backdrop-blur-xl"
          >
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
              <div className="text-sm font-semibold text-light">Уведомления</div>
              {unread > 0 && (
                <button
                  onClick={markAll}
                  className="text-[11px] uppercase tracking-[0.12em] text-brand-lime hover:text-brand-limeSoft"
                >
                  Прочитать все
                </button>
              )}
            </div>
            <div className="max-h-[420px] overflow-y-auto">
              {items.length === 0 && (
                <div className="px-4 py-10 text-center text-sm text-light/45">
                  Пока тихо. Здесь будут лиды, задачи и оплаты.
                </div>
              )}
              {items.map((it) => {
                const Body = (
                  <div
                    onClick={() => {
                      if (!it.read) markOne(it.id);
                      setOpen(false);
                    }}
                    className={cn(
                      'flex gap-3 px-4 py-3 transition-colors hover:bg-white/[0.02]',
                      !it.read && 'bg-brand-lime/[0.04]',
                    )}
                  >
                    <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-brand-lime/30 bg-brand-lime/10 text-xs text-brand-lime">
                      {KIND_ICON[it.kind]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <div className="truncate text-sm font-medium text-light">{it.title}</div>
                        <div className="flex-shrink-0 text-[10px] text-light/40">{timeAgo(it.createdAt)}</div>
                      </div>
                      {it.body && <div className="mt-0.5 line-clamp-2 text-[12px] text-light/55">{it.body}</div>}
                    </div>
                    {!it.read && <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-lime" />}
                  </div>
                );
                return it.link ? (
                  <Link key={it.id} href={it.link} className="block">
                    {Body}
                  </Link>
                ) : (
                  <div key={it.id}>{Body}</div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
