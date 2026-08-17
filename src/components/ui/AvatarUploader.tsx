'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { UserAvatar } from './UserAvatar';

/** Upload / change / remove the current user's profile photo. */
export function AvatarUploader({ name, avatar }: { name: string; avatar: string | null }) {
  const router = useRouter();
  const { update } = useSession();
  const [current, setCurrent] = useState<string | null>(avatar);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setBusy(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const r = await fetch('/api/avatar', { method: 'POST', body: form });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Не удалось загрузить');
      setCurrent(data.url);
      toast.success('Фото обновлено');
      await update();   // подтянуть новое фото в сессию
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      const r = await fetch('/api/avatar', { method: 'DELETE' });
      if (!r.ok) throw new Error();
      setCurrent(null);
      toast.success('Фото удалено');
      await update();
      router.refresh();
    } catch {
      toast.error('Не удалось удалить');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <UserAvatar name={name} avatar={current} size={72} />
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="rounded-full border border-brand-lime/40 bg-brand-lime/[0.08] px-4 py-2 text-[12px] font-medium text-brand-lime transition hover:bg-brand-lime/[0.15] disabled:opacity-50"
          >
            {busy ? 'Загрузка…' : current ? 'Изменить фото' : 'Загрузить фото'}
          </button>
          {current && (
            <button
              type="button"
              onClick={remove}
              disabled={busy}
              className="rounded-full border border-white/10 px-4 py-2 text-[12px] text-light/55 transition hover:border-rose-400/40 hover:text-rose-400 disabled:opacity-50"
            >
              Удалить
            </button>
          )}
        </div>
        <p className="text-[11px] text-light/40">JPG, PNG или WebP, до 4 МБ. По умолчанию — буква имени.</p>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = '';
        }}
      />
    </div>
  );
}
