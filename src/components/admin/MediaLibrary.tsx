'use client';

import { useRef, useState } from 'react';
import toast from 'react-hot-toast';

export type Asset = { id: string; url: string; name: string; folder: string; mime: string | null; size: number; createdAt: string };

function fmtSize(n: number) {
  if (!n) return '';
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function MediaLibrary({ initialAssets, onPick, compact }: { initialAssets: Asset[]; onPick?: (url: string) => void; compact?: boolean }) {
  const [assets, setAssets] = useState<Asset[]>(initialAssets);
  const [folder, setFolder] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [uploadFolder, setUploadFolder] = useState('Общее');
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const folders = Array.from(new Set(assets.map((a) => a.folder))).sort();
  const filtered = assets.filter((a) => (!folder || a.folder === folder) && (!q || a.name.toLowerCase().includes(q.toLowerCase())));

  const doUpload = async (files: File[]) => {
    const imgs = files.filter((f) => f.type.startsWith('image/'));
    if (!imgs.length) return;
    setBusy(true);
    for (const f of imgs) {
      const fd = new FormData();
      fd.append('file', f);
      fd.append('folder', uploadFolder || 'Общее');
      try {
        const r = await fetch('/api/admin/upload', { method: 'POST', body: fd });
        if (r.ok) {
          const d = await r.json();
          setAssets((p) => [{ id: d.id, url: d.url, name: f.name, folder: uploadFolder || 'Общее', mime: f.type, size: f.size, createdAt: new Date().toISOString() }, ...p]);
        }
      } catch { /* ignore */ }
    }
    setBusy(false);
    toast.success('Загружено в медиатеку');
  };

  const copy = (url: string) => { navigator.clipboard?.writeText(url); toast.success('Ссылка скопирована'); };
  const remove = async (id: string) => {
    if (!confirm('Удалить файл из медиатеки?')) return;
    await fetch(`/api/admin/media/${id}`, { method: 'DELETE' });
    setAssets((p) => p.filter((a) => a.id !== id));
  };
  const move = async (a: Asset) => {
    const nf = prompt('Переместить в папку:', a.folder);
    if (!nf || nf === a.folder) return;
    await fetch(`/api/admin/media/${a.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ folder: nf }) });
    setAssets((p) => p.map((x) => (x.id === a.id ? { ...x, folder: nf } : x)));
  };

  return (
    <div className="space-y-5">
      {/* controls */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFolder(null)} className={`rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] ${!folder ? 'border-brand-lime/50 bg-brand-lime/[0.08] text-brand-lime' : 'border-white/10 text-light/55 hover:text-light'}`}>Все</button>
          {folders.map((f) => (
            <button key={f} onClick={() => setFolder(f)} className={`rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] ${folder === f ? 'border-brand-lime/50 bg-brand-lime/[0.08] text-brand-lime' : 'border-white/10 text-light/55 hover:text-light'}`}>{f}</button>
          ))}
        </div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск по имени…" className="input-glass lg:max-w-xs" />
      </div>

      {/* upload dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); doUpload(Array.from(e.dataTransfer.files)); }}
        className={`flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed p-6 text-center transition-colors ${drag ? 'border-brand-lime/60 bg-brand-lime/[0.05]' : 'border-white/15'}`}
      >
        <p className="text-sm text-light/55">{busy ? 'Загрузка…' : 'Перетащите изображения сюда или'}</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <input className="input-glass !w-40 !py-2 !text-[12px]" value={uploadFolder} onChange={(e) => setUploadFolder(e.target.value)} placeholder="Папка" />
          <button onClick={() => inputRef.current?.click()} disabled={busy} className="btn-lime !py-2 !text-[11px] disabled:opacity-50">Выбрать файлы</button>
        </div>
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { doUpload(Array.from(e.target.files ?? [])); if (inputRef.current) inputRef.current.value = ''; }} />
      </div>

      {/* grid */}
      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-10 text-center text-light/45">Нет изображений.</p>
      ) : (
        <div className={`grid gap-3 ${compact ? 'grid-cols-3 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'}`}>
          {filtered.map((a) => (
            <div key={a.id} className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <button
                type="button"
                onClick={() => (onPick ? onPick(a.url) : copy(a.url))}
                className="block aspect-square w-full"
                title={onPick ? 'Выбрать' : 'Скопировать ссылку'}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.url} alt={a.name} loading="lazy" decoding="async" className="h-full w-full object-cover" />
              </button>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/90 to-transparent p-2">
                <div className="truncate text-[10px] text-light/70">{a.name}</div>
                <div className="text-[9px] text-light/40">{a.folder} · {fmtSize(a.size)}</div>
              </div>
              {!onPick && (
                <div className="absolute right-1 top-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button onClick={() => copy(a.url)} title="Скопировать ссылку" className="flex h-6 w-6 items-center justify-center rounded-md bg-ink/80 text-[11px] text-light/70 hover:text-brand-lime">⧉</button>
                  <button onClick={() => move(a)} title="Переместить" className="flex h-6 w-6 items-center justify-center rounded-md bg-ink/80 text-[11px] text-light/70 hover:text-brand-lime">⇄</button>
                  <button onClick={() => remove(a.id)} title="Удалить" className="flex h-6 w-6 items-center justify-center rounded-md bg-ink/80 text-[11px] text-light/70 hover:text-rose-400">×</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
