'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  DEAL_STAGES,
  dealStageLabel,
  activityKindLabel,
  activityKindIcon,
  formatMoney,
  formatDate,
  cn,
} from '@/lib/utils';

type Team = { id: string; name: string }[];
type Clients = { id: string; businessName: string }[];

type Activity = { id: string; kind: string; body: string; createdAt: string; author?: { name: string } | null };
type Task = { id: string; title: string; done: boolean; dueDate: string | null };
type DealFull = {
  id: string;
  title: string;
  contactName: string;
  phone: string | null;
  email: string | null;
  message: string | null;
  source: string;
  stage: string;
  amount: number;
  ownerId: string | null;
  clientId: string | null;
  createdAt: string;
  activities: Activity[];
  tasks: Task[];
};

const ACTIVITY_KINDS = ['NOTE', 'CALL', 'MEETING', 'EMAIL'] as const;

export function DealDrawer({
  dealId,
  team,
  clients,
  onClose,
  onChanged,
}: {
  dealId: string;
  team: Team;
  clients: Clients;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [deal, setDeal] = useState<DealFull | null>(null);
  const [saving, setSaving] = useState(false);
  const [noteKind, setNoteKind] = useState<string>('NOTE');
  const [noteBody, setNoteBody] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDue, setTaskDue] = useState('');

  const load = useCallback(async () => {
    const res = await fetch(`/api/deals/${dealId}`);
    if (res.ok) setDeal(await res.json());
  }, [dealId]);

  useEffect(() => {
    load();
  }, [load]);

  const patch = async (data: Record<string, unknown>) => {
    setSaving(true);
    const res = await fetch(`/api/deals/${dealId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    setSaving(false);
    if (res.ok) {
      await load();
      onChanged();
    } else toast.error('Не удалось сохранить');
  };

  const saveFields = async () => {
    if (!deal) return;
    await patch({
      title: deal.title,
      contactName: deal.contactName,
      phone: deal.phone,
      email: deal.email,
      message: deal.message,
      amount: deal.amount,
      stage: deal.stage,
      ownerId: deal.ownerId,
      clientId: deal.clientId,
    });
    toast.success('Сделка сохранена');
  };

  const removeDeal = async () => {
    if (!confirm('Удалить сделку?')) return;
    const res = await fetch(`/api/deals/${dealId}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Сделка удалена');
      onChanged();
      onClose();
    } else toast.error('Не удалось удалить');
  };

  const addNote = async () => {
    if (!noteBody.trim()) return;
    const res = await fetch('/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: noteKind, body: noteBody, dealId }),
    });
    if (res.ok) {
      setNoteBody('');
      await load();
      onChanged();
    } else toast.error('Не удалось добавить');
  };

  const addTask = async () => {
    if (!taskTitle.trim()) return;
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: taskTitle, dueDate: taskDue || null, dealId }),
    });
    if (res.ok) {
      setTaskTitle('');
      setTaskDue('');
      await load();
      onChanged();
    } else toast.error('Не удалось добавить');
  };

  const toggleTask = async (t: Task) => {
    await fetch(`/api/tasks/${t.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done: !t.done }),
    });
    await load();
    onChanged();
  };

  const set = (patchObj: Partial<DealFull>) => setDeal((d) => (d ? { ...d, ...patchObj } : d));

  return (
    <>
      <motion.button
        type="button"
        aria-label="Закрыть"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[55] bg-ink/70 backdrop-blur-md"
      />
      <motion.aside
        role="dialog"
        aria-modal
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-y-0 right-0 z-[60] flex w-full max-w-md flex-col overflow-y-auto border-l border-white/[0.06] bg-gradient-to-br from-ink2/95 to-ink/95 p-6 backdrop-blur-2xl"
      >
        {!deal ? (
          <p className="text-sm text-muted">Загрузка…</p>
        ) : (
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-brand-orange">{deal.source}</p>
                <h2 className="mt-1 font-display text-xl font-extrabold text-light">{deal.title}</h2>
              </div>
              <button onClick={onClose} className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted hover:text-light">
                ✕
              </button>
            </div>

            {/* Editable fields */}
            <div className="space-y-3">
              <div>
                <label className="label-soft">Название</label>
                <input className="input-glass" value={deal.title} onChange={(e) => set({ title: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-soft">Этап</label>
                  <select className="input-glass" value={deal.stage} onChange={(e) => set({ stage: e.target.value })}>
                    {DEAL_STAGES.map((s) => (
                      <option key={s} value={s}>{dealStageLabel(s)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-soft">Сумма (сомони)</label>
                  <input type="number" min={0} className="input-glass" value={deal.amount} onChange={(e) => set({ amount: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-soft">Ответственный</label>
                  <select className="input-glass" value={deal.ownerId ?? ''} onChange={(e) => set({ ownerId: e.target.value || null })}>
                    <option value="">—</option>
                    {team.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-soft">Клиент</label>
                  <select className="input-glass" value={deal.clientId ?? ''} onChange={(e) => set({ clientId: e.target.value || null })}>
                    <option value="">—</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.businessName}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-soft">Контакт</label>
                  <input className="input-glass" value={deal.contactName} onChange={(e) => set({ contactName: e.target.value })} />
                </div>
                <div>
                  <label className="label-soft">Телефон</label>
                  <input className="input-glass" value={deal.phone ?? ''} onChange={(e) => set({ phone: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label-soft">Email</label>
                <input className="input-glass" value={deal.email ?? ''} onChange={(e) => set({ email: e.target.value })} />
              </div>
              <div>
                <label className="label-soft">Комментарий</label>
                <textarea className="input-glass min-h-[70px] resize-none" value={deal.message ?? ''} onChange={(e) => set({ message: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <button onClick={saveFields} disabled={saving} className="btn-gold flex-1 !py-2.5 !text-[11px] disabled:opacity-60">
                  {saving ? 'Сохраняем…' : 'Сохранить'}
                </button>
                <button onClick={removeDeal} className="rounded-full border border-rose-500/30 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-rose-400 hover:bg-rose-500/10">
                  Удалить
                </button>
              </div>
            </div>

            {/* Tasks */}
            <div className="border-t border-white/[0.06] pt-5">
              <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-[0.16em] text-light/70">Задачи</h3>
              <div className="mb-3 flex gap-2">
                <input className="input-glass" placeholder="Новая задача" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
                <input type="date" className="input-glass !w-auto" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} />
                <button onClick={addTask} className="btn-gold !px-4 !py-2 !text-[11px]">+</button>
              </div>
              <div className="space-y-1.5">
                {deal.tasks.map((t) => (
                  <label key={t.id} className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-sm">
                    <input type="checkbox" checked={t.done} onChange={() => toggleTask(t)} className="accent-brand-lime" />
                    <span className={cn('flex-1', t.done && 'text-muted line-through')}>{t.title}</span>
                    {t.dueDate && <span className="text-[11px] text-muted">{formatDate(t.dueDate)}</span>}
                  </label>
                ))}
                {!deal.tasks.length && <p className="text-xs text-muted">Задач нет.</p>}
              </div>
            </div>

            {/* Timeline */}
            <div className="border-t border-white/[0.06] pt-5">
              <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-[0.16em] text-light/70">История</h3>
              <div className="mb-3 space-y-2">
                <div className="flex gap-2">
                  <select className="input-glass !w-auto" value={noteKind} onChange={(e) => setNoteKind(e.target.value)}>
                    {ACTIVITY_KINDS.map((k) => (
                      <option key={k} value={k}>{activityKindLabel(k)}</option>
                    ))}
                  </select>
                  <button onClick={addNote} className="btn-gold !px-4 !py-2 !text-[11px]">Добавить</button>
                </div>
                <textarea
                  className="input-glass min-h-[60px] resize-none"
                  placeholder="Что произошло…"
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                />
              </div>
              <div className="space-y-2.5">
                {deal.activities.map((a) => (
                  <div key={a.id} className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
                    <div className="flex items-center justify-between text-[11px] text-muted">
                      <span>{activityKindIcon(a.kind)} {activityKindLabel(a.kind)}{a.author?.name ? ` · ${a.author.name}` : ''}</span>
                      <span>{formatDate(a.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-sm text-light/85">{a.body}</p>
                  </div>
                ))}
                {!deal.activities.length && <p className="text-xs text-muted">Записей нет.</p>}
              </div>
            </div>

            <div className="text-[11px] text-muted">Создана {formatDate(deal.createdAt)} · {formatMoney(deal.amount)}</div>
          </div>
        )}
      </motion.aside>
    </>
  );
}
