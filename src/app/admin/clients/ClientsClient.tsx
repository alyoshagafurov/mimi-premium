'use client';

import { useState } from 'react';
import Link from 'next/link';
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
  reports: number;
};

const TARIFFS = ['NONE', 'START', 'GROWTH', 'PREMIUM'] as const;

const emptyNew = {
  name: '',
  email: '',
  password: '',
  businessName: '',
  niche: '',
  tariff: 'NONE' as string,
};

export function ClientsClient({ clients }: { clients: Row[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Row | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyNew);
  const [busy, setBusy] = useState(false);
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
      body: JSON.stringify({ businessName: row.businessName, niche: row.niche, tariff: row.tariff }),
    });
    if (res.ok) {
      toast.success('Изменения сохранены');
      setEditing(null);
      router.refresh();
    } else toast.error('Не удалось сохранить');
  };

  const create = async () => {
    if (!form.name || !form.email || form.password.length < 6 || !form.businessName) {
      toast.error('Заполните имя, email, пароль (6+) и название бизнеса');
      return;
    }
    setBusy(true);
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setBusy(false);
    if (res.ok) {
      toast.success('Клиент создан');
      setCreating(false);
      setForm(emptyNew);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? 'Не удалось создать клиента');
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Clients"
        title={<>Активные <span className="text-lime-grad">аккаунты</span></>}
        subtitle="Управление клиентскими бизнесами, нишами и тарифами."
        action={
          <button onClick={() => setCreating(true)} className="btn-gold !px-5 !py-3 !text-[11px]">
            + Добавить клиента
          </button>
        }
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
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-white/[0.02] text-[10px] uppercase tracking-[0.16em] text-muted">
              <tr>
                <th className="px-4 py-3 text-left">Клиент</th>
                <th className="px-4 py-3 text-left">Ниша</th>
                <th className="px-4 py-3 text-left">Тариф</th>
                <th className="px-4 py-3 text-left">Отчётов</th>
                <th className="px-4 py-3 text-left">Статус</th>
                <th className="px-4 py-3 text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-t border-white/5 transition hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-lime-gradient font-bold text-ink">
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
                  <td className="px-4 py-3 text-muted">{c.reports}</td>
                  <td className="px-4 py-3"><StatusPill status={c.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/clients/${c.id}`}
                        className="rounded-lg border border-brand-lime/30 bg-brand-lime/[0.06] px-3 py-1.5 text-[11px] text-brand-lime transition hover:bg-brand-lime/[0.12]"
                      >
                        Управлять
                      </Link>
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

      {/* Edit modal */}
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
                <div>
                  <label className="label-soft">Тариф</label>
                  <select
                    className="input-glass"
                    value={editing.tariff}
                    onChange={(e) => setEditing({ ...editing, tariff: e.target.value })}
                  >
                    {TARIFFS.map((t) => (
                      <option key={t} value={t}>{tariffLabel(t)}</option>
                    ))}
                  </select>
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

      {/* Create modal */}
      <AnimatePresence>
        {creating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCreating(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-gold w-full max-w-md rounded-3xl p-8"
            >
              <h2 className="font-display text-xl font-bold">Новый клиент</h2>
              <p className="text-xs text-muted">Создаст учётную запись и бизнес-аккаунт.</p>
              <div className="mt-6 space-y-4">
                <div>
                  <label className="label-soft">Имя контактного лица</label>
                  <input className="input-glass" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-soft">Email</label>
                    <input className="input-glass" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div>
                    <label className="label-soft">Пароль</label>
                    <input className="input-glass" type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="label-soft">Название бизнеса</label>
                  <input className="input-glass" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-soft">Ниша</label>
                    <input className="input-glass" value={form.niche} onChange={(e) => setForm({ ...form, niche: e.target.value })} />
                  </div>
                  <div>
                    <label className="label-soft">Тариф</label>
                    <select className="input-glass" value={form.tariff} onChange={(e) => setForm({ ...form, tariff: e.target.value })}>
                      {TARIFFS.map((t) => (
                        <option key={t} value={t}>{tariffLabel(t)}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setCreating(false)} className="btn-ghost">Отмена</button>
                <button onClick={create} disabled={busy} className="btn-gold disabled:opacity-60">
                  {busy ? 'Создаём…' : 'Создать'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
