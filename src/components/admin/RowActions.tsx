'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';

/** Publish toggle + edit + delete for any admin resource. */
export function RowActions({
  apiBase,
  id,
  editHref,
  published,
  viewHref,
}: {
  apiBase: string;
  id: string;
  editHref?: string;
  published: boolean;
  viewHref?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    setBusy(true);
    try {
      const r = await fetch(`${apiBase}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !published }),
      });
      if (!r.ok) throw new Error();
      router.refresh();
    } catch {
      toast.error('Ошибка');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm('Удалить запись?')) return;
    setBusy(true);
    try {
      const r = await fetch(`${apiBase}/${id}`, { method: 'DELETE' });
      if (!r.ok) throw new Error();
      toast.success('Удалено');
      router.refresh();
    } catch {
      toast.error('Не удалось удалить');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-3 text-[11px] uppercase tracking-[0.12em]">
      <button
        onClick={toggle}
        disabled={busy}
        className={published ? 'text-brand-lime hover:opacity-70' : 'text-light/40 hover:text-brand-lime'}
        title={published ? 'Снять с публикации' : 'Опубликовать'}
      >
        {published ? '● опубл.' : '○ черновик'}
      </button>
      {viewHref && (
        <a href={viewHref} target="_blank" rel="noreferrer" className="text-light/45 hover:text-brand-lime">↗</a>
      )}
      {editHref && (
        <Link href={editHref} className="text-light/60 hover:text-brand-lime">ред.</Link>
      )}
      <button onClick={remove} disabled={busy} className="text-light/40 hover:text-rose-400">удал.</button>
    </div>
  );
}
