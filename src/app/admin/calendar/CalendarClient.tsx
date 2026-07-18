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
  assigneeId: string | null;
  assigneeName: string | null;
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

const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const EMPTY = {
  title: '', description: '', kind: 'MEETING' as Kind, category: 'GENERAL' as EventCategory,
  startAt: '', endAt: '', clientId: '', assigneeId: '',
};

export function CalendarClient({
  role,
  canManage,
  categories,
  events,
  clients,
  staff,
}: {
  role: string;
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
  const [hover, setHover] = useState<{ e: Event; x: number; y: number; flip: boolean } | null>(null);
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((p) => ({ ...p, [k]: v }));

  const showTabs = categories.length > 1;
  const shownEvents = useMemo(
    () => (tab === 'ALL' ? events : events.filter((e) => e.category === tab)),
    [events, tab],
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
    if (!form.title || !form.startAt) return toast.error('Заполните название и дату');
    setSaving(true);
    try {
      const r = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, clientId: form.clientId || null, assigneeId: form.assigneeId || null, endAt: form.endAt || null }),
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
    return e.assigneeName ? `${main} · ${e.assigneeName}` : main;
  };

  return (
    <div className="space-y-5" onScroll={() => setHover(null)}>
      <PageHeader
        eyebrow="Calendar"
        title={<>Календарь</>}
        subtitle="Встречи, съёмки, запуски, дедлайны и оплаты команды."
      />

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
          {categories.map((c) => (
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
        {canManage && <button onClick={() => setShowForm(true)} className="btn-lime">+ Событие</button>}
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
                      onClick={() => canManage && remove(e.id)}
                      className={cn(
                        'block w-full cursor-pointer truncate rounded-md border border-brand-lime/40 bg-brand-lime/[0.12] px-1.5 py-0.5 text-left text-[10px] font-medium text-brand-lime transition-colors hover:bg-brand-lime/20',
                      )}
                    >
                      {fmtTime(e.startAt)} {chipLabel(e)}
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
      {hover && (
        <div
          style={{ position: 'fixed', left: hover.x, top: hover.y, transform: hover.flip ? 'translateY(-100%)' : undefined, zIndex: 60 }}
          className="pointer-events-none w-[280px] rounded-2xl border border-brand-lime/25 bg-ink2/95 p-4 shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="rounded-full border border-brand-lime/30 bg-brand-lime/[0.08] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-brand-lime">
              {CATEGORY_LABEL[hover.e.category]}
            </span>
            <span className="text-[10px] uppercase tracking-[0.16em] text-brand-orange">{KIND_LABEL[hover.e.kind]}</span>
          </div>
          <h4 className="mt-3 font-display text-base font-bold leading-tight text-light">{hover.e.title}</h4>
          <div className="mt-3 space-y-1.5 text-[12px]">
            {hover.e.clientName && (
              <div className="flex gap-2"><span className="text-light/40">Проект:</span><span className="text-light/85">{hover.e.clientName}</span></div>
            )}
            {hover.e.assigneeName && (
              <div className="flex gap-2"><span className="text-light/40">Ответственный:</span><span className="text-light/85">{hover.e.assigneeName}</span></div>
            )}
            <div className="flex gap-2">
              <span className="text-light/40">Когда:</span>
              <span className="text-light/85">{fmtDate(hover.e.startAt)}, {fmtTime(hover.e.startAt)}{hover.e.endAt ? `–${fmtTime(hover.e.endAt)}` : ''}</span>
            </div>
          </div>
          {hover.e.description && <p className="mt-3 border-t border-white/[0.06] pt-3 text-[12px] leading-relaxed text-light/60">{hover.e.description}</p>}
          {canManage && <p className="mt-3 text-[10px] uppercase tracking-[0.14em] text-light/30">клик по плашке — удалить</p>}
        </div>
      )}

      {/* Create form (managers only) */}
      {showForm && canManage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4"
          onClick={() => setShowForm(false)}
        >
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-white/[0.08] bg-ink2 p-6"
          >
            <h3 className="font-display text-xl font-bold text-light">Новое событие</h3>
            <div className="mt-5 space-y-3">
              <div>
                <label className="label-soft">Проект</label>
                <select className="input-glass" value={form.clientId} onChange={(e) => set('clientId', e.target.value)}>
                  <option value="">Без проекта</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.businessName}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-soft">Тип события</label>
                  <select
                    className="input-glass"
                    value={form.kind}
                    onChange={(e) => {
                      const kind = e.target.value as Kind;
                      setForm((p) => ({ ...p, kind, category: KIND_CATEGORY[kind] ?? p.category }));
                    }}
                  >
                    {Object.entries(KIND_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-soft">Календарь (команда)</label>
                  <select className="input-glass" value={form.category} onChange={(e) => set('category', e.target.value as EventCategory)}>
                    {(['GENERAL','VIDEO','DESIGN','SALES','TARGET','WEB'] as EventCategory[]).map((c) => (
                      <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="label-soft">Ответственный</label>
                <select className="input-glass" value={form.assigneeId} onChange={(e) => set('assigneeId', e.target.value)}>
                  <option value="">Не назначен</option>
                  {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <input className="input-glass" placeholder="Название" value={form.title} onChange={(e) => set('title', e.target.value)} />
              <textarea className="input-glass min-h-[60px]" placeholder="Описание" value={form.description} onChange={(e) => set('description', e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-soft">Начало</label>
                  <input type="datetime-local" className="input-glass" value={form.startAt} onChange={(e) => set('startAt', e.target.value)} />
                </div>
                <div>
                  <label className="label-soft">Конец</label>
                  <input type="datetime-local" className="input-glass" value={form.endAt} onChange={(e) => set('endAt', e.target.value)} />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="btn-ghost">Отмена</button>
              <button onClick={save} disabled={saving} className="btn-lime disabled:opacity-60">{saving ? 'Создаём…' : 'Создать'}</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
