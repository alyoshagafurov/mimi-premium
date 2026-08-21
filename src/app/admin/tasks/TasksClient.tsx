'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/admin/PageHeader';
import { CATEGORY_LABEL, type EventCategory } from '@/lib/roles';
import { cn, formatInt } from '@/lib/utils';

export type TaskRow = {
  id: string;
  source: 'task' | 'event';
  title: string;
  done: boolean;
  date: string;
  hasDueDate: boolean;
  category: string;
  priority: string | null;
  projectId: string | null;
  projectName: string | null;
  people: { id: string; name: string }[];
  href: string | null;
};

type Named = { id: string; name: string };

const PRIORITY_LABEL: Record<string, string> = { LOW: 'низкий', MEDIUM: 'средний', HIGH: 'высокий' };

/** Выпадающий фильтр — одна кнопка + список. */
function Select({
  label, value, options, onChange,
}: {
  label: string; value: string; options: { v: string; t: string }[]; onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.v === value);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        className={cn(
          'flex items-center gap-2 rounded-full border px-4 py-2 text-[12px] transition',
          value
            ? 'border-brand-lime/45 bg-brand-lime/[0.07] text-brand-lime'
            : 'border-white/10 text-light/60 hover:border-brand-lime/30 hover:text-light',
        )}
      >
        <span className="max-w-[160px] truncate">{current?.t ?? label}</span>
        <span className="text-[9px] opacity-60">▼</span>
      </button>
      {open && (
        <div className="absolute left-0 z-30 mt-2 max-h-72 w-60 overflow-y-auto rounded-2xl border border-white/10 bg-ink2/95 p-1.5 backdrop-blur-xl">
          {options.map((o) => (
            <button
              key={o.v}
              type="button"
              onMouseDown={() => { onChange(o.v); setOpen(false); }}
              className={cn(
                'block w-full truncate rounded-xl px-3 py-2 text-left text-[12px] transition',
                o.v === value ? 'bg-brand-lime/10 text-brand-lime' : 'text-light/70 hover:bg-white/[0.05] hover:text-light',
              )}
            >
              {o.t}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function TasksClient({
  rows, staff, projects, canToggle,
}: {
  rows: TaskRow[]; staff: Named[]; projects: Named[]; canToggle: boolean;
}) {
  const [state, setState] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [status, setStatus] = useState<'' | 'open' | 'done'>('');
  const [person, setPerson] = useState('');
  const [project, setProject] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [q, setQ] = useState('');

  const isDone = (r: TaskRow) => state[r.id] ?? r.done;

  const filtered = useMemo(() => rows.filter((r) => {
    if (status === 'open' && isDone(r)) return false;
    if (status === 'done' && !isDone(r)) return false;
    if (person && !r.people.some((p) => p.id === person)) return false;
    if (project && r.projectId !== project) return false;
    if (from && r.date.slice(0, 10) < from) return false;
    if (to && r.date.slice(0, 10) > to) return false;
    if (q && !r.title.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [rows, state, status, person, project, from, to, q]);

  const openCount = filtered.filter((r) => !isDone(r)).length;
  const doneCount = filtered.length - openCount;
  const dirty = !!(status || person || project || from || to || q);

  async function toggle(r: TaskRow) {
    if (!canToggle || busy) return;
    const next = !isDone(r);
    setBusy(r.id);
    setState((s) => ({ ...s, [r.id]: next }));
    const url = r.source === 'event' ? `/api/calendar/${r.id}` : `/api/staff-tasks/${r.id}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done: next }),
    }).catch(() => null);
    if (!res?.ok) setState((s) => ({ ...s, [r.id]: !next })); // откат
    setBusy(null);
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow="Tasks"
        title={<>Все <span className="text-lime-grad">задачи</span></>}
        subtitle="Всё, что заведено в календаре и по проектам — в одном списке."
      />

      {/* ── Сводка ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { t: 'В процессе', v: openCount, accent: true },
          { t: 'Выполнено', v: doneCount, accent: false },
          { t: 'Всего', v: filtered.length, accent: false },
        ].map((c, i) => (
          <motion.div
            key={c.t}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: i * 0.05 }}
            className={cn(
              'rounded-2xl border p-4 sm:p-5',
              c.accent ? 'border-brand-lime/25 bg-brand-lime/[0.05]' : 'border-white/[0.06] bg-white/[0.02]',
            )}
          >
            <div className="text-[10px] uppercase tracking-[0.2em] text-light/45">{c.t}</div>
            <div className={cn('mt-2 font-display text-3xl font-extrabold', c.accent ? 'text-lime-grad' : 'text-light')}>
              {formatInt(c.v)}
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Фильтры ── */}
      <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Поиск по названию…"
            className="min-w-[180px] flex-1 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[13px] text-light outline-none placeholder:text-light/30 focus:border-brand-lime/40"
          />
          <Select
            label="Статус"
            value={status}
            onChange={(v) => setStatus(v as any)}
            options={[{ v: '', t: 'Все статусы' }, { v: 'open', t: 'В процессе' }, { v: 'done', t: 'Выполнено' }]}
          />
          <Select
            label="Ответственный"
            value={person}
            onChange={setPerson}
            options={[{ v: '', t: 'Все ответственные' }, ...staff.map((s) => ({ v: s.id, t: s.name }))]}
          />
          <Select
            label="Проект"
            value={project}
            onChange={setProject}
            options={[{ v: '', t: 'Все проекты' }, ...projects.map((p) => ({ v: p.id, t: p.name }))]}
          />
          <div className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5">
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="bg-transparent text-[12px] text-light/70 outline-none"
            />
            <span className="text-light/25">—</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="bg-transparent text-[12px] text-light/70 outline-none"
            />
          </div>
          {dirty && (
            <button
              type="button"
              onClick={() => { setStatus(''); setPerson(''); setProject(''); setFrom(''); setTo(''); setQ(''); }}
              className="rounded-full border border-white/10 px-4 py-2 text-[12px] text-light/50 transition hover:border-brand-orange/40 hover:text-brand-orange"
            >
              Сбросить
            </button>
          )}
        </div>
      </div>

      {/* ── Список ── */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] py-16 text-center text-sm text-light/40">
          Задач по этим фильтрам нет.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r, i) => {
            const done = isDone(r);
            const overdue = !done && r.hasDueDate && r.date.slice(0, 10) < new Date().toISOString().slice(0, 10);
            return (
              <motion.div
                key={`${r.source}-${r.id}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: Math.min(i * 0.02, 0.4) }}
                className={cn(
                  'group flex items-center gap-3 rounded-2xl border p-3.5 transition-colors sm:gap-4 sm:p-4',
                  done
                    ? 'border-white/[0.04] bg-white/[0.012]'
                    : 'border-white/[0.06] bg-white/[0.02] hover:border-brand-lime/25',
                )}
              >
                <button
                  type="button"
                  onClick={() => toggle(r)}
                  disabled={!canToggle || busy === r.id}
                  aria-label={done ? 'Вернуть в работу' : 'Отметить выполненной'}
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-[11px] transition',
                    done
                      ? 'border-brand-lime/50 bg-brand-lime/15 text-brand-lime'
                      : 'border-white/15 text-transparent hover:border-brand-lime/50 hover:text-brand-lime/40',
                  )}
                >
                  ✓
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    {r.href ? (
                      <Link href={r.href} className={cn('truncate text-[13.5px] hover:text-brand-lime', done ? 'text-light/40 line-through' : 'text-light')}>
                        {r.title}
                      </Link>
                    ) : (
                      <span className={cn('truncate text-[13.5px]', done ? 'text-light/40 line-through' : 'text-light')}>
                        {r.title}
                      </span>
                    )}
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] text-light/40">
                      {r.source === 'event' ? 'календарь' : 'задача'}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.14em] text-brand-orange/70">
                      {CATEGORY_LABEL[r.category as EventCategory] ?? r.category}
                    </span>
                    {r.priority === 'HIGH' && !done && (
                      <span className="text-[10px] text-rose-300">{PRIORITY_LABEL.HIGH}</span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-light/40">
                    <span className={cn(overdue && 'text-rose-300')}>
                      {new Date(r.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                      {overdue && ' · просрочено'}
                    </span>
                    {r.projectName && (
                      <Link href={`/admin/clients/${r.projectId}`} className="hover:text-brand-lime">
                        {r.projectName}
                      </Link>
                    )}
                    {r.people.length > 0 && <span>{r.people.map((p) => p.name).join(', ')}</span>}
                  </div>
                </div>

                <span
                  className={cn(
                    'hidden shrink-0 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.14em] sm:inline',
                    done ? 'bg-white/[0.04] text-light/40' : 'bg-brand-lime/10 text-brand-lime',
                  )}
                >
                  {done ? 'выполнено' : 'в процессе'}
                </span>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
