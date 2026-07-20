'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/admin/PageHeader';
import { cn } from '@/lib/utils';
import {
  SALES_STATUSES, SALES_STATUS_LABEL, PACKAGES, PACKAGE_LABEL,
  type SalesStatus, type ClientPackage,
} from '@/lib/roles';

type Row = {
  id: string;
  businessName: string;
  niche: string;
  contactName: string;
  phone: string;
  email: string;
  salesStatus: SalesStatus;
  packageType: ClientPackage;
  comment: string;
  reminderAt: string | null;
  reminderNote: string;
  reminderDone: boolean;
  createdAt: string;
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function SalesClient({ clients }: { clients: Row[] }) {
  const router = useRouter();
  const [open, setOpen] = useState<Row | null>(null);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Partial<Row>>({});

  const byStatus = useMemo(() => {
    const map = new Map<SalesStatus, Row[]>();
    for (const s of SALES_STATUSES) map.set(s, []);
    for (const c of clients) map.get(c.salesStatus)?.push(c);
    return map;
  }, [clients]);

  // Reminders that are due (and not yet marked done)
  const dueReminders = useMemo(
    () => clients.filter((c) => c.reminderAt && !c.reminderDone && new Date(c.reminderAt) <= new Date()),
    [clients],
  );

  const openCard = (c: Row) => {
    setOpen(c);
    setDraft({
      salesStatus: c.salesStatus,
      packageType: c.packageType,
      contactName: c.contactName,
      niche: c.niche,
      comment: c.comment,
      reminderAt: c.reminderAt,
      reminderNote: c.reminderNote,
    });
  };

  const patch = async (id: string, body: any, msg = 'Сохранено') => {
    const r = await fetch(`/api/sales/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      toast.error(d.error || 'Не удалось сохранить');
      return false;
    }
    toast.success(msg);
    router.refresh();
    return true;
  };

  const save = async () => {
    if (!open) return;
    setSaving(true);
    const ok = await patch(open.id, draft);
    setSaving(false);
    if (ok) setOpen(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Sales"
        title={<>Продажи</>}
        subtitle="Статусы клиентов, пакеты, комментарии и напоминания перезвонить."
      />

      {/* Due reminders */}
      {dueReminders.length > 0 && (
        <div className="rounded-3xl border border-brand-orange/30 bg-brand-orange/[0.06] p-5">
          <p className="text-[10px] uppercase tracking-[0.24em] text-brand-orange">Напоминания — пора связаться</p>
          <div className="mt-3 space-y-2">
            {dueReminders.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center gap-3 text-sm">
                <span className="font-medium text-light">{c.contactName || c.businessName}</span>
                {c.phone && <a href={`tel:${c.phone}`} className="font-mono text-[12px] text-brand-lime">{c.phone}</a>}
                <span className="text-light/55">{c.reminderNote || 'перезвонить'}</span>
                <span className="text-[11px] text-light/40">{fmtDateTime(c.reminderAt!)}</span>
                <button
                  onClick={() => patch(c.id, { reminderDone: true }, 'Напоминание закрыто')}
                  className="ml-auto text-[11px] uppercase tracking-[0.14em] text-light/50 hover:text-brand-lime"
                >
                  Выполнено
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Board */}
      <div className="grid gap-4 lg:grid-cols-5">
        {SALES_STATUSES.map((status) => {
          const list = byStatus.get(status) ?? [];
          return (
            <div key={status} className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="mb-3 flex items-center justify-between px-1">
                <span className="text-[10px] uppercase tracking-[0.14em] text-brand-orange">{SALES_STATUS_LABEL[status]}</span>
                <span className="text-[11px] text-light/40">{list.length}</span>
              </div>
              <div className="space-y-2">
                {list.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => openCard(c)}
                    className="block w-full rounded-2xl border border-white/[0.06] bg-ink/40 p-3 text-left transition-colors hover:border-brand-lime/30"
                  >
                    <div className="truncate text-sm font-medium text-light">{c.contactName || c.businessName}</div>
                    <div className="truncate text-[11px] text-light/45">{c.businessName} · {c.niche}</div>
                    {c.packageType !== 'NONE' && (
                      <span className="mt-2 inline-block rounded-full border border-brand-lime/30 bg-brand-lime/[0.06] px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] text-brand-lime">
                        {PACKAGE_LABEL[c.packageType]}
                      </span>
                    )}
                    {c.reminderAt && !c.reminderDone && (
                      <div className="mt-2 text-[10px] text-brand-orange">⏰ {fmtDateTime(c.reminderAt)}</div>
                    )}
                    <div className="mt-2 text-[10px] uppercase tracking-[0.12em] text-light/25">с {fmtDate(c.createdAt)}</div>
                  </button>
                ))}
                {list.length === 0 && <p className="px-1 py-3 text-[11px] text-light/25">Пусто</p>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit panel */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4" onClick={() => setOpen(null)}>
          <div onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/[0.08] bg-ink2 p-6">
            <h3 className="font-display text-xl font-bold text-light">{open.businessName}</h3>
            <p className="mt-1 text-[12px] text-light/45">
              {open.email}{open.phone ? ` · ${open.phone}` : ''} · с {fmtDate(open.createdAt)}
            </p>

            <div className="mt-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-soft">Статус</label>
                  <select className="input-glass" value={draft.salesStatus} onChange={(e) => setDraft({ ...draft, salesStatus: e.target.value as SalesStatus })}>
                    {SALES_STATUSES.map((s) => <option key={s} value={s}>{SALES_STATUS_LABEL[s]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-soft">Пакет</label>
                  <select className="input-glass" value={draft.packageType} onChange={(e) => setDraft({ ...draft, packageType: e.target.value as ClientPackage })}>
                    {PACKAGES.map((p) => <option key={p} value={p}>{PACKAGE_LABEL[p]}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-soft">Имя Фамилия</label>
                  <input className="input-glass" value={draft.contactName ?? ''} onChange={(e) => setDraft({ ...draft, contactName: e.target.value })} />
                </div>
                <div>
                  <label className="label-soft">Ниша</label>
                  <input className="input-glass" value={draft.niche ?? ''} onChange={(e) => setDraft({ ...draft, niche: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label-soft">Комментарий</label>
                <textarea className="input-glass min-h-[80px]" value={draft.comment ?? ''} onChange={(e) => setDraft({ ...draft, comment: e.target.value })} />
              </div>
              <div className="rounded-2xl border border-white/[0.06] p-4">
                <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-brand-orange">Напоминание</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="label-soft">Когда напомнить</label>
                    <input
                      type="datetime-local"
                      className="input-glass"
                      value={draft.reminderAt ? toLocalInput(new Date(draft.reminderAt)) : ''}
                      onChange={(e) => setDraft({ ...draft, reminderAt: e.target.value ? new Date(e.target.value).toISOString() : null })}
                    />
                  </div>
                  <div>
                    <label className="label-soft">Что сделать</label>
                    <input className="input-glass" placeholder="перезвонить" value={draft.reminderNote ?? ''} onChange={(e) => setDraft({ ...draft, reminderNote: e.target.value })} />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setOpen(null)} className="btn-ghost">Отмена</button>
              <button onClick={save} disabled={saving} className="btn-lime disabled:opacity-60">{saving ? 'Сохраняем…' : 'Сохранить'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
