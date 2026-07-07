'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { ImageUpload } from '@/components/admin/ImageUpload';

export type BlogInput = {
  id?: string;
  title: string;
  slug: string;
  category: string;
  cover: string | null;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  seoTitle: string;
  seoDescription: string;
  ogImage: string | null;
  published: boolean;
};

const EMPTY: BlogInput = {
  title: '', slug: '', category: '', cover: null, excerpt: '', content: '', author: 'mimi',
  date: new Date().toISOString().slice(0, 10), seoTitle: '', seoDescription: '', ogImage: null, published: false,
};

export function BlogForm({ initial }: { initial?: Partial<BlogInput> }) {
  const router = useRouter();
  const [f, setF] = useState<BlogInput>({ ...EMPTY, ...initial });
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof BlogInput>(k: K, v: BlogInput[K]) => setF((p) => ({ ...p, [k]: v }));
  const isEdit = !!f.id;

  const save = async () => {
    if (!f.title.trim()) return toast.error('Введите заголовок');
    setSaving(true);
    try {
      const res = await fetch(isEdit ? `/api/admin/blog/${f.id}` : '/api/admin/blog', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(f),
      });
      if (!res.ok) throw new Error();
      toast.success(isEdit ? 'Статья сохранена' : 'Статья создана');
      router.push('/admin/blog');
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
        <Link href="/admin/blog" className="text-xs uppercase tracking-[0.18em] text-light/45 hover:text-brand-lime">← Блог</Link>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-light/70">
            <input type="checkbox" checked={f.published} onChange={(e) => set('published', e.target.checked)} /> Опубликована
          </label>
          <button onClick={save} disabled={saving} className="btn-lime disabled:opacity-60">{saving ? 'Сохраняем…' : 'Сохранить'}</button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4 rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label-soft">Заголовок</label><input className="input-glass" value={f.title} onChange={(e) => set('title', e.target.value)} /></div>
            <div><label className="label-soft">Slug (авто)</label><input className="input-glass" value={f.slug} onChange={(e) => set('slug', e.target.value)} /></div>
            <div><label className="label-soft">Категория</label><input className="input-glass" value={f.category} onChange={(e) => set('category', e.target.value)} placeholder="Маркетинг / Кейсы / Советы" /></div>
            <div><label className="label-soft">Автор</label><input className="input-glass" value={f.author} onChange={(e) => set('author', e.target.value)} /></div>
            <div><label className="label-soft">Дата</label><input type="date" className="input-glass" value={f.date} onChange={(e) => set('date', e.target.value)} /></div>
          </div>
          <div><label className="label-soft">Краткое описание (excerpt)</label><textarea className="input-glass min-h-[60px]" value={f.excerpt} onChange={(e) => set('excerpt', e.target.value)} /></div>
          <div>
            <label className="label-soft">Контент (Markdown)</label>
            <textarea className="input-glass min-h-[340px] font-mono text-[13px]" value={f.content} onChange={(e) => set('content', e.target.value)} placeholder="# Заголовок&#10;&#10;Текст статьи в **Markdown**…" />
          </div>
        </div>

        <div className="space-y-5 rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6">
          <ImageUpload label="Обложка" value={f.cover} onChange={(u) => set('cover', u)} />
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
