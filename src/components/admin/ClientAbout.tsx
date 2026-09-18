'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

/**
 * «Описание проекта» — биография клиента, которую пишет команда, а клиент
 * видит у себя в кабинете. Это не внутренние заметки: их клиент не видит.
 */
export function ClientAbout({
  value,
  endpoint,
  canEdit = true,
}: {
  value: string;
  /** PATCH-эндпоинт: /api/clients/[id] в карточке проекта, /api/sales/[id] в карточке лида. */
  endpoint: string;
  canEdit?: boolean;
}) {
  const router = useRouter();
  const [text, setText] = useState(value);
  const [busy, setBusy] = useState(false);
  const dirty = text.trim() !== value.trim();

  const save = async () => {
    setBusy(true);
    try {
      const r = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: text.trim() }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'Не удалось сохранить описание');
      toast.success('Описание сохранено');
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!canEdit) {
    return (
      <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6">
        <p className="mb-3 text-[10px] uppercase tracking-[0.24em] text-brand-orange">Описание проекта</p>
        {text.trim() ? (
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-light/85">{text}</p>
        ) : (
          <p className="text-sm text-light/45">Описание ещё не заполнено.</p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-brand-orange">Описание проекта</p>
          <h2 className="mt-2 font-display text-xl font-extrabold tracking-tight text-light">Биография клиента</h2>
        </div>
        <span className="rounded-full border border-brand-lime/30 px-3 py-1 text-[11px] text-brand-lime">
          видно клиенту в кабинете
        </span>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        maxLength={4000}
        placeholder="Чем занимается клиент, что было до нас, что делаем сейчас, к чему идём. Этот текст читает сам клиент — пишите так, как сказали бы ему в лицо."
        className="input-glass min-h-[150px] resize-y leading-relaxed"
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[12px] text-light/45">Внутренние заметки остаются внутренними — сюда они не попадают.</p>
        <div className="flex items-center gap-2">
          {dirty && (
            <button type="button" onClick={() => setText(value)} className="btn-ghost !px-4 !py-2 !text-[11px]">
              Отменить
            </button>
          )}
          <button
            type="button"
            onClick={save}
            disabled={busy || !dirty}
            className="btn-lime !px-5 !py-2 !text-[12px] disabled:opacity-40"
          >
            {busy ? 'Сохраняем…' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
}
