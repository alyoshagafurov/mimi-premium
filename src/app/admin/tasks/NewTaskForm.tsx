'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { CATEGORY_LABEL, EVENT_CATEGORIES, type EventCategory } from '@/lib/roles';
import { cn } from '@/lib/utils';

type Named = { id: string; name: string };

/** Date → значение для datetime-local. */
function toLocal(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function at(daysAhead: number, hour: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setHours(hour, 0, 0, 0);
  return toLocal(d);
}

/** «сегодня 18:00», «завтра 12:00», «26 авг 18:00» — короче любой даты. */
function whenLabel(v: string): string {
  if (!v) return 'Срок';
  const d = new Date(v);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(d, now)) return `сегодня ${time}`;
  if (same(d, tomorrow)) return `завтра ${time}`;
  return `${d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })} ${time}`;
}

/** Пилюля с выпадашкой: сама кнопка показывает выбранное, а не название поля. */
function Pill({
  id, open, setOpen, active, label, children, width = 'w-[260px]',
}: {
  id: string;
  open: string | null;
  setOpen: (v: string | null) => void;
  active: boolean;
  label: React.ReactNode;
  children: React.ReactNode;
  width?: string;
}) {
  const isOpen = open === id;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(isOpen ? null : id)}
        className={cn(
          'flex items-center gap-2 rounded-full border px-3.5 py-2 text-[12.5px] transition',
          active
            ? 'border-brand-lime/45 bg-brand-lime/[0.08] text-brand-lime'
            : 'border-white/10 bg-white/[0.02] text-light/55 hover:border-brand-lime/35 hover:text-light',
        )}
      >
        {label}
        <span className={cn('text-[8px] transition-transform', isOpen && 'rotate-180')}>▼</span>
      </button>
      {isOpen && (
        <>
          <span className="fixed inset-0 z-30" onClick={() => setOpen(null)} />
          <div className={cn(
            'absolute left-0 top-11 z-40 max-h-[320px] overflow-y-auto rounded-2xl border border-white/10 bg-ink2 p-2 shadow-[0_24px_50px_-18px_rgba(0,0,0,0.9)]',
            width,
          )}>
            {children}
          </div>
        </>
      )}
    </div>
  );
}

/** Кружок с первой буквой — дешевле аватарки и не тянет base64 в страницу. */
function Initial({ name, dim }: { name: string; dim?: boolean }) {
  return (
    <span
      className={cn(
        'flex h-5 w-5 items-center justify-center rounded-full border text-[9px] font-bold uppercase',
        dim ? 'border-white/15 bg-white/[0.06] text-light/60' : 'border-brand-lime/50 bg-brand-lime/20 text-brand-lime',
      )}
    >
      {name.trim().charAt(0)}
    </span>
  );
}

/**
 * Задача = событие календаря с kind = TASK: дедлайн становится датой в
 * календаре, ответственные и клиент проекта получают уведомление.
 *
 * Форма собрана как одна строка-предложение: текст задачи сверху, под ним
 * четыре пилюли — кому, куда, к какому сроку и по какому проекту.
 */
export function NewTaskForm({ staff, projects }: { staff: Named[]; projects: Named[] }) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [who, setWho] = useState<Set<string>>(new Set());
  const [cat, setCat] = useState<EventCategory>('GENERAL');
  const [projectId, setProjectId] = useState('');
  const [deadline, setDeadline] = useState(() => at(0, 18));
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  const allWho = staff.length > 0 && who.size === staff.length;
  const chosen = staff.filter((s) => who.has(s.id));
  const project = projects.find((p) => p.id === projectId);

  const toggleWho = (id: string) =>
    setWho((cur) => {
      const next = new Set(cur);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  async function createTask() {
    if (saving) return;
    if (!title.trim()) return toast.error('Напишите задачу');
    if (!who.size) return toast.error('Выберите, кому ставим задачу');

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

    toast.success('Задача ушла ответственным');
    setTitle('');
    setWho(new Set());
    setProjectId('');
    setOpen(null);
    router.refresh();
  }

  const ready = !!title.trim() && who.size > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative rounded-3xl border border-brand-lime/20 bg-gradient-to-br from-brand-lime/[0.05] to-transparent p-4 sm:p-5"
    >
      {/* Свечение живёт в своём клипе — сама карточка не обрезает выпадашки. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
        <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-brand-lime/[0.08] blur-3xl" />
      </div>

      <div className="relative">
        {/* Строка задачи + отправка */}
        <div className="flex items-center gap-3">
          <span className="hidden shrink-0 rounded-full border border-brand-orange/30 px-2.5 py-1 text-[9px] uppercase tracking-[0.18em] text-brand-orange sm:inline">
            новая
          </span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') createTask(); }}
            placeholder="Что нужно сделать?"
            className="min-w-0 flex-1 bg-transparent font-display text-xl font-extrabold text-light outline-none placeholder:text-light/25 sm:text-2xl"
          />
          <button
            type="button"
            onClick={createTask}
            disabled={saving || !ready}
            title="Добавить задачу"
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-bold transition',
              ready && !saving
                ? 'bg-brand-lime text-[#0A0712] shadow-[0_0_28px_-6px_rgba(212,236,76,0.8)] hover:scale-105'
                : 'cursor-not-allowed border border-white/10 text-light/20',
            )}
          >
            {saving ? '·' : '→'}
          </button>
        </div>

        <div className="my-3 h-px bg-gradient-to-r from-brand-lime/30 via-white/[0.06] to-transparent" />

        {/* Пилюли: кому · куда · к какому сроку · по какому проекту */}
        <div className="flex flex-wrap items-center gap-2">
          <Pill
            id="who" open={open} setOpen={setOpen} active={who.size > 0}
            label={
              chosen.length === 0 ? 'Кому?' : (
                <span className="flex items-center gap-1.5">
                  <span className="flex -space-x-1.5">
                    {chosen.slice(0, 3).map((s) => <Initial key={s.id} name={s.name} />)}
                  </span>
                  {allWho ? 'вся команда' : chosen.length === 1 ? chosen[0].name : `${chosen.length} чел.`}
                </span>
              )
            }
          >
            <button
              type="button"
              onClick={() => setWho(allWho ? new Set() : new Set(staff.map((s) => s.id)))}
              className={cn(
                'mb-1 block w-full rounded-xl px-3 py-2 text-left text-[12px] transition hover:bg-white/[0.05]',
                allWho ? 'text-brand-lime' : 'text-light/60',
              )}
            >
              {allWho ? '✓ Вся команда' : 'Вся команда'}
            </button>
            {staff.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleWho(s.id)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[12.5px] transition hover:bg-white/[0.05]',
                  who.has(s.id) ? 'text-brand-lime' : 'text-light/70',
                )}
              >
                <Initial name={s.name} dim={!who.has(s.id)} />
                <span className="truncate">{s.name}</span>
              </button>
            ))}
          </Pill>

          <Pill
            id="cat" open={open} setOpen={setOpen} active={cat !== 'GENERAL'}
            label={CATEGORY_LABEL[cat]} width="w-[200px]"
          >
            {EVENT_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => { setCat(c); setOpen(null); }}
                className={cn(
                  'block w-full rounded-xl px-3 py-2 text-left text-[12.5px] transition hover:bg-white/[0.05]',
                  cat === c ? 'text-brand-lime' : 'text-light/70',
                )}
              >
                {CATEGORY_LABEL[c]}
              </button>
            ))}
          </Pill>

          <Pill
            id="when" open={open} setOpen={setOpen} active
            label={<span className="flex items-center gap-1.5"><span className="text-[11px]">⏱</span>{whenLabel(deadline)}</span>}
            width="w-[248px]"
          >
            <div className="mb-2 grid grid-cols-2 gap-1.5">
              {[
                { t: 'Сегодня 18:00', v: at(0, 18) },
                { t: 'Завтра 12:00', v: at(1, 12) },
                { t: 'Через 3 дня', v: at(3, 18) },
                { t: 'Через неделю', v: at(7, 18) },
              ].map((q) => (
                <button
                  key={q.t}
                  type="button"
                  onClick={() => { setDeadline(q.v); setOpen(null); }}
                  className="rounded-xl border border-white/10 px-2.5 py-2 text-[11px] text-light/65 transition hover:border-brand-lime/40 hover:text-brand-lime"
                >
                  {q.t}
                </button>
              ))}
            </div>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[12.5px] text-light outline-none focus:border-brand-lime/40"
            />
          </Pill>

          <Pill
            id="project" open={open} setOpen={setOpen} active={!!projectId}
            label={project ? project.name : 'Без проекта'}
          >
            <button
              type="button"
              onClick={() => { setProjectId(''); setOpen(null); }}
              className={cn(
                'block w-full rounded-xl px-3 py-2 text-left text-[12.5px] transition hover:bg-white/[0.05]',
                !projectId ? 'text-brand-lime' : 'text-light/70',
              )}
            >
              Без проекта — внутренняя
            </button>
            {projects.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => { setProjectId(p.id); setOpen(null); }}
                className={cn(
                  'block w-full truncate rounded-xl px-3 py-2 text-left text-[12.5px] transition hover:bg-white/[0.05]',
                  projectId === p.id ? 'text-brand-lime' : 'text-light/70',
                )}
              >
                {p.name}
              </button>
            ))}
          </Pill>

          {projectId && (
            <span className="text-[11px] text-light/30">клиент тоже увидит задачу</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
