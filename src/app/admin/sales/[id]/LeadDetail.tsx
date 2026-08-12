'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/admin/PageHeader';
import {
  SALES_STATUSES, SALES_STATUS_LABEL, PACKAGES, PACKAGE_LABEL,
  type SalesStatus, type ClientPackage,
} from '@/lib/roles';

type Lead = {
  id: string; firstName: string; lastName: string; contactName: string;
  businessName: string; niche: string; phone: string; email: string;
  salesStatus: SalesStatus; packageType: ClientPackage;
  sourceType: 'VIDEO' | 'OTHER';
  sourceUrl: string | null; sourceCover: string | null; sourceNote: string | null;
  comment: string;
  createdByName: string | null; assignedToId: string; assignedToName: string | null;
  reminderAt: string | null; reminderNote: string; createdAt: string;
};
type Note = { id: string; body: string; author: string; createdAt: string };

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-white/[0.05] py-3 last:border-0 sm:flex-row sm:gap-4">
      <span className="w-36 shrink-0 text-[11px] uppercase tracking-[0.16em] text-light/40">{label}</span>
      <span className="text-sm text-light/85">{value || '—'}</span>
    </div>
  );
}

export function LeadDetail({
  lead,
  notes: initialNotes,
  reps,
}: {
  lead: Lead;
  notes: Note[];
  reps: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [status, setStatus] = useState(lead.salesStatus);
  const [pkg, setPkg] = useState(lead.packageType);
  const [owner, setOwner] = useState(lead.assignedToId);
  const [saving, setSaving] = useState(false);

  const patch = async (body: any, msg: string) => {
    setSaving(true);
    const r = await fetch(`/api/sales/${lead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (r.ok) { toast.success(msg); router.refresh(); return true; }
    const d = await r.json().catch(() => ({}));
    toast.error(d.error || 'Не удалось сохранить');
    return false;
  };

  const addNote = async () => {
    const text = draft.trim();
    if (!text) return;
    setPosting(true);
    const r = await fetch(`/api/projects/${lead.id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: text }),
    });
    setPosting(false);
    if (r.ok) {
      const note = (await r.json()) as Note;
      setNotes((xs) => [note, ...xs]);
      setDraft('');
    } else toast.error('Не удалось добавить заметку');
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/sales" className="text-xs uppercase tracking-[0.18em] text-light/45 hover:text-brand-lime">
          ← Продажи
        </Link>
      </div>
      <PageHeader
        eyebrow="Лид"
        title={<>{lead.contactName}</>}
        subtitle={`${lead.businessName} · ${lead.niche}`}
      />

      <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
        {/* ── ЛЕВО: информация о лиде ── */}
        <div className="space-y-5">
          <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6">
            <p className="mb-4 text-[10px] uppercase tracking-[0.24em] text-brand-orange">Информация</p>
            <Row label="Имя" value={lead.firstName || lead.contactName} />
            <Row label="Фамилия" value={lead.lastName} />
            <Row
              label="Телефон"
              value={lead.phone ? <a href={`tel:${lead.phone}`} className="font-mono text-brand-lime">{lead.phone}</a> : ''}
            />
            <Row
              label="Email"
              value={lead.email.endsWith('@lead.mimitj.agency') ? '—' : <a href={`mailto:${lead.email}`} className="text-brand-lime">{lead.email}</a>}
            />
            <Row label="Бизнес" value={lead.businessName} />
            <Row label="Ниша" value={lead.niche} />
            <Row label="Добавлен" value={fmt(lead.createdAt)} />
            <Row label="Кто добавил" value={lead.createdByName} />
          </div>

          {/* ── Источник: обложка видео или текст ── */}
          <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6">
            <p className="mb-4 text-[10px] uppercase tracking-[0.24em] text-brand-orange">Откуда пришёл</p>
            {lead.sourceType === 'VIDEO' && lead.sourceUrl ? (
              <a
                href={lead.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-4 rounded-2xl border border-white/[0.06] p-3 transition hover:border-brand-lime/40"
              >
                {lead.sourceCover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={lead.sourceCover} alt="" className="h-28 w-28 shrink-0 rounded-xl object-cover" />
                ) : (
                  <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-xl border border-dashed border-white/15 text-[11px] text-light/35">
                    без обложки
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-sm font-medium text-light group-hover:text-brand-lime">Видео, с которого пришёл лид</div>
                  <div className="mt-1 text-[11px] text-light/40">Нажмите, чтобы открыть видео →</div>
                </div>
              </a>
            ) : (
              <p className="text-sm text-light/85">{lead.sourceNote || '—'}</p>
            )}
          </div>

          {/* ── Статус / пакет / передача лида ── */}
          <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6">
            <p className="mb-4 text-[10px] uppercase tracking-[0.24em] text-brand-orange">Работа с лидом</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label-soft">Статус</label>
                <select
                  className="input-glass"
                  value={status}
                  onChange={(e) => { const v = e.target.value as SalesStatus; setStatus(v); patch({ salesStatus: v }, 'Статус обновлён'); }}
                >
                  {SALES_STATUSES.map((s) => <option key={s} value={s}>{SALES_STATUS_LABEL[s]}</option>)}
                </select>
              </div>
              <div>
                <label className="label-soft">Пакет</label>
                <select
                  className="input-glass"
                  value={pkg}
                  onChange={(e) => { const v = e.target.value as ClientPackage; setPkg(v); patch({ packageType: v }, 'Пакет обновлён'); }}
                >
                  {PACKAGES.map((p) => <option key={p} value={p}>{PACKAGE_LABEL[p]}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="label-soft">Ответственный продажник</label>
                <select
                  className="input-glass"
                  value={owner}
                  disabled={saving}
                  onChange={(e) => {
                    const v = e.target.value;
                    const prev = owner;
                    setOwner(v);
                    patch({ assignedToId: v }, 'Лид передан').then((ok) => { if (!ok) setOwner(prev); });
                  }}
                >
                  {reps.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <p className="mt-2 text-[11px] text-light/40">
                  При передаче все заметки остаются — новый продажник видит всю историю.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── ПРАВО: заметки продажников ── */}
        <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6">
          <p className="mb-4 text-[10px] uppercase tracking-[0.24em] text-brand-orange">Заметки продажников</p>

          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            placeholder="Что обсудили, договорённости, следующий шаг…"
            className="input-glass min-h-[84px]"
          />
          <button onClick={addNote} disabled={posting || !draft.trim()} className="btn-lime mt-3 w-full !text-[12px] disabled:opacity-50">
            {posting ? 'Добавляем…' : 'Добавить заметку'}
          </button>

          {lead.comment && (
            <div className="mt-5 rounded-2xl border border-white/[0.05] bg-white/[0.02] px-4 py-3">
              <div className="mb-1 text-[11px] text-light/40">Первая заметка</div>
              <p className="whitespace-pre-wrap text-sm text-light/85">{lead.comment}</p>
            </div>
          )}

          <div className="mt-4 max-h-[520px] space-y-3 overflow-y-auto pr-1">
            {notes.length === 0 && <p className="text-sm text-light/40">Заметок пока нет.</p>}
            {notes.map((n) => (
              <div key={n.id} className="rounded-2xl border border-white/[0.05] bg-white/[0.02] px-4 py-3">
                <div className="mb-1 flex items-center gap-2 text-[11px] text-light/40">
                  <span className="text-light/70">{n.author}</span>
                  <span>·</span>
                  <span>{fmt(n.createdAt)}</span>
                </div>
                <p className="whitespace-pre-wrap text-sm text-light/85">{n.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
