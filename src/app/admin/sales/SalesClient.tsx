'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/admin/PageHeader';
import { cn } from '@/lib/utils';
import {
  SALES_STATUSES, SALES_STATUS_LABEL, PACKAGE_LABEL,
  type SalesStatus, type ClientPackage,
} from '@/lib/roles';

type Lead = {
  id: string;
  businessName: string;
  niche: string;
  contactName: string;
  phone: string;
  email: string;
  salesStatus: SalesStatus;
  packageType: ClientPackage;
  sourceType: 'VIDEO' | 'OTHER';
  sourceUrl: string | null;
  sourceCover: string | null;
  sourceNote: string | null;
  createdByName: string | null;
  assignedToName: string | null;
  assignedToId: string | null;
  reminderAt: string | null;
  reminderNote: string;
  reminderDone: boolean;
  createdAt: string;
};
type RepStat = { id: string; name: string; role: string; day: number; week: number; month: number; total: number };

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

export function SalesClient({
  leads,
  repStats,
  meId,
}: {
  leads: Lead[];
  repStats: RepStat[];
  meId: string;
}) {
  const router = useRouter();
  const [mine, setMine] = useState(false);
  const [q, setQ] = useState('');

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return leads.filter((l) => {
      if (mine && l.assignedToId !== meId) return false;
      if (!needle) return true;
      return [l.contactName, l.businessName, l.niche, l.phone, l.email, l.assignedToName ?? '']
        .join(' ').toLowerCase().includes(needle);
    });
  }, [leads, mine, meId, q]);

  const byStatus = useMemo(() => {
    const map = new Map<SalesStatus, Lead[]>();
    for (const s of SALES_STATUSES) map.set(s, []);
    for (const l of visible) map.get(l.salesStatus)?.push(l);
    return map;
  }, [visible]);

  const dueReminders = useMemo(
    () => visible.filter((l) => l.reminderAt && !l.reminderDone && new Date(l.reminderAt) <= new Date()),
    [visible],
  );

  const closeReminder = async (id: string) => {
    const r = await fetch(`/api/sales/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reminderDone: true }),
    });
    if (r.ok) { toast.success('Напоминание закрыто'); router.refresh(); }
    else toast.error('Не удалось обновить');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="CRM"
        title={<>Продажи</>}
        subtitle="Лиды, их источники, владельцы и напоминания."
        action={
          <Link href="/admin/sales/new" className="btn-lime !px-5 !py-3 !text-[11px]">
            + Новый лид
          </Link>
        }
      />

      {/* ── Статистика по продажникам ── */}
      <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
        <p className="mb-4 text-[10px] uppercase tracking-[0.24em] text-brand-orange">Лидов добавлено</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="text-[10px] uppercase tracking-[0.16em] text-light/40">
              <tr>
                <th className="pb-3 text-left">Продажник</th>
                <th className="pb-3 text-right">За день</th>
                <th className="pb-3 text-right">За неделю</th>
                <th className="pb-3 text-right">За месяц</th>
                <th className="pb-3 text-right">Всего</th>
              </tr>
            </thead>
            <tbody>
              {repStats.map((r) => (
                <tr key={r.id} className="border-t border-white/5">
                  <td className="py-2.5 text-light/85">{r.name}</td>
                  <td className="py-2.5 text-right font-mono text-brand-lime">{r.day}</td>
                  <td className="py-2.5 text-right font-mono text-light/70">{r.week}</td>
                  <td className="py-2.5 text-right font-mono text-light/70">{r.month}</td>
                  <td className="py-2.5 text-right font-mono text-light/45">{r.total}</td>
                </tr>
              ))}
              {!repStats.length && (
                <tr><td colSpan={5} className="py-6 text-center text-light/40">Пока нет данных.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Due reminders */}
      {dueReminders.length > 0 && (
        <div className="rounded-3xl border border-brand-orange/30 bg-brand-orange/[0.06] p-5">
          <p className="text-[10px] uppercase tracking-[0.24em] text-brand-orange">Напоминания — пора связаться</p>
          <div className="mt-3 space-y-2">
            {dueReminders.map((l) => (
              <div key={l.id} className="flex flex-wrap items-center gap-3 text-sm">
                <Link href={`/admin/sales/${l.id}`} className="font-medium text-light hover:text-brand-lime">
                  {l.contactName}
                </Link>
                {l.phone && <a href={`tel:${l.phone}`} className="font-mono text-[12px] text-brand-lime">{l.phone}</a>}
                <span className="text-light/55">{l.reminderNote || 'перезвонить'}</span>
                <span className="text-[11px] text-light/40">{fmtDateTime(l.reminderAt!)}</span>
                <button
                  onClick={() => closeReminder(l.id)}
                  className="ml-auto text-[11px] uppercase tracking-[0.14em] text-light/50 hover:text-brand-lime"
                >
                  Выполнено
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          placeholder="Поиск по имени, телефону, бизнесу…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="input-glass max-w-sm"
        />
        <button
          onClick={() => setMine((v) => !v)}
          className={cn(
            'rounded-full border px-4 py-2 text-[11px] uppercase tracking-[0.14em] transition',
            mine ? 'border-brand-lime bg-brand-lime text-[#0A0712]' : 'border-white/10 text-light/55 hover:text-light',
          )}
        >
          Только мои
        </button>
        <span className="chip-lime">{visible.length} лидов</span>
      </div>

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
                {list.map((l) => (
                  <Link
                    key={l.id}
                    href={`/admin/sales/${l.id}`}
                    className="block rounded-2xl border border-white/[0.06] bg-ink/40 p-3 transition-colors hover:border-brand-lime/30"
                  >
                    <div className="flex items-start gap-2.5">
                      {l.sourceType === 'VIDEO' && l.sourceCover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={l.sourceCover} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" />
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-light">{l.contactName}</div>
                        <div className="truncate text-[11px] text-light/45">{l.businessName} · {l.niche}</div>
                      </div>
                    </div>
                    {l.packageType !== 'NONE' && (
                      <span className="mt-2 inline-block rounded-full border border-brand-lime/30 bg-brand-lime/[0.06] px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] text-brand-lime">
                        {PACKAGE_LABEL[l.packageType]}
                      </span>
                    )}
                    {l.reminderAt && !l.reminderDone && (
                      <div className="mt-2 text-[10px] text-brand-orange">⏰ {fmtDateTime(l.reminderAt)}</div>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-x-2 text-[10px] text-light/30">
                      <span className="uppercase tracking-[0.12em]">с {fmtDate(l.createdAt)}</span>
                      {l.assignedToName && <span className="text-brand-lime/70">· {l.assignedToName}</span>}
                    </div>
                  </Link>
                ))}
                {list.length === 0 && <p className="px-1 py-3 text-[11px] text-light/25">Пусто</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
