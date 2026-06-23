'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/admin/PageHeader';
import { cn } from '@/lib/utils';

type Kind = 'MEETING' | 'CALL' | 'LAUNCH' | 'DEADLINE' | 'OTHER';
type Event = {
  id: string;
  title: string;
  description: string;
  kind: Kind;
  startAt: string;
  endAt: string | null;
  clientId: string | null;
  clientName: string | null;
};

const KIND_LABEL: Record<Kind, string> = {
  MEETING: 'Встреча',
  CALL: 'Созвон',
  LAUNCH: 'Запуск',
  DEADLINE: 'Дедлайн',
  OTHER: 'Другое',
};
const KIND_COLOR: Record<Kind, string> = {
  MEETING: 'border-brand-lime/30 bg-brand-lime/[0.06] text-brand-lime',
  CALL: 'border-sky-400/30 bg-sky-400/[0.06] text-sky-300',
  LAUNCH: 'border-brand-orange/30 bg-brand-orange/[0.06] text-brand-orange',
  DEADLINE: 'border-rose-400/30 bg-rose-400/[0.06] text-rose-300',
  OTHER: 'border-white/10 bg-white/[0.04] text-light/70',
};

function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
function isSameDay(a: Date, b: Date) { return a.toDateString() === b.toDateString(); }

const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export function CalendarClient({
  events,
  clients,
}: {
  events: Event[];
  clients: { id: string; businessName: string }[];
}) {
  const router = useRouter();
  const [cursor, setCursor] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    kind: 'MEETING' as Kind,
    startAt: '',
    endAt: '',
    clientId: '',
  });

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
    for (const e of events) {
      const key = new Date(e.startAt).toDateString();
      const arr = map.get(key) ?? [];
      arr.push(e);
      map.set(key, arr);
    }
    return map;
  }, [events]);

  const save = async () => {
    if (!form.title || !form.startAt) {
      toast.error('Заполните название и дату');
      return;
    }
    const r = await fetch('/api/calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        clientId: form.clientId || null,
        endAt: form.endAt || null,
      }),
    });
    if (!r.ok) {
      toast.error('Не удалось сохранить');
      return;
    }
    toast.success('Событие добавлено');
    setShowForm(false);
    setForm({ title: '', description: '', kind: 'MEETING', startAt: '', endAt: '', clientId: '' });
    router.refresh();
  };

  const remove = async (id: string) => {
    if (!confirm('Удалить событие?')) return;
    await fetch(`/api/calendar/${id}`, { method: 'DELETE' });
    router.refresh();
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Calendar"
        title={<>Календарь</>}
        subtitle="Встречи, созвоны, запуски кампаний и дедлайны команды."
      />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            className="rounded-lg border border-white/10 px-3 py-1 text-sm text-light/70 hover:text-brand-lime"
          >
            ←
          </button>
          <div className="min-w-[180px] text-center font-display text-lg font-bold text-light">
            {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
          </div>
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            className="rounded-lg border border-white/10 px-3 py-1 text-sm text-light/70 hover:text-brand-lime"
          >
            →
          </button>
          <button
            onClick={() => setCursor(new Date())}
            className="ml-2 rounded-lg border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.15em] text-light/55 hover:text-brand-lime"
          >
            Сегодня
          </button>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-lime">
          + Событие
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/[0.06]">
        <div className="grid grid-cols-7 border-b border-white/[0.06] bg-white/[0.02]">
          {WEEKDAYS.map((w) => (
            <div key={w} className="px-2 py-2 text-center text-[10px] uppercase tracking-[0.16em] text-light/45">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((d, i) => {
            const inMonth = d.getMonth() === cursor.getMonth();
            const today = isSameDay(d, new Date());
            const list = eventsByDay.get(d.toDateString()) ?? [];
            return (
              <div
                key={i}
                className={cn(
                  'min-h-[100px] border-b border-r border-white/[0.04] p-1.5',
                  !inMonth && 'opacity-40',
                  today && 'bg-brand-lime/[0.04]',
                )}
              >
                <div className={cn('mb-1 text-[11px] font-bold', today ? 'text-brand-lime' : 'text-light/50')}>
                  {d.getDate()}
                </div>
                <div className="space-y-1">
                  {list.slice(0, 3).map((e) => (
                    <button
                      key={e.id}
                      onClick={() => remove(e.id)}
                      title={`${e.title}${e.clientName ? ` · ${e.clientName}` : ''} — клик чтобы удалить`}
                      className={cn(
                        'block w-full truncate rounded-md border px-1.5 py-0.5 text-left text-[10px]',
                        KIND_COLOR[e.kind],
                      )}
                    >
                      {new Date(e.startAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} {e.title}
                    </button>
                  ))}
                  {list.length > 3 && <div className="text-[10px] text-light/40">+ ещё {list.length - 3}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showForm && (
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
              <input
                className="input-glass"
                placeholder="Название"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <textarea
                className="input-glass min-h-[60px]"
                placeholder="Описание"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <select
                className="input-glass"
                value={form.kind}
                onChange={(e) => setForm({ ...form, kind: e.target.value as Kind })}
              >
                {Object.entries(KIND_LABEL).map(([k, l]) => (
                  <option key={k} value={k}>
                    {l}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-soft">Начало</label>
                  <input
                    type="datetime-local"
                    className="input-glass"
                    value={form.startAt}
                    onChange={(e) => setForm({ ...form, startAt: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label-soft">Конец</label>
                  <input
                    type="datetime-local"
                    className="input-glass"
                    value={form.endAt}
                    onChange={(e) => setForm({ ...form, endAt: e.target.value })}
                  />
                </div>
              </div>
              <select
                className="input-glass"
                value={form.clientId}
                onChange={(e) => setForm({ ...form, clientId: e.target.value })}
              >
                <option value="">Без клиента</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.businessName}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="btn-ghost">Отмена</button>
              <button onClick={save} className="btn-lime">Создать</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
