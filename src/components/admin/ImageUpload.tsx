'use client';

import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { MediaPicker } from './MediaPicker';

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
  const [picker, setPicker] = useState(false);

  return (
    <div>
      {picker && <MediaPicker onPick={(url) => onChange(url)} onClose={() => setPicker(false)} />}
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
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => ref.current?.click()} disabled={busy} className="btn-ghost !py-2 !text-[11px] disabled:opacity-50">
            {busy ? 'Загрузка…' : value ? 'Заменить' : 'Загрузить'}
          </button>
          <button type="button" onClick={() => setPicker(true)} className="btn-ghost !py-2 !text-[11px]">
            Библиотека
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

/**
 * Несколько фото (галерея). Файлы грузятся параллельно; пока идёт загрузка,
 * о ней сообщается наружу (onBusyChange) — форма блокирует «Сохранить».
 * Если за время загрузки форму закрыли или открыли другой кейс, результат
 * отбрасывается, чтобы фото не попали не туда.
 */
export function GalleryUpload({
  value,
  onChange,
  onBusyChange,
  max = 40,
  label = 'Галерея',
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  onBusyChange?: (busy: boolean) => void;
  max?: number;
  label?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  // Всегда актуальный список: пока фото грузятся, админ может удалить другие.
  const latest = useRef(value);
  latest.current = value;
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);
  const left = Math.max(0, max - value.length);

  const setLoading = (v: boolean) => {
    setBusy(v);
    onBusyChange?.(v);
  };

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
              onClick={() => onChange(latest.current.filter((u) => u !== url))}
              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-[12px] text-[#fff] shadow transition hover:scale-110"
              aria-label="Удалить изображение"
            >
              ×
            </button>
          </div>
        ))}
        {left > 0 && (
          <button
            type="button"
            onClick={() => ref.current?.click()}
            disabled={busy}
            aria-label="Добавить фото"
            className="flex h-20 w-20 items-center justify-center rounded-xl border border-dashed border-white/15 text-light/40 hover:border-brand-lime/40 hover:text-brand-lime disabled:opacity-50"
          >
            {busy ? '…' : '+'}
          </button>
        )}
      </div>
      {busy && <p className="mt-2 text-[12px] text-brand-orange">Загружаем фото… Сохранить можно после загрузки.</p>}
      {left === 0 && <p className="mt-2 text-[12px] text-light/50">Максимум {max} фото — чтобы добавить новые, удалите лишние.</p>}
      <input
        ref={ref}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={async (e) => {
          const picked = Array.from(e.target.files ?? []);
          if (ref.current) ref.current.value = '';
          if (!picked.length) return;
          const files = picked.slice(0, left);
          if (picked.length > files.length) toast.error(`Можно добавить ещё ${left} фото — лишние пропущены`);
          setLoading(true);
          const urls = (await Promise.all(files.map((f) => upload(f)))).filter((u): u is string => !!u);
          if (!alive.current) return; // форму закрыли или открыли другой кейс
          setLoading(false);
          onChange([...latest.current, ...urls].slice(0, max));
        }}
      />
    </div>
  );
}
