'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { CATEGORY_LABEL, EVENT_CATEGORIES, type EventCategory } from '@/lib/roles';
import { cn } from '@/lib/utils';

type Named = { id: string; name: string };

/** Дефолт дедлайна — сегодня 18:00, в формате datetime-local. */
function defaultDeadline(): string {
  const d = new Date();
  d.setHours(18, 0, 0, 0);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/**
 * Задача = событие календаря с kind = TASK: дедлайн становится датой в
 * календаре, ответственные и клиент проекта получают уведомление.
 */
export function NewTaskForm({ staff, projects }: { staff: Named[]; projects: Named[] }) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [who, setWho] = useState<Set<string>>(new Set());
  const [cat, setCat] = useState<EventCategory>('GENERAL');
  const [projectId, setProjectId] = useState('');
  const [deadline, setDeadline] = useState(defaultDeadline);
  const [saving, setSaving] = useState(false);

  const allWho = staff.length > 0 && who.size === staff.length;
  const toggleWho = (id: string) =>
    setWho((cur) => {
      const next = new Set(cur);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  async function createTask() {
    if (saving) return;
    if (!title.trim()) return toast.error('Напишите задачу');
    if (!who.size) return toast.error('Выберите хотя бы одного ответственного');
    if (!deadline) return toast.error('Поставьте дедлайн');

    setSaving(true);
    const res = await fetch('/api/calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        kind: 'TASK',
        category: cat,
        startAt: new Date(deadline).toISOString(),
        assigneeIds: [...who],
        clientId: projectId || null,
      }),
    }).catch(() => null);
    const d = await res?.json().catch(() => ({}));
    setSaving(false);
    if (!res?.ok) return toast.error(d?.error || 'Не удалось добавить задачу');

    toast.success('Задача добавлена — ответственные получили уведомление');
    setTitle('');
    setWho(new Set());
    setProjectId('');
    router.refresh();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55 }}
      className="relative overflow-hidden rounded-3xl border border-brand-lime/25 bg-brand-lime/[0.04] p-5 sm:p-7"
    >
      <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-brand-lime/[0.09] blur-3xl" />
      <div className="relative">
        <p className="text-[10px] uppercase tracking-[0.24em] text-brand-orange">Поставить задачу</p>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') createTask(); }}
          placeholder="Что нужно сделать?"
          className="mt-3 w-full border-b border-white/10 bg-transparent pb-3 font-display text-2xl font-extrabold text-light outline-none transition placeholder:text-light/25 focus:border-brand-lime/50 sm:text-3xl"
        />

        {/* Ответственные */}
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.2em] text-light/45">Ответственные</span>
            <button
              type="button"
              onClick={() => setWho(allWho ? new Set() : new Set(staff.map((s) => s.id)))}
              className="text-[11px] uppercase tracking-[0.14em] text-light/50 transition hover:text-brand-lime"
            >
              {allWho ? 'Снять всех' : 'Выбрать всех'}
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {staff.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleWho(s.id)}
                className={cn(
                  'rounded-full border px-3.5 py-1.5 text-[12px] transition',
                  who.has(s.id)
                    ? 'border-brand-lime bg-brand-lime text-[#0A0712]'
                    : 'border-white/10 text-light/60 hover:border-brand-lime/40 hover:text-light',
                )}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Категория — по ней задача встаёт в нужный календарь */}
        <div className="mt-5">
          <span className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-light/45">Категория</span>
          <div className="flex flex-wrap gap-1.5">
            {EVENT_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCat(c)}
                className={cn(
                  'rounded-full border px-3.5 py-1.5 text-[12px] transition',
                  cat === c
                    ? 'border-brand-orange/60 bg-brand-orange/10 text-brand-orange'
                    : 'border-white/10 text-light/60 hover:border-brand-orange/40 hover:text-light',
                )}
              >
                {CATEGORY_LABEL[c]}
              </button>
            ))}
          </div>
        </div>

        {/* Дедлайн, проект, кнопка */}
        <div className="mt-5 flex flex-wrap items-end gap-3">
          <div>
            <span className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-light/45">Дедлайн</span>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-[13px] text-light outline-none focus:border-brand-lime/40"
            />
          </div>
          <div>
            <span className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-light/45">
              Проект <span className="normal-case tracking-normal text-light/25">— клиент тоже увидит задачу</span>
            </span>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="max-w-[240px] rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-[13px] text-light outline-none focus:border-brand-lime/40"
            >
              <option value="">Без проекта — внутренняя</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={createTask}
            disabled={saving}
            className="btn-lime ml-auto !px-6 !py-3 !text-[11px] disabled:opacity-50"
          >
            {saving ? 'Добавляю…' : '+ Добавить задачу'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
