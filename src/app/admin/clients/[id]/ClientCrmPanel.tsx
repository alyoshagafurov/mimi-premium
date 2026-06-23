'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  MONTHS_RU,
  monthLabel,
  formatMoney,
  formatDate,
  paymentStatusLabel,
  paymentStatusAccent,
  taskPriorityLabel,
  taskPriorityAccent,
  activityKindLabel,
  activityKindIcon,
  isOverdue,
  cn,
} from '@/lib/utils';

type Team = { id: string; name: string }[];
type Payment = { id: string; amount: number; status: string; month: number; year: number; dueDate: string | null; paidAt: string | null; method: string; note: string };
type Task = { id: string; title: string; done: boolean; dueDate: string | null; priority: string };
type Activity = { id: string; kind: string; body: string; createdAt: string; authorName: string | null };

const now = new Date();
const PAYMENT_STATUSES = ['PENDING', 'PAID', 'OVERDUE'] as const;
const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;
const ACTIVITY_KINDS = ['NOTE', 'CALL', 'MEETING', 'EMAIL'] as const;

export function ClientCrmPanel({
  clientId,
  team,
  payments,
  tasks,
  activities,
}: {
  clientId: string;
  team: Team;
  payments: Payment[];
  tasks: Task[];
  activities: Activity[];
}) {
  const router = useRouter();

  const [pay, setPay] = useState({ month: now.getMonth() + 1, year: now.getFullYear(), amount: '', status: 'PENDING' });
  const [task, setTask] = useState({ title: '', dueDate: '', priority: 'MEDIUM', ownerId: '' });
  const [note, setNote] = useState({ kind: 'NOTE', body: '' });

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  const paid = payments.filter((p) => p.status === 'PAID').reduce((s, p) => s + p.amount, 0);
  const pending = payments.filter((p) => p.status === 'PENDING').reduce((s, p) => s + p.amount, 0);
  const overdue = payments.filter((p) => p.status === 'OVERDUE').reduce((s, p) => s + p.amount, 0);

  const post = async (url: string, body: unknown, ok: string) => {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) {
      toast.success(ok);
      router.refresh();
      return true;
    }
    toast.error('Не удалось сохранить');
    return false;
  };
  const patch = async (url: string, body: unknown) => {
    const res = await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) router.refresh();
    else toast.error('Не удалось обновить');
  };
  const del = async (url: string) => {
    const res = await fetch(url, { method: 'DELETE' });
    if (res.ok) router.refresh();
    else toast.error('Не удалось удалить');
  };

  const addPayment = async () => {
    if (!pay.amount) return toast.error('Введите сумму');
    if (await post('/api/payments', { clientId, month: pay.month, year: pay.year, amount: Number(pay.amount), status: pay.status }, 'Оплата добавлена')) {
      setPay({ ...pay, amount: '' });
    }
  };
  const addTask = async () => {
    if (!task.title.trim()) return toast.error('Введите задачу');
    if (await post('/api/tasks', { clientId, title: task.title, dueDate: task.dueDate || null, priority: task.priority, ownerId: task.ownerId || null }, 'Задача добавлена')) {
      setTask({ title: '', dueDate: '', priority: 'MEDIUM', ownerId: '' });
    }
  };
  const addNote = async () => {
    if (!note.body.trim()) return toast.error('Введите текст');
    if (await post('/api/activities', { clientId, kind: note.kind, body: note.body }, 'Запись добавлена')) {
      setNote({ kind: 'NOTE', body: '' });
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Payments */}
      <div className="glass rounded-2xl p-6 lg:col-span-2">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold">Оплаты</h2>
          <div className="flex flex-wrap gap-2 text-[11px]">
            <span className="chip-lime">Оплачено: {formatMoney(paid)}</span>
            <span className="chip text-brand-orange">Ожидается: {formatMoney(pending)}</span>
            {overdue > 0 && <span className="chip text-rose-400">Долг: {formatMoney(overdue)}</span>}
          </div>
        </div>

        <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_1fr_1fr_1fr_auto]">
          <select className="input-glass" value={pay.month} onChange={(e) => setPay({ ...pay, month: Number(e.target.value) })}>
            {MONTHS_RU.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select className="input-glass" value={pay.year} onChange={(e) => setPay({ ...pay, year: Number(e.target.value) })}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <input type="number" min={0} className="input-glass" placeholder="Сумма" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} />
          <select className="input-glass" value={pay.status} onChange={(e) => setPay({ ...pay, status: e.target.value })}>
            {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{paymentStatusLabel(s)}</option>)}
          </select>
          <button onClick={addPayment} className="btn-gold !px-5 !py-3 !text-[11px]">Добавить</button>
        </div>

        <div className="space-y-2">
          {payments.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="font-medium text-light">{monthLabel(p.month, p.year)}</span>
                <span className="text-sm text-muted">{formatMoney(p.amount)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn('rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.14em]', paymentStatusAccent(p.status))}>
                  {paymentStatusLabel(p.status)}
                </span>
                {p.status !== 'PAID' && (
                  <button onClick={() => patch(`/api/payments/${p.id}`, { status: 'PAID' })} className="rounded-lg border border-brand-lime/30 px-3 py-1.5 text-[11px] text-brand-lime hover:bg-brand-lime/[0.08]">
                    Оплачено
                  </button>
                )}
                <button onClick={() => del(`/api/payments/${p.id}`)} className="rounded-lg border border-white/10 px-3 py-1.5 text-[11px] text-muted hover:border-rose-400/40 hover:text-rose-400">
                  ✕
                </button>
              </div>
            </div>
          ))}
          {!payments.length && <p className="text-sm text-muted">Оплат пока нет.</p>}
        </div>
      </div>

      {/* Tasks */}
      <div className="glass rounded-2xl p-6">
        <h2 className="mb-4 font-display text-lg font-bold">Задачи</h2>
        <div className="mb-4 space-y-2">
          <input className="input-glass" placeholder="Что нужно сделать" value={task.title} onChange={(e) => setTask({ ...task, title: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <input type="date" className="input-glass" value={task.dueDate} onChange={(e) => setTask({ ...task, dueDate: e.target.value })} />
            <select className="input-glass" value={task.priority} onChange={(e) => setTask({ ...task, priority: e.target.value })}>
              {TASK_PRIORITIES.map((p) => <option key={p} value={p}>{taskPriorityLabel(p)}</option>)}
            </select>
          </div>
          <button onClick={addTask} className="btn-gold w-full !py-2.5 !text-[11px]">Добавить задачу</button>
        </div>
        <div className="space-y-2">
          {tasks.map((t) => (
            <div key={t.id} className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5">
              <input type="checkbox" checked={t.done} onChange={() => patch(`/api/tasks/${t.id}`, { done: !t.done })} className="accent-brand-lime" />
              <div className="min-w-0 flex-1">
                <div className={cn('truncate text-sm', t.done ? 'text-muted line-through' : 'text-light')}>{t.title}</div>
                {t.dueDate && (
                  <div className={cn('text-[11px]', !t.done && isOverdue(t.dueDate) ? 'text-rose-400' : 'text-muted')}>
                    до {formatDate(t.dueDate)}
                  </div>
                )}
              </div>
              <span className={cn('rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.12em]', taskPriorityAccent(t.priority))}>
                {taskPriorityLabel(t.priority)}
              </span>
              <button onClick={() => del(`/api/tasks/${t.id}`)} className="text-muted hover:text-rose-400">✕</button>
            </div>
          ))}
          {!tasks.length && <p className="text-sm text-muted">Задач нет.</p>}
        </div>
      </div>

      {/* Activity timeline */}
      <div className="glass rounded-2xl p-6">
        <h2 className="mb-4 font-display text-lg font-bold">История</h2>
        <div className="mb-4 space-y-2">
          <div className="flex gap-2">
            <select className="input-glass !w-auto" value={note.kind} onChange={(e) => setNote({ ...note, kind: e.target.value })}>
              {ACTIVITY_KINDS.map((k) => <option key={k} value={k}>{activityKindLabel(k)}</option>)}
            </select>
            <button onClick={addNote} className="btn-gold !px-4 !py-2 !text-[11px]">Добавить</button>
          </div>
          <textarea className="input-glass min-h-[60px] resize-none" placeholder="Звонок, встреча, договорённость…" value={note.body} onChange={(e) => setNote({ ...note, body: e.target.value })} />
        </div>
        <div className="space-y-2.5">
          {activities.map((a) => (
            <div key={a.id} className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5">
              <div className="flex items-center justify-between text-[11px] text-muted">
                <span>{activityKindIcon(a.kind)} {activityKindLabel(a.kind)}{a.authorName ? ` · ${a.authorName}` : ''}</span>
                <div className="flex items-center gap-2">
                  <span>{formatDate(a.createdAt)}</span>
                  <button onClick={() => del(`/api/activities/${a.id}`)} className="text-muted hover:text-rose-400">✕</button>
                </div>
              </div>
              <p className="mt-1 text-sm text-light/85">{a.body}</p>
            </div>
          ))}
          {!activities.length && <p className="text-sm text-muted">Записей пока нет.</p>}
        </div>
      </div>
    </div>
  );
}
