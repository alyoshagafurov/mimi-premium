'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/admin/PageHeader';
import { cn } from '@/lib/utils';
import { CATEGORY_LABEL, EVENT_CATEGORIES, type EventCategory } from '@/lib/roles';

type Task = {
  id: string;
  title: string;
  description: string;
  done: boolean;
  priority: string;
  category: EventCategory;
  dueDate: string | null;
  clientName: string | null;
  ownerName: string | null;
};

const fmt = (iso: string) => new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' });

export function TasksClient({
  canManage, categories, tasks, staff, clients,
}: {
  canManage: boolean;
  categories: EventCategory[];
  tasks: Task[];
  staff: { id: string; name: string }[];
  clients: { id: string; businessName: string }[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', category: (categories[0] ?? 'GENERAL') as EventCategory,
    dueDate: '', ownerId: '', clientId: '', priority: 'MEDIUM',
  });

  const toggle = async (t: Task) => {
    const r = await fetch(`/api/staff-tasks/${t.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done: !t.done }),
    });
    if (!r.ok) return toast.error('Не удалось обновить');
    router.refresh();
  };

  const remove = async (id: string) => {
    if (!confirm('Удалить задачу?')) return;
    const r = await fetch(`/api/staff-tasks/${id}`, { method: 'DELETE' });
    if (!r.ok) return toast.error('Не удалось удалить');
    toast.success('Удалено');
    router.refresh();
  };

  const create = async () => {
    if (!form.title.trim()) return toast.error('Введите название задачи');
    setSaving(true);
    try {
      const r = await fetch('/api/staff-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!r.ok) throw new Error();
      toast.success('Задача создана');
      setShowForm(false);
      setForm({ title: '', description: '', category: (categories[0] ?? 'GENERAL') as EventCategory, dueDate: '', ownerId: '', clientId: '', priority: 'MEDIUM' });
      router.refresh();
    } catch {
      toast.error('Не удалось создать');
    } finally {
      setSaving(false);
    }
  };

  const active = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);

  const Item = ({ t }: { t: Task }) => {
    const overdue = t.dueDate && !t.done && new Date(t.dueDate) < new Date();
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
        <button
          onClick={() => toggle(t)}
          aria-label={t.done ? 'Вернуть в работу' : 'Отметить выполненной'}
          className={cn(
            'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[11px] transition-colors',
            t.done ? 'border-brand-lime/50 bg-brand-lime/20 text-brand-lime' : 'border-white/20 text-transparent hover:border-brand-lime/50',
          )}
        >
          ✓
        </button>
        <div className="min-w-0 flex-1">
          <div className={cn('text-sm font-medium', t.done ? 'text-light/40 line-through' : 'text-light')}>{t.title}</div>
          {t.description && <p className="mt-1 text-[12px] leading-relaxed text-light/50">{t.description}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.12em]">
            <span className="rounded-full border border-brand-lime/25 bg-brand-lime/[0.06] px-2 py-0.5 text-brand-lime">
              {CATEGORY_LABEL[t.category]}
            </span>
            {t.clientName && <span className="text-light/40">{t.clientName}</span>}
            {t.ownerName && <span className="text-light/40">· {t.ownerName}</span>}
            {t.dueDate && (
              <span className={overdue ? 'text-rose-400' : 'text-brand-orange'}>
                до {fmt(t.dueDate)}
              </span>
            )}
          </div>
        </div>
        {canManage && (
          <button onClick={() => remove(t.id)} className="text-[11px] uppercase tracking-[0.12em] text-light/30 hover:text-rose-400">
            Удалить
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Tasks" title={<>Задачи</>} subtitle="Задачи команды с дедлайнами и статусом выполнения." />

      {canManage && (
        <div className="flex justify-end">
          <button onClick={() => setShowForm(true)} className="btn-lime">+ Задача</button>
        </div>
      )}

      <div className="space-y-3">
        <p className="text-[10px] uppercase tracking-[0.24em] text-brand-orange">В работе — {active.length}</p>
        {active.length === 0 ? (
          <p className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 text-center text-light/45">Нет активных задач.</p>
        ) : active.map((t) => <Item key={t.id} t={t} />)}
      </div>

      {done.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] uppercase tracking-[0.24em] text-light/35">Выполнено — {done.length}</p>
          {done.map((t) => <Item key={t.id} t={t} />)}
        </div>
      )}

      {showForm && canManage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4" onClick={() => setShowForm(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl border border-white/[0.08] bg-ink2 p-6">
            <h3 className="font-display text-xl font-bold text-light">Новая задача</h3>
            <div className="mt-5 space-y-3">
              <input className="input-glass" placeholder="Что нужно сделать" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <textarea className="input-glass min-h-[70px]" placeholder="Описание" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-soft">Команда</label>
                  <select className="input-glass" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as EventCategory })}>
                    {EVENT_CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-soft">Дедлайн</label>
                  <input type="date" className="input-glass" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-soft">Исполнитель</label>
                  <select className="input-glass" value={form.ownerId} onChange={(e) => setForm({ ...form, ownerId: e.target.value })}>
                    <option value="">Не назначен</option>
                    {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-soft">Проект</label>
                  <select className="input-glass" value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
                    <option value="">Без проекта</option>
                    {clients.map((c) => <option key={c.id} value={c.id}>{c.businessName}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="btn-ghost">Отмена</button>
              <button onClick={create} disabled={saving} className="btn-lime disabled:opacity-60">{saving ? 'Создаём…' : 'Создать'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
