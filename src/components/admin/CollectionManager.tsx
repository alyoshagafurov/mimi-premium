'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/admin/PageHeader';
import { ImageUpload } from '@/components/admin/ImageUpload';
import type { Collection, Field } from '@/lib/cms-collections';

type Item = Record<string, any>;

function emptyForm(col: Collection): Item {
  const f: Item = { published: true, sortOrder: 0 };
  for (const field of col.fields) {
    if (field.type === 'rating') f[field.name] = 5;
    else if (field.type === 'socials') f[field.name] = {};
    else if (field.type === 'image') f[field.name] = null;
    else f[field.name] = '';
  }
  return f;
}

const SOCIALS = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'telegram', label: 'Telegram' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'website', label: 'Сайт' },
];

export function CollectionManager({ collection, initialItems }: { collection: Collection; initialItems: Item[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Item | null>(null);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<Item[]>(initialItems);
  const [q, setQ] = useState('');
  const dragId = useRef<string | null>(null);
  const base = `/api/admin/collections/${collection.key}`;

  // Re-sync from the server after create / edit / delete (router.refresh).
  useEffect(() => { setItems(initialItems); }, [initialItems]);

  const filtered = q
    ? items.filter((it) => String(it[collection.titleField] ?? '').toLowerCase().includes(q.toLowerCase()))
    : items;

  const onDrop = async (targetId: string) => {
    const from = dragId.current;
    dragId.current = null;
    if (!from || from === targetId) return;
    const next = [...items];
    const fi = next.findIndex((x) => x.id === from);
    const ti = next.findIndex((x) => x.id === targetId);
    if (fi < 0 || ti < 0) return;
    const [moved] = next.splice(fi, 1);
    next.splice(ti, 0, moved);
    setItems(next);
    try {
      await fetch(`${base}/reorder`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: next.map((x) => x.id) }) });
    } catch { /* optimistic */ }
  };

  const openNew = () => setEditing(emptyForm(collection));
  const openEdit = (it: Item) => {
    const form: Item = { ...emptyForm(collection), ...it };
    // normalise date fields to yyyy-mm-dd
    for (const f of collection.fields) {
      if (f.type === 'date' && form[f.name]) form[f.name] = String(form[f.name]).slice(0, 10);
      if (f.type === 'socials') form[f.name] = it[f.name] ?? {};
    }
    setEditing(form);
  };

  const set = (name: string, value: any) => setEditing((p) => (p ? { ...p, [name]: value } : p));

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const isEdit = !!editing.id;
      const r = await fetch(isEdit ? `${base}/${editing.id}` : base, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error || 'fail');
      }
      toast.success('Сохранено');
      setEditing(null);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message === 'fail' ? 'Не удалось сохранить' : e.message);
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (it: Item) => {
    await fetch(`${base}/${it.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ published: !it.published }) });
    router.refresh();
  };
  const remove = async (it: Item) => {
    if (!confirm('Удалить запись?')) return;
    await fetch(`${base}/${it.id}`, { method: 'DELETE' });
    toast.success('Удалено');
    router.refresh();
  };

  const renderField = (f: Field) => {
    const v = editing?.[f.name];
    if (f.type === 'textarea') return <textarea className="input-glass min-h-[80px]" value={v ?? ''} onChange={(e) => set(f.name, e.target.value)} placeholder={f.placeholder} />;
    if (f.type === 'image') return <ImageUpload label={f.label} value={v} onChange={(u) => set(f.name, u)} />;
    if (f.type === 'rating') return <input type="number" min={1} max={5} className="input-glass" value={v ?? 5} onChange={(e) => set(f.name, Number(e.target.value))} />;
    if (f.type === 'number') return <input type="number" className="input-glass" value={v ?? 0} onChange={(e) => set(f.name, Number(e.target.value))} />;
    if (f.type === 'date') return <input type="date" className="input-glass" value={v ?? ''} onChange={(e) => set(f.name, e.target.value)} />;
    if (f.type === 'socials') return (
      <div className="grid grid-cols-2 gap-2">
        {SOCIALS.map((s) => (
          <input key={s.key} className="input-glass !py-2" placeholder={s.label} value={(v ?? {})[s.key] ?? ''} onChange={(e) => set(f.name, { ...(v ?? {}), [s.key]: e.target.value })} />
        ))}
      </div>
    );
    return <input className="input-glass" type={f.type === 'url' ? 'url' : 'text'} value={v ?? ''} onChange={(e) => set(f.name, e.target.value)} placeholder={f.placeholder} />;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={collection.eyebrow}
        title={<>{collection.label}</>}
        subtitle="Создавайте, редактируйте, публикуйте и удаляйте записи."
        action={<button onClick={openNew} className="btn-lime">+ {collection.singular}</button>}
      />

      <div className="flex items-center justify-between gap-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск…" className="input-glass sm:max-w-xs" />
        <span className="text-[11px] text-light/40">Перетаскивайте ⠿ для сортировки</span>
      </div>

      <div className="grid gap-3">
        {filtered.map((it) => (
          <div
            key={it.id}
            draggable={!q}
            onDragStart={() => { dragId.current = it.id; }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(it.id)}
            className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="cursor-grab select-none text-light/25 active:cursor-grabbing" title="Перетащить">⠿</span>
              {(it.photo || it.logo || it.image) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={it.photo || it.logo || it.image} alt="" className="h-10 w-10 rounded-lg border border-white/10 object-cover" />
              )}
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-light">{it[collection.titleField] || '—'}</div>
                <div className="truncate text-[11px] text-light/40">{it.position || it.company || it.category || it.issuer || it.value || ''}</div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3 text-[11px] uppercase tracking-[0.12em]">
              <button onClick={() => togglePublish(it)} className={it.published ? 'text-brand-lime' : 'text-light/40 hover:text-brand-lime'}>{it.published ? '● опубл.' : '○ скрыт'}</button>
              <button onClick={() => openEdit(it)} className="text-light/60 hover:text-brand-lime">ред.</button>
              <button onClick={() => remove(it)} className="text-light/40 hover:text-rose-400">удал.</button>
            </div>
          </div>
        ))}
        {!filtered.length && <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-10 text-center text-light/45">{items.length ? 'Ничего не найдено.' : 'Пока пусто.'}</div>}
      </div>

      <AnimatePresence>
        {editing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/80 p-4 py-10" onClick={() => setEditing(null)}>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-3xl border border-white/[0.08] bg-ink2 p-6">
              <h3 className="font-display text-xl font-bold text-light">{editing.id ? 'Редактировать' : `Новый: ${collection.singular}`}</h3>
              <div className="mt-5 space-y-4">
                {collection.fields.map((f) => (
                  <div key={f.name}>
                    {f.type !== 'image' && <label className="label-soft">{f.label}{f.required && ' *'}</label>}
                    {renderField(f)}
                  </div>
                ))}
                <div className="flex items-center gap-4 border-t border-white/[0.06] pt-4">
                  <label className="flex items-center gap-2 text-sm text-light/70">
                    <input type="checkbox" checked={!!editing.published} onChange={(e) => set('published', e.target.checked)} /> Опубликовано
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="label-soft !mb-0">Порядок</span>
                    <input type="number" className="input-glass !w-20 !py-1.5" value={editing.sortOrder ?? 0} onChange={(e) => set('sortOrder', Number(e.target.value))} />
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setEditing(null)} className="btn-ghost">Отмена</button>
                <button onClick={save} disabled={saving} className="btn-lime disabled:opacity-60">{saving ? 'Сохраняем…' : 'Сохранить'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
