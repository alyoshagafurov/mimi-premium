'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { StatusPill } from '@/components/ui/StatusPill';
import { PageHeader } from '@/components/admin/PageHeader';
import { tariffLabel } from '@/lib/utils';

type Row = {
  id: string;
  businessName: string;
  niche: string;
  status: string;
  createdAt: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  tariff: string;
  campaigns: number;
};

export function ClientsClient({ clients }: { clients: Row[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Row | null>(null);
  const [filter, setFilter] = useState('');

  const filtered = clients.filter((c) =>
    [c.businessName, c.niche, c.ownerName, c.ownerEmail].join(' ').toLowerCase().includes(filter.toLowerCase()),
  );

  const updateStatus = async (id: string, status: 'ACTIVE' | 'ARCHIVED') => {
    const res = await fetch(`/api/clients/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      toast.success(status === 'ACTIVE' ? 'Клиент активирован' : 'Клиент в архиве');
      router.refresh();
    } else toast.error('Не удалось обновить');
  };

  const save = async (row: Row) => {
    const res = await fetch(`/api/clients/${row.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessName: row.businessName, niche: row.niche }),
    });
    if (res.ok) {
      toast.success('Изменения сохранены');
      setEditing(null);
      router.refresh();
    } else toast.error('Не удалось сохранить');
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Clients"
        title={<>Активные <span className="text-lime-grad">аккаунты</span></>}
        subtitle="Управление клиентскими бизнесами, нишами и тарифами."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          placeholder="Поиск по бизнесу, нише, имени…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="input-glass max-w-sm"
        />
        <span className="chip-lime">{filtered.length} клиентов</span>
      </div>

      <div className="glass overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="bg-white/[0.02] text-[10px] uppercase tracking-[0.16em] text-muted">
              <tr>
                <th className="px-4 py-3 text-left">Клиент</th>
                <th className="px-4 py-3 text-left">Ниша</th>
                <th className="px-4 py-3 text-left">Тариф</th>
                <th className="px-4 py-3 text-left">Кампаний</th>
                <th className="px-4 py-3 text-left">Статус</th>
                <th className="px-4 py-3 text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-t border-white/5 transition hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-gradient font-bold text-ink">
                        {c.businessName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-light">{c.businessName}</div>
                        <div className="text-[11px] text-muted">{c.ownerName} · {c.ownerEmail}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">{c.niche}</td>
                  <td className="px-4 py-3">
                    <span className="chip text-gold/90">{tariffLabel(c.tariff)}</span>
                  </td>
                  <td className="px-4 py-3 text-muted">{c.campaigns}</td>
                  <td className="px-4 py-3"><StatusPill status={c.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditing(c)}
                        className="rounded-lg border border-white/10 px-3 py-1.5 text-[11px] text-muted transition hover:border-gold/40 hover:text-gold"
                      >
                        Редактировать
                      </button>
                      <button
                        onClick={() => updateStatus(c.id, c.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE')}
                        className="rounded-lg border border-white/10 px-3 py-1.5 text-[11px] text-muted transition hover:border-gold/40 hover:text-gold"
                      >
                        {c.status === 'ACTIVE' ? 'Архивировать' : 'Восстановить'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted">Ничего не найдено</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setEditing(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-gold w-full max-w-md rounded-3xl p-8"
            >
              <h2 className="font-display text-xl font-bold">Редактировать клиента</h2>
              <p className="text-xs text-muted">{editing.ownerEmail}</p>
              <div className="mt-6 space-y-4">
                <div>
                  <label className="label-soft">Название бизнеса</label>
                  <input
                    className="input-glass"
                    value={editing.businessName}
                    onChange={(e) => setEditing({ ...editing, businessName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label-soft">Ниша</label>
                  <input
                    className="input-glass"
                    value={editing.niche}
                    onChange={(e) => setEditing({ ...editing, niche: e.target.value })}
                  />
                </div>
                <div className="text-[11px] text-muted">
                  Создан: {format(new Date(editing.createdAt), 'd MMMM yyyy', { locale: ru })}
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setEditing(null)} className="btn-ghost">Отмена</button>
                <button onClick={() => save(editing)} className="btn-gold">Сохранить</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
