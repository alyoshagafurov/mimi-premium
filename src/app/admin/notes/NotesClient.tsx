'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/admin/PageHeader';

type Note = {
  id: string;
  body: string;
  createdAt: string;
  eventId: string | null;
  eventTitle: string | null;
  eventAt: string | null;
  remindAt: string | null;
  remindText: string;
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

export function NotesClient({ notes: initial }: { notes: Note[] }) {
  const router = useRouter();
  const [notes, setNotes] = useState(initial);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  // Необязательное напоминание к новой заметке.
  const [remindAt, setRemindAt] = useState('');
  const [remindText, setRemindText] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const add = async () => {
    const body = draft.trim();
    if (!body) return;
    setBusy(true);
    const r = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        body,
        remindAt: remindAt ? new Date(remindAt).toISOString() : null,
        remindText: remindText.trim() || null,
      }),
    });
    setBusy(false);
    if (!r.ok) return toast.error('Не удалось сохранить');
    const n = await r.json();
    setNotes((xs) => [{ ...n, eventTitle: null, eventAt: null }, ...xs]);
    setDraft('');
    setRemindAt('');
    setRemindText('');
  };

  const save = async (id: string) => {
    const body = editText.trim();
    if (!body) return;
    const r = await fetch(`/api/notes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    });
    if (!r.ok) return toast.error('Не удалось сохранить');
    setNotes((xs) => xs.map((n) => (n.id === id ? { ...n, body } : n)));
    setEditing(null);
  };

  const remove = async (id: string) => {
    if (!confirm('Удалить заметку?')) return;
    const r = await fetch(`/api/notes/${id}`, { method: 'DELETE' });
    if (!r.ok) return toast.error('Не удалось удалить');
    setNotes((xs) => xs.filter((n) => n.id !== id));
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Notes"
        title={<>Заметки</>}
        subtitle="Ваши личные заметки. Никто другой их не видит."
      />

      {/* Новая заметка */}
      <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Записать мысль, договорённость, задачу…"
          rows={3}
          className="input-glass min-h-[90px]"
        />
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label-soft">Напомнить (необязательно)</label>
            <input
              type="datetime-local"
              value={remindAt}
              onChange={(e) => setRemindAt(e.target.value)}
              className="input-glass !py-1.5 !text-[12px]"
            />
          </div>
          <div>
            <label className="label-soft">Текст напоминания</label>
            <input
              value={remindText}
              onChange={(e) => setRemindText(e.target.value)}
              placeholder="Что вам напомнить в это время"
              className="input-glass !py-1.5 !text-[12px]"
            />
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <button onClick={add} disabled={busy || !draft.trim()} className="btn-lime !px-5 !py-2 !text-[12px] disabled:opacity-50">
            {busy ? 'Сохраняем…' : 'Добавить заметку'}
          </button>
        </div>
      </div>

      {/* Список */}
      <div className="space-y-3">
        {notes.length === 0 && (
          <p className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-10 text-center text-light/45">
            Заметок пока нет. Всё, что вы запишете здесь или в календаре, появится тут.
          </p>
        )}

        {notes.map((n) => (
          <div key={n.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="mb-2 flex flex-wrap items-center gap-3 text-[11px] text-light/40">
              <span>{fmt(n.createdAt)}</span>
              {n.remindAt && (
                <span className="rounded-full border border-brand-orange/40 bg-brand-orange/10 px-2.5 py-0.5 text-brand-orange">
                  ⏰ {new Date(n.remindAt).toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  {n.remindText ? ` · ${n.remindText}` : ''}
                </span>
              )}
              {n.eventId && (
                <Link
                  href="/admin/calendar"
                  className="rounded-full border border-brand-lime/30 bg-brand-lime/[0.06] px-2.5 py-0.5 text-brand-lime"
                >
                  🗓 {n.eventTitle}
                  {n.eventAt ? ` · ${new Date(n.eventAt).toLocaleDateString('ru-RU')}` : ''}
                </Link>
              )}
            </div>

            {editing === n.id ? (
              <>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={3}
                  className="input-glass min-h-[80px]"
                />
                <div className="mt-2 flex justify-end gap-2">
                  <button onClick={() => setEditing(null)} className="btn-ghost !px-4 !py-1.5 !text-[11px]">Отмена</button>
                  <button onClick={() => save(n.id)} className="btn-lime !px-4 !py-1.5 !text-[11px]">Сохранить</button>
                </div>
              </>
            ) : (
              <>
                <p className="whitespace-pre-wrap text-sm text-light/85">{n.body}</p>
                <div className="mt-3 flex gap-4">
                  <button
                    onClick={() => { setEditing(n.id); setEditText(n.body); }}
                    className="text-[11px] uppercase tracking-[0.14em] text-light/45 hover:text-brand-lime"
                  >
                    Изменить
                  </button>
                  <button
                    onClick={() => remove(n.id)}
                    className="text-[11px] uppercase tracking-[0.14em] text-light/35 hover:text-rose-400"
                  >
                    Удалить
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
