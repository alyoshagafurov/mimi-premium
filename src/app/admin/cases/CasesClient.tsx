'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/admin/PageHeader';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { cn } from '@/lib/utils';

type Case = {
  id: string; slug: string; title: string; description: string;
  logo: string | null; coverImage: string | null; instagramUrl: string | null; published: boolean;
};
type Form = { title: string; description: string; logo: string | null; instagramUrl: string; published: boolean };

const EMPTY: Form = { title: '', description: '', logo: null, instagramUrl: '', published: true };

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

function CaseLogo({ c }: { c: Pick<Case, 'logo' | 'coverImage' | 'title'> }) {
  const src = c.logo || c.coverImage;
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className="h-12 w-12 shrink-0 rounded-2xl border border-white/10 bg-white/[0.04] object-contain p-1" />
  ) : (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-purple/30 font-display text-lg font-extrabold text-brand-lime">
      {c.title.trim().charAt(0).toUpperCase() || '·'}
    </span>
  );
}

export function CasesClient({ initial }: { initial: Case[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<string | null>(null); // 'new' | id
  const [form, setForm] = useState<Form>(EMPTY);
  const [busy, setBusy] = useState(false);

  const open = (c?: Case) => {
    setEditing(c ? c.id : 'new');
    setForm(c ? { title: c.title, description: c.description, logo: c.logo, instagramUrl: c.instagramUrl ?? '', published: c.published } : EMPTY);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const save = async () => {
    if (!form.title.trim()) return toast.error('Укажите название кейса');
    setBusy(true);
    try {
      const body = { ...form, title: form.title.trim(), description: form.description.trim() };
      if (editing === 'new') {
        const d = await send('/api/admin/cases', 'POST', body);
        setItems((xs) => [{ ...body, id: d.id, slug: d.slug, coverImage: null, instagramUrl: body.instagramUrl || null }, ...xs]);
        toast.success('Кейс добавлен');
      } else if (editing) {
        await send(`/api/admin/cases/${editing}`, 'PATCH', body);
        setItems((xs) => xs.map((c) => (c.id === editing ? { ...c, ...body, instagramUrl: body.instagramUrl || null } : c)));
        toast.success('Кейс сохранён');
      }
      setEditing(null);
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const togglePublished = async (c: Case) => {
    try {
      await send(`/api/admin/cases/${c.id}`, 'PATCH', { published: !c.published });
      setItems((xs) => xs.map((x) => (x.id === c.id ? { ...x, published: !c.published } : x)));
      toast.success(c.published ? 'Кейс скрыт с сайта' : 'Кейс опубликован');
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const remove = async (c: Case) => {
    if (!confirm(`Удалить кейс «${c.title}»? Это нельзя отменить.`)) return;
    try {
      await send(`/api/admin/cases/${c.id}`, 'DELETE');
      setItems((xs) => xs.filter((x) => x.id !== c.id));
      if (editing === c.id) setEditing(null);
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const live = items.filter((c) => c.published).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Cases"
        title={<>Кейсы</>}
        subtitle={`Логотип, название, описание и ссылка на Instagram. На сайте сейчас ${live} из ${items.length}.`}
        action={
          editing === null && (
            <button onClick={() => open()} className="btn-lime !px-5 !py-2.5 !text-[12px]">+ Новый кейс</button>
          )
        }
      />

      {editing !== null && (
        <div className="rounded-3xl border border-brand-lime/20 bg-white/[0.02] p-5 sm:p-6">
          <p className="mb-5 text-[10px] uppercase tracking-[0.24em] text-brand-orange">
            {editing === 'new' ? 'Новый кейс' : 'Редактирование'}
          </p>
          <div className="grid gap-5 md:grid-cols-[240px_1fr]">
            <ImageUpload label="Логотип" value={form.logo} onChange={(logo) => setForm((f) => ({ ...f, logo }))} />
            <div className="space-y-4">
              <div>
                <label className="label-soft">Название *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Например: Спортивный магазин — +2459% ROMI"
                  maxLength={140}
                  className="input-glass"
                />
              </div>
              <div>
                <label className="label-soft">Описание</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Что было, что сделали, какой результат"
                  rows={5}
                  className="input-glass min-h-[120px]"
                />
              </div>
              <div>
                <label className="label-soft">Ссылка на Instagram — если есть</label>
                <input
                  value={form.instagramUrl}
                  onChange={(e) => setForm((f) => ({ ...f, instagramUrl: e.target.value }))}
                  placeholder="https://instagram.com/p/… или @account"
                  inputMode="url"
                  className="input-glass"
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
              {busy ? 'Сохраняем…' : editing === 'new' ? 'Добавить кейс' : 'Сохранить'}
            </button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 p-10 text-center">
          <p className="font-display text-xl font-extrabold text-light">Кейсов пока нет</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-light/50">
            Добавьте первый: логотип клиента, название и пару предложений о результате. Он сразу появится на странице «Кейсы».
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((c) => (
            <article
              key={c.id}
              className={cn(
                'flex flex-col rounded-3xl border bg-white/[0.02] p-5 transition-colors',
                editing === c.id ? 'border-brand-lime/40' : 'border-white/[0.06]',
              )}
            >
              <div className="flex items-start gap-4">
                <CaseLogo c={c} />
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-lg font-extrabold leading-tight text-light">{c.title}</h3>
                  <span
                    className={cn(
                      'mt-2 inline-block rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-[0.14em]',
                      c.published ? 'border-brand-lime/30 text-brand-lime' : 'border-white/10 text-light/45',
                    )}
                  >
                    {c.published ? 'на сайте' : 'скрыт'}
                  </span>
                </div>
              </div>
              <div className="mt-4 flex-1">
                <p className="line-clamp-3 text-sm leading-relaxed text-light/60">{c.description || 'Без описания'}</p>
                {c.instagramUrl && (
                  <a href={c.instagramUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-[12px] text-brand-lime hover:underline">
                    Instagram →
                  </a>
                )}
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/[0.05] pt-4 text-[11px] uppercase tracking-[0.14em]">
                <button onClick={() => open(c)} className="text-light/60 hover:text-brand-lime">Изменить</button>
                <button onClick={() => togglePublished(c)} className="text-light/60 hover:text-brand-lime">
                  {c.published ? 'Скрыть' : 'Опубликовать'}
                </button>
                {c.published && (
                  <a href={`/cases/${c.slug}`} target="_blank" rel="noreferrer" className="text-light/60 hover:text-brand-lime">
                    На сайте ↗
                  </a>
                )}
                <button onClick={() => remove(c)} className="ml-auto text-light/35 hover:text-rose-400">Удалить</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
