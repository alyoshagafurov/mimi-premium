'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { ImageUpload, GalleryUpload } from '@/components/admin/ImageUpload';
import { useDraft } from '@/lib/useDraft';

export type CaseInput = {
  id?: string;
  title: string;
  slug: string;
  category: string;
  clientName: string;
  description: string;
  task: string;
  solution: string;
  result: string;
  achievements: string[];
  coverImage: string | null;
  images: string[];
  date: string; // yyyy-mm-dd
  seoTitle: string;
  seoDescription: string;
  ogImage: string | null;
  published: boolean;
  sortOrder: number;
};

const EMPTY: CaseInput = {
  title: '', slug: '', category: '', clientName: '', description: '', task: '', solution: '', result: '',
  achievements: [], coverImage: null, images: [], date: new Date().toISOString().slice(0, 10),
  seoTitle: '', seoDescription: '', ogImage: null, published: false, sortOrder: 0,
};

export function CaseForm({ initial }: { initial?: Partial<CaseInput> }) {
  const router = useRouter();
  const isEdit = !!initial?.id;
  const [f, setF, draft] = useDraft<CaseInput>('draft:case:new', { ...EMPTY, ...initial }, !isEdit);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof CaseInput>(k: K, v: CaseInput[K]) => setF((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!f.title.trim()) return toast.error('Введите название');
    setSaving(true);
    try {
      const res = await fetch(isEdit ? `/api/admin/cases/${f.id}` : '/api/admin/cases', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(f),
      });
      if (!res.ok) throw new Error();
      draft.clear();
      toast.success(isEdit ? 'Кейс сохранён' : 'Кейс создан');
      router.push('/admin/cases');
      router.refresh();
    } catch {
      toast.error('Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/admin/cases" className="text-xs uppercase tracking-[0.18em] text-light/45 hover:text-brand-lime">← Кейсы</Link>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-light/70">
            <input type="checkbox" checked={f.published} onChange={(e) => set('published', e.target.checked)} />
            Опубликован
          </label>
          <button onClick={save} disabled={saving} className="btn-lime disabled:opacity-60">
            {saving ? 'Сохраняем…' : 'Сохранить'}
          </button>
        </div>
      </div>

      {draft.restored && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-brand-orange/25 bg-brand-orange/[0.05] px-4 py-3 text-sm text-light/70">
          <span>Восстановлен несохранённый черновик (автосохранение).</span>
          <button onClick={() => { draft.clear(); setF({ ...EMPTY }); }} className="ml-auto text-[11px] uppercase tracking-[0.14em] text-brand-orange hover:opacity-70">Начать заново</button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4 rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label-soft">Название</label><input className="input-glass" value={f.title} onChange={(e) => set('title', e.target.value)} /></div>
            <div><label className="label-soft">Slug (авто, если пусто)</label><input className="input-glass" value={f.slug} onChange={(e) => set('slug', e.target.value)} placeholder="avto-iz-nazvaniya" /></div>
            <div><label className="label-soft">Категория</label><input className="input-glass" value={f.category} onChange={(e) => set('category', e.target.value)} placeholder="Таргет / SMM / Брендинг" /></div>
            <div><label className="label-soft">Клиент</label><input className="input-glass" value={f.clientName} onChange={(e) => set('clientName', e.target.value)} /></div>
            <div><label className="label-soft">Дата</label><input type="date" className="input-glass" value={f.date} onChange={(e) => set('date', e.target.value)} /></div>
            <div><label className="label-soft">Порядок</label><input type="number" className="input-glass" value={f.sortOrder} onChange={(e) => set('sortOrder', Number(e.target.value))} /></div>
          </div>
          <div><label className="label-soft">Описание (кратко)</label><textarea className="input-glass min-h-[70px]" value={f.description} onChange={(e) => set('description', e.target.value)} /></div>
          <div><label className="label-soft">Задача</label><textarea className="input-glass min-h-[70px]" value={f.task} onChange={(e) => set('task', e.target.value)} /></div>
          <div><label className="label-soft">Решение</label><textarea className="input-glass min-h-[70px]" value={f.solution} onChange={(e) => set('solution', e.target.value)} /></div>
          <div><label className="label-soft">Результат</label><textarea className="input-glass min-h-[70px]" value={f.result} onChange={(e) => set('result', e.target.value)} /></div>

          <div>
            <label className="label-soft">Достижения</label>
            <div className="space-y-2">
              {f.achievements.map((a, i) => (
                <div key={i} className="flex gap-2">
                  <input className="input-glass !py-2" value={a} onChange={(e) => set('achievements', f.achievements.map((x, j) => (j === i ? e.target.value : x)))} />
                  <button type="button" onClick={() => set('achievements', f.achievements.filter((_, j) => j !== i))} className="text-light/40 hover:text-rose-400">×</button>
                </div>
              ))}
              <button type="button" onClick={() => set('achievements', [...f.achievements, ''])} className="text-[11px] uppercase tracking-[0.14em] text-brand-lime hover:text-brand-limeSoft">+ достижение</button>
            </div>
          </div>
        </div>

        <div className="space-y-5 rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6">
          <ImageUpload label="Обложка" value={f.coverImage} onChange={(u) => set('coverImage', u)} />
          <GalleryUpload label="Галерея" value={f.images} onChange={(u) => set('images', u)} />
          <div className="border-t border-white/[0.06] pt-4">
            <p className="mb-3 text-[10px] uppercase tracking-[0.24em] text-brand-orange">SEO</p>
            <div className="space-y-3">
              <div><label className="label-soft">SEO title</label><input className="input-glass" value={f.seoTitle} onChange={(e) => set('seoTitle', e.target.value)} /></div>
              <div><label className="label-soft">SEO description</label><textarea className="input-glass min-h-[60px]" value={f.seoDescription} onChange={(e) => set('seoDescription', e.target.value)} /></div>
              <ImageUpload label="OG image" value={f.ogImage} onChange={(u) => set('ogImage', u)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
