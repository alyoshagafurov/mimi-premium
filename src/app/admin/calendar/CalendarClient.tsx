'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/admin/PageHeader';
import { cn } from '@/lib/utils';
import { CATEGORY_LABEL, type EventCategory } from '@/lib/roles';

type Kind =
  | 'MEETING' | 'CALL' | 'CONSULTATION' | 'PAYMENT' | 'COLLABORATION'
  | 'SHOOTING' | 'LAUNCH' | 'RETARGETING' | 'DEADLINE' | 'TASK' | 'OTHER';

type Event = {
  id: string;
  title: string;
  description: string;
  kind: Kind;
  category: EventCategory;
  startAt: string;
  endAt: string | null;
  clientId: string | null;
  clientName: string | null;
  ownerId: string | null;
  assigneeIds: string[];
  assigneeNames: string[];
  done: boolean;
  myNotes: { id: string; body: string; createdAt: string }[];
};

const KIND_LABEL: Record<Kind, string> = {
  MEETING: 'Встреча',
  CALL: 'Созвон',
  CONSULTATION: 'Консультация',
  PAYMENT: 'Дата оплаты',
  COLLABORATION: 'Дата сотрудничества',
  SHOOTING: 'Съёмки',
  LAUNCH: 'Запуск',
  RETARGETING: 'Ретаргет',
  DEADLINE: 'Дедлайн',
  TASK: 'Задача',
  OTHER: 'Другое',
};

// When a kind implies a team, preselect its calendar category.
const KIND_CATEGORY: Partial<Record<Kind, EventCategory>> = {
  SHOOTING: 'VIDEO',
  RETARGETING: 'TARGET',
};

function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
function isSameDay(a: Date, b: Date) { return a.toDateString() === b.toDateString(); }
function fmtTime(iso: string) { return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }); }
function fmtDate(iso: string) { return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' }); }
/** Date → value for <input type="datetime-local"> in local time (YYYY-MM-DDTHH:mm). */
function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const EMPTY = {
  title: '', description: '', kind: 'MEETING' as Kind, category: 'GENERAL' as EventCategory,
  assigneeIds: [] as string[],
  startAt: '', endAt: '', clientId: '',
};

export function CalendarClient({
  role,
  meId,
  canManage,
  categories,
  events,
  clients,
  staff,
}: {
  role: string;
  meId: string;
  canManage: boolean;
  categories: EventCategory[];
  events: Event[];
  clients: { id: string; businessName: string }[];
  staff: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [cursor, setCursor] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'ALL' | EventCategory>('ALL');
  /** Сотруднику доступны три календаря: всё агентство / его направление / личный. */
  const [scope, setScope] = useState<'ALL' | 'MINE_CATEGORY' | 'PERSONAL'>('ALL');
  const [hover, setHover] = useState<{ e: Event; x: number; y: number; flip: boolean } | null>(null);
  const [open, setOpen] = useState<Event | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [busy, setBusy] = useState(false);

  /** Выполнено / в процессе — доступно каждому сотруднику по своим событиям. */
  const toggleDone = async (e: Event) => {
    setBusy(true);
    const r = await fetch(`/api/calendar/${e.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done: !e.done }),
    });
    setBusy(false);
    if (!r.ok) { toast.error('Не удалось обновить'); return; }
    setOpen((cur) => (cur ? { ...cur, done: !e.done } : cur));
    toast.success(!e.done ? 'Отмечено выполненным' : 'Возвращено в работу');
    router.refresh();
  };

  /** Заметка на событии — попадает и сюда, и в раздел «Заметки». */
  const addNote = async (e: Event) => {
    const body = noteDraft.trim();
    if (!body) return;
    setBusy(true);
    const r = await fetch(`/api/calendar/${e.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    });
    setBusy(false);
    if (!r.ok) { toast.error('Не удалось сохранить заметку'); return; }
    const n = await r.json();
    setOpen((cur) => (cur ? { ...cur, myNotes: [n, ...cur.myNotes] } : cur));
    setNoteDraft('');
    toast.success('Заметка сохранена — она есть и в разделе «Заметки»');
    router.refresh();
  };
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((p) => ({ ...p, [k]: v }));

  // Open the form with sensible default date/time so the date is never empty
  // (Safari renders an empty datetime-local as a grey hint, which read as "missing").
  const openForm = () => {
    const start = new Date();
    start.setMinutes(0, 0, 0);
    start.setHours(start.getHours() + 1);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    setForm({ ...EMPTY, startAt: toLocalInput(start), endAt: toLocalInput(end) });
    setShowForm(true);
  };

  const showTabs = categories.length > 1;
  const shownEvents = useMemo(
    () => {
      if (canManage) return tab === 'ALL' ? events : events.filter((e) => e.category === tab);
      if (scope === 'MINE_CATEGORY') return events.filter((e) => (categories as string[]).includes(e.category));
      if (scope === 'PERSONAL') return events.filter((e) => e.ownerId === meId || e.assigneeIds.includes(meId));
      return events;
    },
    [events, tab, scope, canManage, categories, meId],
  );

  const days = useMemo(() => {
    const first = startOfMonth(cursor);
    const last = endOfMonth(cursor);
    const offset = (first.getDay() + 6) % 7;
    const total = offset + last.getDate();
    const rows = Math.ceil(total / 7);
    const cells: Date[] = [];
    for (let i = 0; i < rows * 7; i++) {
      const d = new Date(first);
      d.setDate(1 - offset + i);
      cells.push(d);
    }
    return cells;
  }, [cursor]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, Event[]>();
    for (const e of shownEvents) {
      const key = new Date(e.startAt).toDateString();
      const arr = map.get(key) ?? [];
      arr.push(e);
      map.set(key, arr);
    }
    return map;
  }, [shownEvents]);

  const save = async () => {
    if (!form.title.trim()) return toast.error('Введите название события');
    if (!form.startAt) return toast.error('Укажите дату и время начала');
    setSaving(true);
    try {
      const r = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, title: form.title.trim(), clientId: form.clientId || null, endAt: form.endAt || null }),
      });
      if (!r.ok) throw new Error();
      toast.success('Событие добавлено');
      setShowForm(false);
      setForm(EMPTY);
      router.refresh();
    } catch {
      toast.error('Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Удалить событие?')) return;
    await fetch(`/api/calendar/${id}`, { method: 'DELETE' });
    setHover(null);
    router.refresh();
  };

  const chipLabel = (e: Event) => {
    const main = e.clientName || e.title;
    // В плашке дня места мало: показываем первого ответственного и «+N».
    const who = e.assigneeNames.length
      ? e.assigneeNames[0] + (e.assigneeNames.length > 1 ? ` +${e.assigneeNames.length - 1}` : '')
      : '';
    return who ? `${main} · ${who}` : main;
  };

  return (
    <div className="space-y-5" onScroll={() => setHover(null)}>
      <PageHeader
        eyebrow="Calendar"
        title={<>Календарь</>}
        subtitle="Встречи, съёмки, запуски, дедлайны и оплаты команды."
      />

      {/* Сотрудник: три календаря */}
      {!canManage && (
        <div className="flex flex-wrap gap-2">
          {([
            { v: 'ALL', label: 'Все события' },
            { v: 'MINE_CATEGORY', label: 'Моё направление' },
            { v: 'PERSONAL', label: 'Мой календарь' },
          ] as const).map((o) => (
            <button
              key={o.v}
              onClick={() => setScope(o.v)}
              className={cn(
                'rounded-full border px-4 py-1.5 text-[11px] uppercase tracking-[0.14em] transition-colors',
                scope === o.v ? 'border-brand-lime/50 bg-brand-lime/[0.08] text-brand-lime' : 'border-white/10 text-light/55 hover:text-light',
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}

      {/* Category tabs (admin / ops see all teams) */}
      {showTabs && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setTab('ALL')}
            className={cn(
              'rounded-full border px-4 py-1.5 text-[11px] uppercase tracking-[0.14em] transition-colors',
              tab === 'ALL' ? 'border-brand-lime/50 bg-brand-lime/[0.08] text-brand-lime' : 'border-white/10 text-light/55 hover:text-light',
            )}
          >
            Все
          </button>
          {categories.filter((c) => c !== 'GENERAL').map((c) => (
            <button
              key={c}
              onClick={() => setTab(c)}
              className={cn(
                'rounded-full border px-4 py-1.5 text-[11px] uppercase tracking-[0.14em] transition-colors',
                tab === c ? 'border-brand-lime/50 bg-brand-lime/[0.08] text-brand-lime' : 'border-white/10 text-light/55 hover:text-light',
              )}
            >
              {CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="rounded-lg border border-white/10 px-3 py-1 text-sm text-light/70 hover:text-brand-lime">←</button>
          <div className="min-w-[180px] text-center font-display text-lg font-bold text-light">{MONTHS[cursor.getMonth()]} {cursor.getFullYear()}</div>
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="rounded-lg border border-white/10 px-3 py-1 text-sm text-light/70 hover:text-brand-lime">→</button>
          <button onClick={() => setCursor(new Date())} className="ml-2 rounded-lg border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.15em] text-light/55 hover:text-brand-lime">Сегодня</button>
        </div>
        {(canManage || scope === 'PERSONAL') && (
          <button onClick={openForm} className="btn-lime">+ Событие</button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/[0.06]">
        <div className="grid grid-cols-7 border-b border-white/[0.06] bg-white/[0.02]">
          {WEEKDAYS.map((w) => (
            <div key={w} className="px-2 py-2 text-center text-[10px] uppercase tracking-[0.16em] text-light/45">{w}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((d, i) => {
            const inMonth = d.getMonth() === cursor.getMonth();
            const today = isSameDay(d, new Date());
            const list = eventsByDay.get(d.toDateString()) ?? [];
            return (
              <div key={i} className={cn('min-h-[104px] border-b border-r border-white/[0.04] p-1.5', !inMonth && 'opacity-40', today && 'bg-brand-lime/[0.04]')}>
                <div className={cn('mb-1 text-[11px] font-bold', today ? 'text-brand-lime' : 'text-light/50')}>{d.getDate()}</div>
                <div className="space-y-1">
                  {list.slice(0, 4).map((e) => (
                    <div
                      key={e.id}
                      onMouseEnter={(ev) => {
                        const r = ev.currentTarget.getBoundingClientRect();
                        const flip = window.innerHeight - r.bottom < 250;
                        setHover({
                          e,
                          x: Math.min(r.left, window.innerWidth - 300),
                          y: flip ? r.top - 6 : r.bottom + 6,
                          flip,
                        });
                      }}
                      onMouseLeave={() => setHover(null)}
                      onClick={() => { setHover(null); router.push(`/admin/calendar/${e.id}`); }}
                      className={cn(
                        'block w-full cursor-pointer truncate rounded-md border px-1.5 py-0.5 text-left text-[10px] font-medium transition-colors',
                        e.done
                          // выполнено — приглушённое и зачёркнутое, видно с первого взгляда
                          ? 'border-white/10 bg-white/[0.04] text-light/35 line-through'
                          : 'border-brand-lime/40 bg-brand-lime/[0.12] text-brand-lime hover:bg-brand-lime/20',
                      )}
                    >
                      {e.done ? '✓ ' : ''}{fmtTime(e.startAt)} {chipLabel(e)}
                    </div>
                  ))}
                  {list.length > 4 && <div className="text-[10px] text-light/40">+ ещё {list.length - 4}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hover popover — full event info */}
      {/* Ховер — только короткая справка; всё остальное на странице события */}
      {hover && (
        <div
          style={{ position: 'fixed', left: hover.x, top: hover.y, transform: hover.flip ? 'translateY(-100%)' : undefined, zIndex: 60 }}
          className="pointer-events-none w-[260px] rounded-2xl border border-white/10 bg-ink2/95 p-3.5 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.8)] backdrop-blur-xl"
        >
          <div className="flex items-center gap-2">
            <span className={cn(
              'rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.12em]',
              hover.e.done ? 'border-brand-lime/40 text-brand-lime' : 'border-brand-orange/40 text-brand-orange',
            )}>
              {hover.e.done ? '✓ выполнено' : 'в процессе'}
            </span>
            <span className="text-[9px] uppercase tracking-[0.14em] text-light/40">{KIND_LABEL[hover.e.kind]}</span>
          </div>
          <h4 className="mt-2 line-clamp-2 font-display text-[15px] font-bold leading-tight text-light">{hover.e.title}</h4>
          <div className="mt-1.5 text-[12px] text-light/55">
            {fmtTime(hover.e.startAt)}{hover.e.endAt ? `–${fmtTime(hover.e.endAt)}` : ''}
            {hover.e.clientName ? ` · ${hover.e.clientName}` : ''}
          </div>
          {hover.e.assigneeNames.length > 0 && (
            <div className="mt-1 truncate text-[11px] text-light/40">{hover.e.assigneeNames.join(', ')}</div>
          )}
          <div className="mt-2.5 text-[10px] uppercase tracking-[0.14em] text-brand-lime/70">нажмите — подробнее →</div>
        </div>
      )}

    </div>
  );
}
