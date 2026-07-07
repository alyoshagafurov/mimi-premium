'use client';

import { useRef, useState } from 'react';
import toast from 'react-hot-toast';

async function upload(file: File): Promise<string | null> {
  if (file.size > 5 * 1024 * 1024) {
    toast.error('Файл больше 5 MB');
    return null;
  }
  const form = new FormData();
  form.append('file', file);
  const r = await fetch('/api/admin/upload', { method: 'POST', body: form });
  if (!r.ok) {
    toast.error('Не удалось загрузить изображение');
    return null;
  }
  const d = await r.json();
  return d.url as string;
}

/** Single image field. */
export function ImageUpload({
  value,
  onChange,
  label = 'Изображение',
}: {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  label?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div>
      <label className="label-soft">{label}</label>
      <div className="mt-1 flex items-center gap-4">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-16 w-16 rounded-xl border border-white/10 object-cover" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-white/15 text-light/30">
            ⬒
          </div>
        )}
        <input
          ref={ref}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setBusy(true);
            const url = await upload(f);
            setBusy(false);
            if (url) onChange(url);
            if (ref.current) ref.current.value = '';
          }}
        />
        <div className="flex gap-2">
          <button type="button" onClick={() => ref.current?.click()} disabled={busy} className="btn-ghost !py-2 !text-[11px] disabled:opacity-50">
            {busy ? 'Загрузка…' : value ? 'Заменить' : 'Загрузить'}
          </button>
          {value && (
            <button type="button" onClick={() => onChange(null)} className="text-[11px] uppercase tracking-[0.14em] text-light/40 hover:text-rose-400">
              удалить
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Multiple images (gallery) field. */
export function GalleryUpload({
  value,
  onChange,
  label = 'Галерея',
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  label?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div>
      <label className="label-soft">{label}</label>
      <div className="mt-1 flex flex-wrap gap-3">
        {value.map((url) => (
          <div key={url} className="group relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-20 w-20 rounded-xl border border-white/10 object-cover" />
            <button
              type="button"
              onClick={() => onChange(value.filter((u) => u !== url))}
              className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[11px] text-white opacity-0 transition group-hover:opacity-100"
              aria-label="Удалить изображение"
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={busy}
          className="flex h-20 w-20 items-center justify-center rounded-xl border border-dashed border-white/15 text-light/40 hover:border-brand-lime/40 hover:text-brand-lime disabled:opacity-50"
        >
          {busy ? '…' : '+'}
        </button>
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? []);
          if (!files.length) return;
          setBusy(true);
          const urls: string[] = [];
          for (const f of files) {
            const url = await upload(f);
            if (url) urls.push(url);
          }
          setBusy(false);
          onChange([...value, ...urls]);
          if (ref.current) ref.current.value = '';
        }}
      />
    </div>
  );
}
