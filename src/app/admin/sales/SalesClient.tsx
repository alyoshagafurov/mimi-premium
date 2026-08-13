'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/admin/PageHeader';
import { cn } from '@/lib/utils';
import {
  SALES_STATUSES, SALES_STATUS_LABEL, PACKAGES, PACKAGE_LABEL, ROLE_LABEL,
  type SalesStatus, type ClientPackage,
} from '@/lib/roles';
import type { Role } from '@prisma/client';

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
  createdById: string | null;
  createdByName: string | null;
  assignedToName: string | null;
  assignedToId: string | null;
  reminderAt: string | null;
  reminderNote: string;
  reminderDone: boolean;
  createdAt: string;
};
type RepStat = { id: string; name: string; role: string; day: number; week: number; month: number; year: number; total: number };

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' });
/**
 * Parse a hand-typed period: «20.07.2026 - 25.07.2026», «20.07.2026» (один день),
 * «20.07 - 25.07» (текущий год). Any of . / - work inside a date; the two dates
 * are simply the first two date-like tokens found.
 */
function parseRange(text: string): { start: number; end: number } | null {
  const tokens = text.match(/\d{1,2}[./-]\d{1,2}(?:[./-]\d{2,4})?/g);
  if (!tokens?.length) return null;

  const toDate = (raw: string): Date | null => {
    const m = raw.match(/^(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?$/);
    if (!m) return null;
    const day = Number(m[1]);
    const month = Number(m[2]);
    let year = m[3] ? Number(m[3]) : new Date().getFullYear();
    if (year < 100) year += 2000;
    const d = new Date(year, month - 1, day);
    // reject impossible dates like 31.02
    if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;
    return d;
  };

  const a = toDate(tokens[0]);
  if (!a) return null;
  const b = tokens[1] ? toDate(tokens[1]) : a; // one date = that single day
  if (!b) return null;

  const [lo, hi] = a <= b ? [a, b] : [b, a]; // tolerate a reversed range
  return {
    start: new Date(lo.getFullYear(), lo.getMonth(), lo.getDate(), 0, 0, 0, 0).getTime(),
    end: new Date(hi.getFullYear(), hi.getMonth(), hi.getDate(), 23, 59, 59, 999).getTime(),
  };
}

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

export function SalesClient({
  leads,
  repStats,
  meId,
  seesEveryone,
}: {
  leads: Lead[];
  repStats: RepStat[];
  meId: string;
  seesEveryone: boolean;
}) {
  const router = useRouter();
  const [mine, setMine] = useState(false);
  const [q, setQ] = useState('');
  // Admin can drill into one salesperson's leads by clicking their row.
  const [repFilter, setRepFilter] = useState<string | null>(null);
  // Free date range, typed by hand and applied on click (not while typing).
  const [periodText, setPeriodText] = useState('');
  const [bounds, setBounds] = useState<{ start: number; end: number } | null>(null);

  const rangeActive = bounds !== null;

  const applyPeriod = () => {
    if (!periodText.trim()) { setBounds(null); return; }
    const parsed = parseRange(periodText);
    if (!parsed) {
      toast.error('Не понял период. Наберите: 20 8 2026 — пробел ставит «/»');
      return;
    }
    setBounds(parsed);
  };

  const clearPeriod = () => { setPeriodText(''); setBounds(null); setCalFrom(''); setCalTo(''); };

  // Package filter — empty set means «все пакеты».
  const [packages, setPackages] = useState<Set<string>>(new Set());
  const [pkgOpen, setPkgOpen] = useState(false);
  const togglePackage = (p: string) =>
    setPackages((cur) => {
      const next = new Set(cur);
      next.has(p) ? next.delete(p) : next.add(p);
      return next;
    });

  // Calendar popover — an alternative to typing the period by hand.
  const [calOpen, setCalOpen] = useState(false);
  const [calFrom, setCalFrom] = useState('');
  const [calTo, setCalTo] = useState('');

  /** ISO (yyyy-mm-dd) → d/m/yyyy, the same shape the text field uses. */
  const isoToRu = (iso: string) => {
    const [y, m, d] = iso.split('-');
    return `${Number(d)}/${Number(m)}/${y}`;
  };
  const applyCalendar = (nextFrom: string, nextTo: string) => {
    setCalFrom(nextFrom);
    setCalTo(nextTo);
    if (!nextFrom && !nextTo) return;
    const a = nextFrom || nextTo;
    const b = nextTo || nextFrom;
    const text = a === b ? isoToRu(a) : `${isoToRu(a)} - ${isoToRu(b)}`;
    setPeriodText(text);
    const parsed = parseRange(text);
    if (parsed) setBounds(parsed);
  };

  // ⋯ menu on a lead card
  const [menuFor, setMenuFor] = useState<string | null>(null);

  const removeLead = async (l: Lead) => {
    if (!confirm(`Удалить лид «${l.contactName}»? Вместе с ним удалятся его заметки.`)) return;
    setMenuFor(null);
    const r = await fetch(`/api/sales/${l.id}`, { method: 'DELETE' });
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      return toast.error(d.error || 'Не удалось удалить лид');
    }
    toast.success('Лид удалён');
    router.refresh();
  };

  /**
   * Space is the separator: «20» ␣ «8» ␣ «2026» → 20/8/2026, and one more space
   * after a finished date starts the end of the range. Enter applies.
   */
  const onPeriodKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { applyPeriod(); return; }
    if (e.key !== ' ') return;
    e.preventDefault();
    const v = periodText;
    if (!v.trim()) return;                              // ignore a leading space
    if (v.endsWith('/') || v.endsWith(' - ')) return;   // never double a separator
    const parts = v.split(' - ');
    const slashes = (parts[parts.length - 1].match(/\//g) ?? []).length;
    if (slashes < 2) setPeriodText(v + '/');            // день → месяц → год
    else if (parts.length === 1) setPeriodText(v + ' - '); // date done → start the second
  };

  // Counted client-side from the leads already on the page — instant, no refetch.
  const rangeCount = useMemo(() => {
    if (!bounds) return null;
    const { start, end } = bounds;
    const counts = new Map<string, number>();
    let all = 0;
    for (const l of leads) {
      const t = new Date(l.createdAt).getTime();
      if (t < start || t > end) continue;
      all++;
      if (l.createdById) counts.set(l.createdById, (counts.get(l.createdById) ?? 0) + 1);
    }
    return { counts, all };
  }, [leads, bounds, rangeActive]);

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return leads.filter((l) => {
      if (mine && l.assignedToId !== meId) return false;
      if (repFilter && l.createdById !== repFilter) return false;
      if (bounds) {
        const t = new Date(l.createdAt).getTime();
        if (t < bounds.start || t > bounds.end) return false;
      }
      if (packages.size && !packages.has(l.packageType)) return false;
      if (!needle) return true;
      return [l.contactName, l.businessName, l.niche, l.phone, l.email, l.assignedToName ?? '']
        .join(' ').toLowerCase().includes(needle);
    });
  }, [leads, mine, meId, q, repFilter, bounds, packages]);

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
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[10px] uppercase tracking-[0.24em] text-brand-orange">
            {seesEveryone ? 'Лидов добавлено' : 'Мои лиды'}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.14em] text-light/35">Период</span>
            <input
              type="text"
              inputMode="numeric"
              value={periodText}
              onChange={(e) => setPeriodText(e.target.value)}
              onKeyDown={onPeriodKey}
              placeholder="20 8 2026 → 20/8/2026"
              title="Пробел = разделитель: 20␣8␣2026␣25␣8␣2026"
              className="input-glass !w-[230px] !py-1.5 !text-[12px]"
            />
            {/* Календарь — альтернатива ручному вводу */}
            <div className="relative">
              <button
                type="button"
                aria-label="Выбрать даты в календаре"
                onClick={() => setCalOpen((v) => !v)}
                className={cn(
                  'rounded-xl border px-2.5 py-1.5 text-[13px] transition',
                  calOpen ? 'border-brand-lime text-brand-lime' : 'border-white/10 text-light/55 hover:text-light',
                )}
              >
                🗓
              </button>
              {calOpen && (
                <>
                  <span className="fixed inset-0 z-20" onClick={() => setCalOpen(false)} />
                  <div className="absolute left-0 top-10 z-30 w-[230px] rounded-2xl border border-white/10 bg-ink2 p-3 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.8)]">
                    <label className="label-soft">С какого числа</label>
                    <input
                      type="date"
                      value={calFrom}
                      onChange={(e) => applyCalendar(e.target.value, calTo)}
                      className="input-glass !py-1.5 !text-[12px]"
                    />
                    <label className="label-soft mt-3 block">По какое</label>
                    <input
                      type="date"
                      value={calTo}
                      onChange={(e) => applyCalendar(calFrom, e.target.value)}
                      className="input-glass !py-1.5 !text-[12px]"
                    />
                    <p className="mt-2 text-[10px] leading-relaxed text-light/35">
                      Одна дата — этот день. Можно и просто набрать период вручную.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Пакет — можно выбрать несколько; пусто = все */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setPkgOpen((v) => !v)}
                className={cn(
                  'rounded-xl border px-3 py-1.5 text-[12px] transition',
                  packages.size ? 'border-brand-lime text-brand-lime' : 'border-white/10 text-light/55 hover:text-light',
                )}
              >
                Пакет{packages.size ? ` · ${packages.size}` : ''}
              </button>
              {pkgOpen && (
                <>
                  <span className="fixed inset-0 z-20" onClick={() => setPkgOpen(false)} />
                  <div className="absolute left-0 top-10 z-30 max-h-[300px] w-[220px] overflow-y-auto rounded-2xl border border-white/10 bg-ink2 p-2 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.8)]">
                    {PACKAGES.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => togglePackage(p)}
                        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[12px] transition hover:bg-white/[0.05]"
                      >
                        <span className={cn(
                          'flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px]',
                          packages.has(p) ? 'border-brand-lime bg-brand-lime text-[#0A0712]' : 'border-white/20 text-transparent',
                        )}>✓</span>
                        <span className={packages.has(p) ? 'text-light' : 'text-light/65'}>{PACKAGE_LABEL[p]}</span>
                      </button>
                    ))}
                    {packages.size > 0 && (
                      <button
                        type="button"
                        onClick={() => setPackages(new Set())}
                        className="mt-1 w-full rounded-lg px-2.5 py-2 text-left text-[11px] uppercase tracking-[0.14em] text-light/45 hover:text-brand-lime"
                      >
                        Сбросить пакеты
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            <button onClick={applyPeriod} className="btn-lime !px-4 !py-1.5 !text-[11px]">
              Показать
            </button>
            {rangeActive && (
              <button onClick={clearPeriod} className="text-[11px] uppercase tracking-[0.14em] text-light/45 hover:text-brand-lime">
                Сбросить
              </button>
            )}
            {repFilter && (
              <button onClick={() => setRepFilter(null)} className="text-[11px] uppercase tracking-[0.14em] text-brand-lime">
                Показать всех ×
              </button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="text-[10px] uppercase tracking-[0.16em] text-light/40">
              <tr>
                <th className="pb-3 text-left">Продажник</th>
                {rangeActive && <th className="pb-3 text-right text-brand-lime">За период</th>}
                <th className="pb-3 text-right">За день</th>
                <th className="pb-3 text-right">За неделю</th>
                <th className="pb-3 text-right">За месяц</th>
                <th className="pb-3 text-right">За год</th>
                <th className="pb-3 text-right">Всего</th>
              </tr>
            </thead>
            <tbody>
              {repStats.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => seesEveryone && setRepFilter((cur) => (cur === r.id ? null : r.id))}
                  className={cn(
                    'border-t border-white/5',
                    seesEveryone && 'cursor-pointer transition-colors hover:bg-white/[0.03]',
                    repFilter === r.id && 'bg-brand-lime/[0.06]',
                  )}
                >
                  <td className="py-2.5">
                    <span className="text-light/85">{r.name}</span>
                    <span className="ml-2 text-[10px] uppercase tracking-[0.12em] text-light/35">
                      {ROLE_LABEL[r.role as Role] ?? r.role}
                    </span>
                  </td>
                  {rangeActive && (
                    <td className="py-2.5 text-right font-mono text-brand-lime">{rangeCount?.counts.get(r.id) ?? 0}</td>
                  )}
                  <td className="py-2.5 text-right font-mono text-brand-lime">{r.day}</td>
                  <td className="py-2.5 text-right font-mono text-light/70">{r.week}</td>
                  <td className="py-2.5 text-right font-mono text-light/70">{r.month}</td>
                  <td className="py-2.5 text-right font-mono text-light/70">{r.year}</td>
                  <td className="py-2.5 text-right font-mono text-light/45">{r.total}</td>
                </tr>
              ))}
              {!repStats.length && (
                <tr><td colSpan={rangeActive ? 7 : 6} className="py-6 text-center text-light/40">Пока нет данных.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {rangeActive && (
          <p className="mt-3 text-[12px] text-light/70">
            За выбранный период добавлено <span className="font-mono text-brand-lime">{rangeCount?.all ?? 0}</span> лидов.
          </p>
        )}
        {seesEveryone && (
          <p className="mt-2 text-[11px] text-light/35">
            Нажмите на продажника, чтобы посмотреть только его лиды.
          </p>
        )}
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
        {seesEveryone && (
          <button
            onClick={() => setMine((v) => !v)}
            className={cn(
              'rounded-full border px-4 py-2 text-[11px] uppercase tracking-[0.14em] transition',
              mine ? 'border-brand-lime bg-brand-lime text-[#0A0712]' : 'border-white/10 text-light/55 hover:text-light',
            )}
          >
            Только мои
          </button>
        )}
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
                    className="relative block rounded-2xl border border-white/[0.06] bg-ink/40 p-3 transition-colors hover:border-brand-lime/30"
                  >
                    {/* ⋯ — действия с лидом */}
                    <button
                      type="button"
                      aria-label="Действия"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuFor((cur) => (cur === l.id ? null : l.id)); }}
                      className="absolute right-1.5 top-1.5 z-20 rounded-lg px-1.5 py-0.5 text-light/35 transition hover:bg-white/[0.06] hover:text-light"
                    >
                      ⋯
                    </button>
                    {menuFor === l.id && (
                      <>
                        <span
                          className="fixed inset-0 z-20"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuFor(null); }}
                        />
                        <div className="absolute right-1.5 top-8 z-30 min-w-[150px] overflow-hidden rounded-xl border border-white/10 bg-ink2 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.8)]">
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeLead(l); }}
                            className="block w-full px-3.5 py-2.5 text-left text-[12px] text-rose-300 transition hover:bg-rose-400/10"
                          >
                            Удалить лид
                          </button>
                        </div>
                      </>
                    )}
                    <div className="flex items-start gap-2.5 pr-6">
                      {l.sourceType === 'VIDEO' && l.sourceCover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={l.sourceCover} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" />
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-light">{l.contactName}</div>
                        {(l.businessName !== l.contactName || l.niche !== 'Не указана') && (
                          <div className="truncate text-[11px] text-light/45">
                            {[l.businessName !== l.contactName ? l.businessName : '', l.niche !== 'Не указана' ? l.niche : '']
                              .filter(Boolean).join(' · ')}
                          </div>
                        )}
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
