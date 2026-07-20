'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

/** Tech spec (ТЗ) — read-only for staff, editable by admin / ops director. */
export function TechSpec({ clientId, value, canEdit }: { clientId: string; value: string; canEdit: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch(`/api/sales/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ techSpec: text }),
      });
      if (!r.ok) throw new Error();
      toast.success('ТЗ сохранено');
      setEditing(false);
      router.refresh();
    } catch {
      toast.error('Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.24em] text-brand-orange">Техническое задание</p>
        {canEdit && !editing && (
          <button onClick={() => setEditing(true)} className="text-[11px] uppercase tracking-[0.14em] text-light/50 hover:text-brand-lime">
            {value ? 'Изменить' : 'Заполнить'}
          </button>
        )}
      </div>

      {editing ? (
        <>
          <textarea
            className="input-glass min-h-[220px] font-mono text-[13px]"
            placeholder="Опишите задачу: что делаем, стек, сроки, ссылки на макеты…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="mt-4 flex justify-end gap-3">
            <button onClick={() => { setEditing(false); setText(value); }} className="btn-ghost">Отмена</button>
            <button onClick={save} disabled={saving} className="btn-lime disabled:opacity-60">{saving ? 'Сохраняем…' : 'Сохранить'}</button>
          </div>
        </>
      ) : value ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-light/75">{value}</p>
      ) : (
        <p className="text-sm text-light/40">
          ТЗ ещё не заполнено{canEdit ? '.' : ' — его заполняет админ или операционный директор.'}
        </p>
      )}
    </div>
  );
}
