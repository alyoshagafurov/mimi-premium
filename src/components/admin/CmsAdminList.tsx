'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/admin/PageHeader';
import { RowActions } from '@/components/admin/RowActions';

export type CmsRow = { id: string; title: string; slug: string; published: boolean; meta1?: string; meta2?: string };

export function CmsAdminList({
  resource, basePath, apiBase, viewBase, eyebrow, title, subtitle, newLabel, col1, col2, items,
}: {
  resource: string;
  basePath: string; // /admin/cases
  apiBase: string; // /api/admin/cases
  viewBase: string; // /cases
  eyebrow: string;
  title: string;
  subtitle: string;
  newLabel: string;
  col1: string;
  col2: string;
  items: CmsRow[];
}) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | 'pub' | 'draft'>('all');
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(
    () =>
      items.filter(
        (it) =>
          (status === 'all' || (status === 'pub' ? it.published : !it.published)) &&
          (!q || it.title.toLowerCase().includes(q.toLowerCase()) || it.slug.includes(q.toLowerCase())),
      ),
    [items, q, status],
  );

  const allChecked = filtered.length > 0 && filtered.every((it) => sel.has(it.id));
  const toggleAll = () => setSel(allChecked ? new Set() : new Set(filtered.map((it) => it.id)));
  const toggle = (id: string) => setSel((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const bulk = async (action: 'publish' | 'hide' | 'delete') => {
    const ids = [...sel];
    if (!ids.length) return;
    if (action === 'delete' && !confirm(`Удалить выбранные (${ids.length})?`)) return;
    setBusy(true);
    try {
      const r = await fetch('/api/admin/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resource, action, ids }) });
      if (!r.ok) throw new Error();
      toast.success(action === 'delete' ? 'Удалено' : action === 'publish' ? 'Опубликовано' : 'Скрыто');
      setSel(new Set());
      router.refresh();
    } catch {
      toast.error('Ошибка массового действия');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={eyebrow} title={<>{title}</>} subtitle={subtitle} action={<Link href={`${basePath}/new`} className="btn-lime">{newLabel}</Link>} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск…" className="input-glass sm:max-w-xs" />
        <div className="flex gap-2">
          {(['all', 'pub', 'draft'] as const).map((s) => (
            <button key={s} onClick={() => setStatus(s)} className={`rounded-full border px-4 py-1.5 text-[11px] uppercase tracking-[0.12em] ${status === s ? 'border-brand-lime/50 bg-brand-lime/[0.08] text-brand-lime' : 'border-white/10 text-light/55 hover:text-light'}`}>
              {s === 'all' ? 'Все' : s === 'pub' ? 'Опубл.' : 'Черновики'}
            </button>
          ))}
        </div>
      </div>

      {sel.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-brand-lime/25 bg-brand-lime/[0.05] px-4 py-3 text-sm">
          <span className="text-light/70">Выбрано: {sel.size}</span>
          <div className="ml-auto flex gap-2">
            <button disabled={busy} onClick={() => bulk('publish')} className="btn-ghost !py-1.5 !text-[11px]">Опубликовать</button>
            <button disabled={busy} onClick={() => bulk('hide')} className="btn-ghost !py-1.5 !text-[11px]">Скрыть</button>
            <button disabled={busy} onClick={() => bulk('delete')} className="btn-ghost !py-1.5 !text-[11px] !text-rose-300 hover:!border-rose-400/40">Удалить</button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-3xl border border-white/[0.06]">
        <table className="w-full text-sm">
          <thead className="border-b border-white/[0.06] bg-white/[0.02] text-left text-[10px] uppercase tracking-[0.16em] text-light/45">
            <tr>
              <th className="w-10 px-4 py-3"><input type="checkbox" checked={allChecked} onChange={toggleAll} aria-label="Выбрать все" /></th>
              <th className="px-4 py-3">{title === 'Кейсы' ? 'Название' : 'Заголовок'}</th>
              <th className="hidden px-4 py-3 sm:table-cell">{col1}</th>
              <th className="hidden px-4 py-3 md:table-cell">{col2}</th>
              <th className="px-4 py-3 text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((it) => (
              <tr key={it.id} className="border-b border-white/[0.04]">
                <td className="px-4 py-3"><input type="checkbox" checked={sel.has(it.id)} onChange={() => toggle(it.id)} aria-label={`Выбрать ${it.title}`} /></td>
                <td className="px-4 py-3">
                  <div className="font-medium text-light">{it.title}</div>
                  <div className="text-[11px] text-light/40">{viewBase}/{it.slug}{!it.published && ' · черновик'}</div>
                </td>
                <td className="hidden px-4 py-3 text-light/60 sm:table-cell">{it.meta1 || '—'}</td>
                <td className="hidden px-4 py-3 text-light/60 md:table-cell">{it.meta2 || '—'}</td>
                <td className="px-4 py-3">
                  <RowActions apiBase={apiBase} id={it.id} editHref={`${basePath}/${it.id}`} published={it.published} viewHref={`${viewBase}/${it.slug}`} />
                </td>
              </tr>
            ))}
            {!filtered.length && <tr><td colSpan={5} className="px-4 py-10 text-center text-light/45">Ничего не найдено.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
