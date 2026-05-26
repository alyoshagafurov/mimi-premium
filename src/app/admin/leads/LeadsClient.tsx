'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { StatusPill } from '@/components/ui/StatusPill';
import { PageHeader } from '@/components/admin/PageHeader';

type Row = {
  id: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  status: string;
  createdAt: string;
};

export function LeadsClient({ leads }: { leads: Row[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<string>('');

  const filtered = filter ? leads.filter((l) => l.status === filter) : leads;

  const change = async (id: string, status: string) => {
    const res = await fetch(`/api/contact-requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      toast.success('Статус обновлён');
      router.refresh();
    } else toast.error('Не удалось обновить');
  };

  const counts = {
    NEW: leads.filter((l) => l.status === 'NEW').length,
    WORKING: leads.filter((l) => l.status === 'WORKING').length,
    CLOSED: leads.filter((l) => l.status === 'CLOSED').length,
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Inbox"
        title={<>Свежие <span className="text-lime-grad">заявки</span></>}
        subtitle="Обращения с лендинга. Меняйте статус сразу — клиенты увидят его в кабинете."
      />

      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => setFilter(filter === 'NEW' ? '' : 'NEW')}
          className={`glass-luxury rounded-2xl p-5 text-left transition ${filter === 'NEW' ? 'ring-1 ring-brand-lime/40 shadow-[0_0_30px_-8px_rgba(212,236,76,0.45)]' : ''}`}
        >
          <div className="text-[10px] uppercase tracking-[0.24em] text-light/45">Новые</div>
          <div className="mt-2 font-display text-3xl font-extrabold text-brand-lime">{counts.NEW}</div>
        </button>
        <button
          onClick={() => setFilter(filter === 'WORKING' ? '' : 'WORKING')}
          className={`glass-luxury rounded-2xl p-5 text-left transition ${filter === 'WORKING' ? 'ring-1 ring-brand-orange/40 shadow-[0_0_30px_-8px_rgba(252,150,3,0.45)]' : ''}`}
        >
          <div className="text-[10px] uppercase tracking-[0.24em] text-light/45">В работе</div>
          <div className="mt-2 font-display text-3xl font-extrabold text-brand-orange">{counts.WORKING}</div>
        </button>
        <button
          onClick={() => setFilter(filter === 'CLOSED' ? '' : 'CLOSED')}
          className={`glass-luxury rounded-2xl p-5 text-left transition ${filter === 'CLOSED' ? 'ring-1 ring-white/15' : ''}`}
        >
          <div className="text-[10px] uppercase tracking-[0.24em] text-light/45">Закрыты</div>
          <div className="mt-2 font-display text-3xl font-extrabold text-light/55">{counts.CLOSED}</div>
        </button>
      </div>

      <div className="space-y-3">
        {filtered.map((l, i) => (
          <motion.div
            key={l.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.03 }}
            className="glass rounded-2xl p-5"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-medium text-light">{l.name}</span>
                  <StatusPill status={l.status} />
                  <span className="text-[11px] text-muted">
                    {format(new Date(l.createdAt), 'd MMMM, HH:mm', { locale: ru })}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                  <a href={`tel:${l.phone}`} className="transition hover:text-gold">{l.phone}</a>
                  <a href={`mailto:${l.email}`} className="transition hover:text-gold">{l.email}</a>
                </div>
                {l.message && <p className="mt-3 text-sm text-light/90">{l.message}</p>}
              </div>
              <select
                value={l.status}
                onChange={(e) => change(l.id, e.target.value)}
                className="input-glass max-w-[200px]"
              >
                <option value="NEW" className="bg-surface">Новая</option>
                <option value="WORKING" className="bg-surface">В работе</option>
                <option value="CLOSED" className="bg-surface">Закрыта</option>
              </select>
            </div>
          </motion.div>
        ))}
        {!filtered.length && (
          <div className="glass rounded-2xl p-10 text-center text-sm text-muted">
            Заявок по фильтру нет
          </div>
        )}
      </div>
    </div>
  );
}
