'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/admin/PageHeader';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { cn } from '@/lib/utils';

type Review = {
  id: string; name: string; company: string | null; position: string | null; photo: string | null;
  rating: number; text: string; published: boolean; fromSite: boolean; createdAt: string;
};
type Form = { name: string; company: string; position: string; photo: string | null; rating: number; text: string; published: boolean };
type Tab = 'pending' | 'published' | 'all';

const EMPTY: Form = { name: '', company: '', position: '', photo: null, rating: 5, text: '', published: true };
const API = '/api/admin/collections/testimonials';

async function send(url: string, method: string, body?: unknown) {
  const r = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || 'Не удалось сохранить');
  return d;
}

const fmt = (iso: string) => new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

function Stars({ value, onChange }: { value: number; onChange?: (n: number) => void }) {
  return (
    <div className="flex gap-0.5" role={onChange ? 'radiogroup' : undefined} aria-label="Оценка">
      {[1, 2, 3, 4, 5].map((n) =>
        onChange ? (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} из 5`}
            onClick={() => onChange(n)}
            className={cn('px-0.5 text-2xl leading-none transition-colors', n <= value ? 'text-brand-lime' : 'text-light/20 hover:text-light/50')}
          >
            ★
          </button>
        ) : (
          <span key={n} aria-hidden className={cn('text-sm', n <= value ? 'text-brand-lime' : 'text-light/15')}>★</span>
        ),
      )}
    </div>
  );
}

export function ReviewsClient({ initial }: { initial: Review[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const pendingCount = items.filter((r) => !r.published).length;
  const [tab, setTab] = useState<Tab>(pendingCount > 0 ? 'pending' : 'all');
  const [editing, setEditing] = useState<string | null>(null); // 'new' | id
  const [form, setForm] = useState<Form>(EMPTY);
  const [busy, setBusy] = useState(false);

  const shown = useMemo(
    () => items.filter((r) => (tab === 'all' ? true : tab === 'pending' ? !r.published : r.published)),
    [items, tab],
  );

  const open = (r?: Review) => {
    setEditing(r ? r.id : 'new');
    setForm(
      r
        ? { name: r.name, company: r.company ?? '', position: r.position ?? '', photo: r.photo, rating: r.rating || 5, text: r.text, published: r.published }
        : EMPTY,
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const save = async () => {
    if (!form.name.trim()) return toast.error('Укажите имя');
    if (!form.text.trim()) return toast.error('Напишите текст отзыва');
    setBusy(true);
    try {
      const body = { ...form, name: form.name.trim(), company: form.company.trim(), position: form.position.trim(), text: form.text.trim() };
      const local = { ...body, company: body.company || null, position: body.position || null };
      if (editing === 'new') {
        const d = await send(API, 'POST', body);
        setItems((xs) => [{ ...local, id: d.id, fromSite: false, createdAt: new Date().toISOString() }, ...xs]);
        toast.success('Отзыв добавлен');
      } else if (editing) {
        await send(`${API}/${editing}`, 'PATCH', body);
        setItems((xs) => xs.map((r) => (r.id === editing ? { ...r, ...local } : r)));
        toast.success('Отзыв сохранён');
      }
      setEditing(null);
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const togglePublished = async (r: Review) => {
    try {
      await send(`${API}/${r.id}`, 'PATCH', { published: !r.published });
      setItems((xs) => xs.map((x) => (x.id === r.id ? { ...x, published: !r.published } : x)));
      toast.success(r.published ? 'Отзыв снят с сайта' : 'Отзыв опубликован');
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const remove = async (r: Review) => {
    if (!confirm(`Удалить отзыв от «${r.name}»? Это нельзя отменить.`)) return;
    try {
      await send(`${API}/${r.id}`, 'DELETE');
      setItems((xs) => xs.filter((x) => x.id !== r.id));
      if (editing === r.id) setEditing(null);
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'pending', label: 'На проверке', count: pendingCount },
    { key: 'published', label: 'На сайте', count: items.length - pendingCount },
    { key: 'all', label: 'Все', count: items.length },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Reviews"
        title={<>Отзывы</>}
        subtitle="Отзывы с сайта ждут здесь проверки и не видны посетителям, пока вы их не опубликуете."
        action={editing === null && <button onClick={() => open()} className="btn-lime !px-5 !py-2.5 !text-[12px]">+ Добавить отзыв</button>}
      />

      {editing !== null && (
        <div className="rounded-3xl border border-brand-lime/20 bg-white/[0.02] p-5 sm:p-6">
          <p className="mb-5 text-[10px] uppercase tracking-[0.24em] text-brand-orange">
            {editing === 'new' ? 'Новый отзыв' : 'Редактирование отзыва'}
          </p>
          <div className="grid gap-5 md:grid-cols-[240px_1fr]">
            <div className="space-y-5">
              <ImageUpload label="Фото — необязательно" value={form.photo} onChange={(photo) => setForm((f) => ({ ...f, photo }))} />
              <div>
                <label className="label-soft">Оценка</label>
                <Stars value={form.rating} onChange={(rating) => setForm((f) => ({ ...f, rating }))} />
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="label-soft">Имя *</label>
                  <input value={form.name} maxLength={80} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input-glass" />
                </div>
                <div>
                  <label className="label-soft">Компания</label>
                  <input value={form.company} maxLength={80} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} className="input-glass" />
                </div>
                <div>
                  <label className="label-soft">Должность</label>
                  <input value={form.position} maxLength={80} onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))} className="input-glass" />
                </div>
              </div>
              <div>
                <label className="label-soft">Текст отзыва *</label>
                <textarea
                  value={form.text}
                  onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
                  rows={6}
                  maxLength={1500}
                  className="input-glass min-h-[140px]"
                />
              </div>
              <label className="flex cursor-pointer items-center gap-3 text-sm text-light/75">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
                  className="h-4 w-4 accent-[#D4EC4C]"
                />
                Показывать на сайте
              </label>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <button onClick={() => setEditing(null)} className="btn-ghost !px-5 !py-2 !text-[12px]">Отмена</button>
            <button onClick={save} disabled={busy} className="btn-lime !px-5 !py-2 !text-[12px] disabled:opacity-50">
              {busy ? 'Сохраняем…' : editing === 'new' ? 'Добавить отзыв' : 'Сохранить'}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'rounded-full border px-4 py-1.5 text-[12px] transition-colors',
              tab === t.key ? 'border-brand-lime/50 bg-brand-lime/[0.08] text-brand-lime' : 'border-white/10 text-light/55 hover:text-light',
            )}
          >
            {t.label} <span className="ml-1 font-mono text-[11px] opacity-70">{t.count}</span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 p-10 text-center text-sm text-light/50">
          {tab === 'pending'
            ? 'Новых отзывов на проверке нет. Когда посетитель оставит отзыв на сайте, он появится здесь.'
            : tab === 'published'
              ? 'На сайте пока нет ни одного отзыва. Опубликуйте проверенный или добавьте свой.'
              : 'Отзывов пока нет. Их оставляют посетители на странице «Отзывы» — или добавьте первый сами.'}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {shown.map((r) => (
            <article
              key={r.id}
              className={cn(
                'flex flex-col rounded-3xl border bg-white/[0.02] p-5',
                editing === r.id ? 'border-brand-lime/40' : r.published ? 'border-white/[0.06]' : 'border-brand-orange/25',
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <Stars value={r.rating} />
                <span
                  className={cn(
                    'rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-[0.14em]',
                    r.published ? 'border-brand-lime/30 text-brand-lime' : 'border-brand-orange/40 bg-brand-orange/10 text-brand-orange',
                  )}
                >
                  {r.published ? 'на сайте' : 'на проверке'}
                </span>
                <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.14em] text-light/45">
                  {r.fromSite ? 'с сайта' : 'добавлен вручную'}
                </span>
                <span className="ml-auto text-[11px] text-light/35">{fmt(r.createdAt)}</span>
              </div>
              <p className="mt-4 flex-1 whitespace-pre-wrap text-[15px] leading-relaxed text-light/85">{r.text}</p>
              <div className="mt-4 flex items-center gap-3">
                {r.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.photo} alt="" className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-purple/30 font-display text-sm font-extrabold text-brand-lime">
                    {r.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0 text-sm">
                  <div className="truncate font-semibold text-light">{r.name}</div>
                  <div className="truncate text-[12px] text-light/45">{[r.position, r.company].filter(Boolean).join(', ') || '—'}</div>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/[0.05] pt-4 text-[11px] uppercase tracking-[0.14em]">
                <button
                  onClick={() => togglePublished(r)}
                  className={r.published ? 'text-light/60 hover:text-brand-lime' : 'font-semibold text-brand-lime hover:underline'}
                >
                  {r.published ? 'Снять с сайта' : 'Опубликовать'}
                </button>
                <button onClick={() => open(r)} className="text-light/60 hover:text-brand-lime">Изменить</button>
                <button onClick={() => remove(r)} className="ml-auto text-light/35 hover:text-rose-400">Удалить</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
