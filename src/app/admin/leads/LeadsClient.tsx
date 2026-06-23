'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/admin/PageHeader';
import { DealDrawer } from './DealDrawer';
import { DEAL_STAGES, dealStageLabel, dealStageAccent, formatMoney, cn } from '@/lib/utils';

type Deal = {
  id: string;
  title: string;
  contactName: string;
  phone: string;
  email: string;
  message: string;
  source: string;
  stage: string;
  amount: number;
  ownerId: string | null;
  ownerName: string | null;
  clientId: string | null;
  clientName: string | null;
  createdAt: string;
};
type Team = { id: string; name: string }[];
type Clients = { id: string; businessName: string }[];

const emptyNew = { title: '', contactName: '', phone: '', email: '', amount: '', ownerId: '', stage: 'NEW' };

export function LeadsClient({ deals: initial, team, clients }: { deals: Deal[]; team: Team; clients: Clients }) {
  const router = useRouter();
  const [deals, setDeals] = useState<Deal[]>(initial);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyNew);

  useEffect(() => setDeals(initial), [initial]);

  const moveStage = async (id: string, stage: string) => {
    const current = deals.find((d) => d.id === id);
    if (!current || current.stage === stage) return;
    setDeals((ds) => ds.map((d) => (d.id === id ? { ...d, stage } : d))); // optimistic
    const res = await fetch(`/api/deals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage }),
    });
    if (res.ok) router.refresh();
    else {
      toast.error('Не удалось переместить');
      setDeals(initial);
    }
  };

  const createDeal = async () => {
    if (!form.title.trim() || !form.contactName.trim()) {
      toast.error('Заполните название и контакт');
      return;
    }
    const res = await fetch('/api/deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title,
        contactName: form.contactName,
        phone: form.phone || undefined,
        email: form.email || undefined,
        amount: Number(form.amount) || 0,
        stage: form.stage,
        ownerId: form.ownerId || null,
        source: 'Вручную',
      }),
    });
    if (res.ok) {
      toast.success('Сделка создана');
      setCreating(false);
      setForm(emptyNew);
      router.refresh();
    } else toast.error('Не удалось создать');
  };

  const totalActive = deals.filter((d) => d.stage !== 'LOST').reduce((s, d) => s + d.amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Pipeline"
        title={<>Воронка <span className="text-lime-grad">сделок</span></>}
        subtitle={`${deals.length} сделок · ${formatMoney(totalActive)} в работе`}
        action={
          <button onClick={() => setCreating(true)} className="btn-gold !px-5 !py-3 !text-[11px]">
            + Новая сделка
          </button>
        }
      />

      {/* Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {DEAL_STAGES.map((stage) => {
          const column = deals.filter((d) => d.stage === stage);
          const sum = column.reduce((s, d) => s + d.amount, 0);
          return (
            <div
              key={stage}
              onDragOver={(e) => {
                e.preventDefault();
                setOverStage(stage);
              }}
              onDragLeave={() => setOverStage((s) => (s === stage ? null : s))}
              onDrop={() => {
                if (dragId) moveStage(dragId, stage);
                setDragId(null);
                setOverStage(null);
              }}
              className={cn(
                'flex w-72 shrink-0 flex-col rounded-2xl border bg-white/[0.015] p-3 transition-colors',
                overStage === stage ? 'border-brand-lime/40 bg-brand-lime/[0.04]' : 'border-white/[0.06]',
              )}
            >
              <div className={cn('mb-2 flex items-center justify-between rounded-xl border px-3 py-2', dealStageAccent(stage))}>
                <span className="text-[11px] font-bold uppercase tracking-[0.14em]">{dealStageLabel(stage)}</span>
                <span className="text-[11px] opacity-80">{column.length}</span>
              </div>
              <div className="px-1 text-[10px] uppercase tracking-[0.16em] text-muted">{formatMoney(sum)}</div>

              <div className="mt-2 flex flex-1 flex-col gap-2">
                {column.map((d) => (
                  <button
                    key={d.id}
                    draggable
                    onDragStart={() => setDragId(d.id)}
                    onDragEnd={() => setDragId(null)}
                    onClick={() => setOpenId(d.id)}
                    className={cn(
                      'group rounded-xl border border-white/[0.06] bg-ink2/40 p-3 text-left transition-all hover:border-brand-lime/30 hover:bg-white/[0.03]',
                      dragId === d.id && 'opacity-40',
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="truncate font-medium text-light">{d.title}</span>
                      {d.amount > 0 && <span className="shrink-0 text-[11px] font-semibold text-brand-lime">{formatMoney(d.amount)}</span>}
                    </div>
                    <div className="mt-1 truncate text-[11px] text-muted">{d.contactName}{d.phone ? ` · ${d.phone}` : ''}</div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] text-muted">{d.source}</span>
                      {d.ownerName && <span className="text-[10px] text-light/50">{d.ownerName}</span>}
                    </div>
                  </button>
                ))}
                {!column.length && (
                  <div className="rounded-xl border border-dashed border-white/[0.06] py-6 text-center text-[11px] text-muted">
                    Перетащите сюда
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail drawer */}
      <AnimatePresence>
        {openId && (
          <DealDrawer
            dealId={openId}
            team={team}
            clients={clients}
            onClose={() => setOpenId(null)}
            onChanged={() => router.refresh()}
          />
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
              <h2 className="font-display text-xl font-bold">Новая сделка</h2>
              <div className="mt-6 space-y-4">
                <div>
                  <label className="label-soft">Название</label>
                  <input className="input-glass" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-soft">Контакт</label>
                    <input className="input-glass" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
                  </div>
                  <div>
                    <label className="label-soft">Телефон</label>
                    <input className="input-glass" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-soft">Email</label>
                    <input className="input-glass" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div>
                    <label className="label-soft">Сумма (сомони)</label>
                    <input type="number" min={0} className="input-glass" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-soft">Этап</label>
                    <select className="input-glass" value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })}>
                      {DEAL_STAGES.map((s) => (
                        <option key={s} value={s}>{dealStageLabel(s)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label-soft">Ответственный</label>
                    <select className="input-glass" value={form.ownerId} onChange={(e) => setForm({ ...form, ownerId: e.target.value })}>
                      <option value="">—</option>
                      {team.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setCreating(false)} className="btn-ghost">Отмена</button>
                <button onClick={createDeal} className="btn-gold">Создать</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
