'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

type Note = { id: string; body: string; author: string; createdAt: string };

/** Internal project notes — visible to staff only, never shown to the client. */
export function ProjectNotes({ clientId, initial }: { clientId: string; initial: Note[] }) {
  const [notes, setNotes] = useState<Note[]>(initial);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  const add = async () => {
    const text = body.trim();
    if (!text) return;
    setBusy(true);
    const res = await fetch(`/api/projects/${clientId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: text }),
    });
    setBusy(false);
    if (res.ok) {
      const note = (await res.json()) as Note;
      setNotes((xs) => [note, ...xs]);
      setBody('');
    } else {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error || 'Не удалось добавить заметку');
    }
  };

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6">
      <p className="mb-4 text-[10px] uppercase tracking-[0.24em] text-brand-orange">Внутренние заметки</p>

      <div className="flex flex-col gap-2 sm:flex-row">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Заметка для команды (клиент её не видит)…"
          rows={2}
          className="input-glass min-h-[44px] flex-1"
        />
        <button onClick={add} disabled={busy || !body.trim()} className="btn-lime shrink-0 !px-5 !text-[12px] disabled:opacity-50">
          {busy ? '…' : 'Добавить'}
        </button>
      </div>

      <div className="mt-5 space-y-3">
        {notes.length === 0 && <p className="text-sm text-light/40">Заметок пока нет.</p>}
        {notes.map((n) => (
          <div key={n.id} className="rounded-2xl border border-white/[0.05] bg-white/[0.02] px-4 py-3">
            <div className="mb-1 flex items-center gap-2 text-[11px] text-light/40">
              <span className="text-light/70">{n.author}</span>
              <span>·</span>
              <span>{fmt(n.createdAt)}</span>
            </div>
            <p className="whitespace-pre-wrap text-sm text-light/85">{n.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
