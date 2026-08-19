'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { cn } from '@/lib/utils';

const KIND_LABEL: Record<string, string> = {
  MEETING: 'Встреча', CALL: 'Созвон', CONSULTATION: 'Консультация', PAYMENT: 'Дата оплаты',
  COLLABORATION: 'Сотрудничество', SHOOTING: 'Съёмки', LAUNCH: 'Запуск',
  RETARGETING: 'Ретаргет', DEADLINE: 'Дедлайн', TASK: 'Задача', OTHER: 'Другое',
};

type Ev = {
  id: string; title: string; description: string; kind: string;
  category: string; categoryLabel: string;
  startAt: string; endAt: string | null; done: boolean; doneAt: string | null;
  clientId: string | null; clientName: string | null; clientLogo: string | null;
  ownerName: string | null;
  assignees: { id: string; name: string; avatar: string | null; jobTitle: string }[];
  createdAt: string;
};
type Note = { id: string; body: string; createdAt: string };

const dt = (iso: string) =>
  new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const tm = (iso: string) => new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

export function EventDetail({
  event, notes: initialNotes, canManage, canDelete,
}: {
  event: Ev; notes: Note[]; canManage: boolean; canDelete: boolean;
}) {
  const router = useRouter();
  const [done, setDone] = useState(event.done);
  const [notes, setNotes] = useState(initialNotes);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);

  const toggleDone = async () => {
    setBusy(true);
    const r = await fetch(`/api/calendar/${event.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done: !done }),
    });
    setBusy(false);
    if (!r.ok) return toast.error('Не удалось обновить');
    setDone(!done);
    toast.success(!done ? 'Отмечено выполненным' : 'Возвращено в работу');
    router.refresh();
  };

  const addNote = async () => {
    const body = draft.trim();
    if (!body) return;
    setBusy(true);
    const r = await fetch(`/api/calendar/${event.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    });
    setBusy(false);
    if (!r.ok) return toast.error('Не удалось сохранить заметку');
    const note = (await r.json()) as Note;
    setNotes((xs) => [note, ...xs]);
    setDraft('');
    toast.success('Заметка сохранена — она есть и в разделе «Заметки»');
    router.refresh();
  };

  const remove = async () => {
    if (!confirm('Удалить событие?')) return;
    const r = await fetch(`/api/calendar/${event.id}`, { method: 'DELETE' });
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      return toast.error(d.error || 'Не удалось удалить');
    }
    toast.success('Событие удалено');
    router.push('/admin/calendar');
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
      {/* ── Основное ── */}
      <div className="space-y-5">
        <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-light/50">
              {event.categoryLabel}
            </span>
            <span className="text-[10px] uppercase tracking-[0.16em] text-brand-orange">
              {KIND_LABEL[event.kind] ?? event.kind}
            </span>
            <span className={cn(
              'ml-auto rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.14em]',
              done ? 'border-brand-lime/40 bg-brand-lime/10 text-brand-lime'
                   : 'border-brand-orange/40 bg-brand-orange/10 text-brand-orange',
            )}>
              {done ? '✓ Выполнено' : '● В процессе'}
            </span>
          </div>

          <h1 className="mt-4 font-display text-2xl font-extrabold leading-tight text-light sm:text-3xl">
            {event.title}
          </h1>

          <p className="mt-2 text-sm text-light/60">
            {dt(event.startAt)}{event.endAt ? ` — ${tm(event.endAt)}` : ''}
          </p>

          {event.description && (
            <p className="mt-5 whitespace-pre-wrap border-t border-white/[0.06] pt-5 text-[14px] leading-relaxed text-light/70">
              {event.description}
            </p>
          )}

          <button
            onClick={toggleDone}
            disabled={busy}
            className={cn(
              'mt-6 w-full rounded-2xl border px-4 py-3 text-[12px] uppercase tracking-[0.14em] transition disabled:opacity-50',
              done ? 'border-white/15 text-light/60 hover:border-brand-orange/40 hover:text-brand-orange'
                   : 'border-brand-lime bg-brand-lime text-[#0A0712] hover:opacity-90',
            )}
          >
            {done ? 'Вернуть в работу' : '✓ Отметить выполненным'}
          </button>

          {done && event.doneAt && (
            <p className="mt-2 text-center text-[11px] text-light/35">выполнено {dt(event.doneAt)}</p>
          )}
        </div>

        {/* Заметки */}
        <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6">
          <p className="mb-3 text-[10px] uppercase tracking-[0.24em] text-brand-orange">Мои заметки</p>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            placeholder="Что нужно помнить по этому событию…"
            className="input-glass min-h-[70px]"
          />
          <div className="mt-2 flex justify-end">
            <button onClick={addNote} disabled={busy || !draft.trim()} className="btn-lime !px-4 !py-1.5 !text-[11px] disabled:opacity-50">
              Добавить
            </button>
          </div>
          <p className="mt-2 text-[11px] text-light/35">Заметки личные — их видите только вы.</p>

          <div className="mt-4 space-y-2">
            {notes.length === 0 && <p className="text-[12px] text-light/35">Заметок пока нет.</p>}
            {notes.map((n) => (
              <div key={n.id} className="rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2">
                <div className="text-[10px] text-light/35">
                  {new Date(n.createdAt).toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
                <p className="mt-1 whitespace-pre-wrap text-[13px] text-light/85">{n.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Сбоку: проект, ответственные, служебное ── */}
      <div className="space-y-5">
        {event.clientName && (
          <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6">
            <p className="mb-4 text-[10px] uppercase tracking-[0.24em] text-brand-orange">Проект</p>
            <Link href={`/admin/projects/${event.clientId}`} className="group flex items-center gap-3">
              {event.clientLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={event.clientLogo} alt="" className="h-11 w-11 shrink-0 rounded-2xl object-cover" />
              ) : (
                <UserAvatar name={event.clientName} avatar={null} size={44} />
              )}
              <span className="truncate text-sm font-medium text-light group-hover:text-brand-lime">
                {event.clientName}
              </span>
            </Link>
          </div>
        )}

        <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6">
          <p className="mb-4 text-[10px] uppercase tracking-[0.24em] text-brand-orange">
            Ответственные{event.assignees.length > 1 ? ` · ${event.assignees.length}` : ''}
          </p>
          {event.assignees.length === 0 ? (
            <p className="text-sm text-light/40">Не назначены</p>
          ) : (
            <div className="space-y-3">
              {event.assignees.map((a) => (
                <Link key={a.id} href={`/admin/people/${a.id}`} className="group flex items-center gap-3">
                  <UserAvatar name={a.name} avatar={a.avatar} size={38} />
                  <div className="min-w-0">
                    <div className="truncate text-sm text-light group-hover:text-brand-lime">{a.name}</div>
                    {a.jobTitle && <div className="truncate text-[11px] text-light/40">{a.jobTitle}</div>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6 text-[12px] text-light/45">
          {event.ownerName && <div>Создал: <span className="text-light/70">{event.ownerName}</span></div>}
          <div className="mt-1">Добавлено: {dt(event.createdAt)}</div>
          {canDelete && (
            <button onClick={remove} className="mt-4 text-[11px] uppercase tracking-[0.14em] text-light/35 hover:text-rose-400">
              Удалить событие
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
