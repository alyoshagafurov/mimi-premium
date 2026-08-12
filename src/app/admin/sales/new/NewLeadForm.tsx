'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/admin/PageHeader';
import { SALES_STATUSES, SALES_STATUS_LABEL, PACKAGES, PACKAGE_LABEL } from '@/lib/roles';
import { cn } from '@/lib/utils';

const EMPTY = {
  firstName: '', lastName: '', phone: '', email: '',
  businessName: '', niche: '',
  salesStatus: 'NEW_LEAD' as string,
  packageType: 'NONE' as string,
  sourceType: 'VIDEO' as 'VIDEO' | 'OTHER',
  sourceUrl: '', sourceNote: '',
  comment: '',
  assignedToId: '',
};

export function NewLeadForm({
  reps,
  meId,
  canAssign,
}: {
  reps: { id: string; name: string }[];
  meId: string;
  canAssign: boolean;
}) {
  const router = useRouter();
  const [f, setF] = useState({ ...EMPTY, assignedToId: meId });
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  const save = async () => {
    if (!f.firstName.trim()) return toast.error('Укажите имя лида');
    if (f.sourceType === 'VIDEO' && !f.sourceUrl.trim()) return toast.error('Вставьте ссылку на видео');
    if (f.sourceType === 'OTHER' && !f.sourceNote.trim()) return toast.error('Укажите источник лида');
    setBusy(true);
    const r = await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(f),
    });
    setBusy(false);
    if (r.ok) {
      const { id } = await r.json();
      toast.success('Лид добавлен');
      router.push(`/admin/sales/${id}`);
    } else {
      const d = await r.json().catch(() => ({}));
      toast.error(d.error || 'Не удалось добавить лид');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/sales" className="text-xs uppercase tracking-[0.18em] text-light/45 hover:text-brand-lime">
          ← Продажи
        </Link>
      </div>
      <PageHeader eyebrow="CRM" title={<>Новый лид</>} subtitle="Контакты, источник и первые заметки по лиду." />

      <div className="grid gap-5 lg:grid-cols-2">
        {/* ── Контакты ── */}
        <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6">
          <p className="mb-4 text-[10px] uppercase tracking-[0.24em] text-brand-orange">Контакт</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-soft">Имя *</label>
              <input className="input-glass" value={f.firstName} onChange={set('firstName')} />
            </div>
            <div>
              <label className="label-soft">Фамилия</label>
              <input className="input-glass" value={f.lastName} onChange={set('lastName')} />
            </div>
            <div>
              <label className="label-soft">Телефон</label>
              <input className="input-glass" value={f.phone} onChange={set('phone')} placeholder="+992 …" />
            </div>
            <div>
              <label className="label-soft">Email</label>
              <input className="input-glass" type="email" value={f.email} onChange={set('email')} />
            </div>
            <div>
              <label className="label-soft">Бизнес</label>
              <input className="input-glass" value={f.businessName} onChange={set('businessName')} />
            </div>
            <div>
              <label className="label-soft">Ниша</label>
              <input className="input-glass" value={f.niche} onChange={set('niche')} />
            </div>
          </div>
        </div>

        {/* ── Источник ── */}
        <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6">
          <p className="mb-4 text-[10px] uppercase tracking-[0.24em] text-brand-orange">Откуда пришёл лид</p>

          <div className="mb-4 flex gap-2">
            {(['VIDEO', 'OTHER'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setF((p) => ({ ...p, sourceType: s }))}
                className={cn(
                  'rounded-full border px-4 py-2 text-[11px] transition',
                  f.sourceType === s
                    ? 'border-brand-lime bg-brand-lime text-[#0A0712]'
                    : 'border-white/10 text-light/55 hover:text-light',
                )}
              >
                {s === 'VIDEO' ? 'Из видео' : 'Другой источник'}
              </button>
            ))}
          </div>

          {f.sourceType === 'VIDEO' ? (
            <div className="space-y-3">
              <div>
                <label className="label-soft">Ссылка на видео (Instagram / Reels)</label>
                <input
                  className="input-glass"
                  value={f.sourceUrl}
                  onChange={set('sourceUrl')}
                  placeholder="https://www.instagram.com/reel/…"
                />
              </div>
              <p className="text-[11px] leading-relaxed text-light/40">
                Обложку загружать не нужно — она подтянется с этой ссылки автоматически
                и будет показана в карточке лида. По клику откроется само видео.
              </p>
            </div>
          ) : (
            <div>
              <label className="label-soft">Источник</label>
              <input
                className="input-glass"
                value={f.sourceNote}
                onChange={set('sourceNote')}
                placeholder="Реклама, рекомендация, WhatsApp, звонок…"
              />
            </div>
          )}
        </div>

        {/* ── Статус ── */}
        <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6">
          <p className="mb-4 text-[10px] uppercase tracking-[0.24em] text-brand-orange">Статус</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-soft">Статус в воронке</label>
              <select className="input-glass" value={f.salesStatus} onChange={set('salesStatus')}>
                {SALES_STATUSES.map((s) => <option key={s} value={s}>{SALES_STATUS_LABEL[s]}</option>)}
              </select>
            </div>
            <div>
              <label className="label-soft">Пакет</label>
              <select className="input-glass" value={f.packageType} onChange={set('packageType')}>
                {PACKAGES.map((p) => <option key={p} value={p}>{PACKAGE_LABEL[p]}</option>)}
              </select>
            </div>
            {canAssign && (
              <div className="col-span-2">
                <label className="label-soft">Ответственный продажник</label>
                <select className="input-glass" value={f.assignedToId} onChange={set('assignedToId')}>
                  {reps.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* ── Заметка ── */}
        <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6">
          <p className="mb-4 text-[10px] uppercase tracking-[0.24em] text-brand-orange">Первая заметка</p>
          <textarea
            className="input-glass min-h-[140px]"
            value={f.comment}
            onChange={set('comment')}
            placeholder="Что обсудили, что нужно клиенту, договорённости…"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Link href="/admin/sales" className="btn-ghost">Отмена</Link>
        <button onClick={save} disabled={busy} className="btn-lime disabled:opacity-60">
          {busy ? 'Сохраняем…' : 'Сохранить лид'}
        </button>
      </div>
    </div>
  );
}
