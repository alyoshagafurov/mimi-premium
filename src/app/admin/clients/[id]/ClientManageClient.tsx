'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatusPill } from '@/components/ui/StatusPill';
import { MONTHS_RU, monthLabel, tariffLabel, formatMoney, cn } from '@/lib/utils';

type Platform = { name: string; spent: number; roas: number };
type Audience = { age18_24: number; age25_34: number; age35_44: number; age45plus: number };
type Campaign = { id: string; name: string; platform: string; status: string };
type Report = {
  id: string;
  month: number;
  year: number;
  spent: number;
  budget: number;
  reach: number;
  clicks: number;
  leads: number;
  platforms: Platform[];
  audience: Audience | null;
  campaigns: Campaign[];
};
type Client = {
  id: string;
  businessName: string;
  niche: string;
  status: string;
  ownerName: string;
  ownerEmail: string;
  tariff: string;
};

const CAMPAIGN_PLATFORMS = ['Instagram', 'Facebook'] as const;
const CAMPAIGN_STATUSES = ['ACTIVE', 'PAUSED', 'FINISHED'] as const;

const num = (s: string) => {
  const v = Number(s);
  return Number.isFinite(v) ? v : 0;
};
const int = (s: string) => Math.max(0, Math.round(num(s)));

type Draft = {
  spent: string; budget: string; reach: string; clicks: string; leads: string;
  igSpent: string; igRoas: string; fbSpent: string; fbRoas: string;
  a1: string; a2: string; a3: string; a4: string;
};

const draftFrom = (r: Report): Draft => {
  const ig = r.platforms.find((p) => p.name === 'Instagram');
  const fb = r.platforms.find((p) => p.name === 'Facebook');
  return {
    spent: String(r.spent), budget: String(r.budget), reach: String(r.reach),
    clicks: String(r.clicks), leads: String(r.leads),
    igSpent: String(ig?.spent ?? 0), igRoas: String(ig?.roas ?? 0),
    fbSpent: String(fb?.spent ?? 0), fbRoas: String(fb?.roas ?? 0),
    a1: String(r.audience?.age18_24 ?? 0), a2: String(r.audience?.age25_34 ?? 0),
    a3: String(r.audience?.age35_44 ?? 0), a4: String(r.audience?.age45plus ?? 0),
  };
};

export function ClientManageClient({ client, reports }: { client: Client; reports: Report[] }) {
  const router = useRouter();
  const now = new Date();

  const [selectedId, setSelectedId] = useState<string | null>(reports[0]?.id ?? null);
  const selected = reports.find((r) => r.id === selectedId) ?? null;

  const [draft, setDraft] = useState<Draft | null>(selected ? draftFrom(selected) : null);
  const [savingReport, setSavingReport] = useState(false);

  // New-report form
  const [newMonth, setNewMonth] = useState(now.getMonth() + 1);
  const [newYear, setNewYear] = useState(now.getFullYear());
  const [creating, setCreating] = useState(false);

  // New-campaign form
  const [camp, setCamp] = useState({ name: '', platform: 'Instagram', status: 'ACTIVE' });
  const [addingCamp, setAddingCamp] = useState(false);

  // Keep selection valid + reset the editable draft whenever the active report changes.
  useEffect(() => {
    if (selectedId && reports.some((r) => r.id === selectedId)) return;
    setSelectedId(reports[0]?.id ?? null);
  }, [reports, selectedId]);

  useEffect(() => {
    setDraft(selected ? draftFrom(selected) : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const set = (k: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDraft((d) => (d ? { ...d, [k]: e.target.value } : d));

  const createReport = async () => {
    setCreating(true);
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: client.id, month: newMonth, year: newYear }),
    });
    setCreating(false);
    if (res.ok) {
      const { id } = await res.json();
      setSelectedId(id);
      toast.success('Отчёт создан');
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? 'Не удалось создать отчёт');
    }
  };

  const saveReport = async () => {
    if (!selected || !draft) return;
    setSavingReport(true);
    const res = await fetch(`/api/reports/${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        spent: num(draft.spent),
        budget: num(draft.budget),
        reach: int(draft.reach),
        clicks: int(draft.clicks),
        leads: int(draft.leads),
        platforms: [
          { name: 'Instagram', spent: num(draft.igSpent), roas: num(draft.igRoas) },
          { name: 'Facebook', spent: num(draft.fbSpent), roas: num(draft.fbRoas) },
        ],
        audience: { age18_24: int(draft.a1), age25_34: int(draft.a2), age35_44: int(draft.a3), age45plus: int(draft.a4) },
      }),
    });
    setSavingReport(false);
    if (res.ok) {
      toast.success('Отчёт сохранён');
      router.refresh();
    } else toast.error('Не удалось сохранить');
  };

  const deleteReport = async () => {
    if (!selected) return;
    if (!confirm(`Удалить отчёт за ${monthLabel(selected.month, selected.year)}?`)) return;
    const res = await fetch(`/api/reports/${selected.id}`, { method: 'DELETE' });
    if (res.ok) {
      setSelectedId(null);
      toast.success('Отчёт удалён');
      router.refresh();
    } else toast.error('Не удалось удалить');
  };

  const addCampaign = async () => {
    if (!selected || !camp.name.trim()) {
      toast.error('Введите название кампании');
      return;
    }
    setAddingCamp(true);
    const res = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId: selected.id, ...camp }),
    });
    setAddingCamp(false);
    if (res.ok) {
      setCamp({ name: '', platform: 'Instagram', status: 'ACTIVE' });
      toast.success('Кампания добавлена');
      router.refresh();
    } else toast.error('Не удалось добавить');
  };

  const updateCampaignStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/campaigns/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) router.refresh();
    else toast.error('Не удалось обновить');
  };

  const deleteCampaign = async (id: string) => {
    const res = await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Кампания удалена');
      router.refresh();
    } else toast.error('Не удалось удалить');
  };

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  return (
    <div className="space-y-8">
      <Link href="/admin/clients" className="btn-quiet text-[11px]">
        ← Все клиенты
      </Link>

      <PageHeader
        eyebrow="Управление клиентом"
        title={<span className="text-lime-grad">{client.businessName}</span>}
        subtitle={`${client.niche} · ${client.ownerName} · ${client.ownerEmail}`}
        action={
          <div className="flex items-center gap-2">
            <span className="chip text-gold/90">{tariffLabel(client.tariff)}</span>
            <StatusPill status={client.status} />
          </div>
        }
      />

      {/* Create report + history selector */}
      <div className="glass rounded-2xl p-6">
        <h2 className="font-display text-lg font-bold">Отчёты по месяцам</h2>
        <p className="mb-4 text-xs text-muted">Выберите месяц для редактирования или создайте новый отчёт.</p>

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="label-soft">Месяц</label>
            <select className="input-glass" value={newMonth} onChange={(e) => setNewMonth(Number(e.target.value))}>
              {MONTHS_RU.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-soft">Год</label>
            <select className="input-glass" value={newYear} onChange={(e) => setNewYear(Number(e.target.value))}>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <button onClick={createReport} disabled={creating} className="btn-gold !px-5 !py-3 !text-[11px] disabled:opacity-60">
            {creating ? 'Создаём…' : '+ Создать отчёт'}
          </button>
        </div>

        {reports.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {reports.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedId(r.id)}
                className={cn(
                  'rounded-xl border px-4 py-2 text-[13px] transition',
                  r.id === selectedId
                    ? 'border-brand-lime/40 bg-brand-lime/[0.08] text-brand-lime'
                    : 'border-white/10 text-light/60 hover:text-light',
                )}
              >
                {monthLabel(r.month, r.year)}
              </button>
            ))}
          </div>
        )}
      </div>

      {!selected || !draft ? (
        <div className="glass rounded-2xl p-10 text-center text-sm text-muted">
          {reports.length ? 'Выберите отчёт выше.' : 'Отчётов пока нет — создайте первый.'}
        </div>
      ) : (
        <>
          {/* Metrics + platforms + audience */}
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="glass rounded-2xl p-6">
              <h2 className="mb-4 font-display text-lg font-bold">
                Показатели · {monthLabel(selected.month, selected.year)}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Потрачено (сомони)" value={draft.spent} onChange={set('spent')} />
                <Field label="Бюджет (сомони)" value={draft.budget} onChange={set('budget')} />
                <Field label="Охват" value={draft.reach} onChange={set('reach')} />
                <Field label="Клики" value={draft.clicks} onChange={set('clicks')} />
                <Field label="Заявки" value={draft.leads} onChange={set('leads')} />
              </div>
            </div>

            <div className="glass rounded-2xl p-6">
              <h2 className="mb-4 font-display text-lg font-bold">Платформы</h2>
              <div className="space-y-5">
                <div>
                  <div className="mb-2 text-sm font-medium text-brand-orange">Instagram</div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Потрачено" value={draft.igSpent} onChange={set('igSpent')} />
                    <Field label="ROAS" value={draft.igRoas} step="0.01" onChange={set('igRoas')} />
                  </div>
                </div>
                <div>
                  <div className="mb-2 text-sm font-medium text-brand-purpleSoft">Facebook</div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Потрачено" value={draft.fbSpent} onChange={set('fbSpent')} />
                    <Field label="ROAS" value={draft.fbRoas} step="0.01" onChange={set('fbRoas')} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <h2 className="font-display text-lg font-bold">Аудитория по возрасту</h2>
            <p className="mb-4 text-xs text-muted">Доли или абсолютные значения охвата по возрастным группам.</p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Field label="18–24" value={draft.a1} onChange={set('a1')} />
              <Field label="25–34" value={draft.a2} onChange={set('a2')} />
              <Field label="35–44" value={draft.a3} onChange={set('a3')} />
              <Field label="45+" value={draft.a4} onChange={set('a4')} />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button onClick={saveReport} disabled={savingReport} className="btn-gold disabled:opacity-60">
              {savingReport ? 'Сохраняем…' : 'Сохранить отчёт'}
            </button>
            <button
              onClick={deleteReport}
              className="rounded-full border border-rose-500/30 px-6 py-3 text-[13px] font-bold uppercase tracking-[0.16em] text-rose-400 transition hover:bg-rose-500/10"
            >
              Удалить отчёт
            </button>
          </div>

          {/* Campaigns */}
          <div className="glass rounded-2xl p-6">
            <h2 className="mb-4 font-display text-lg font-bold">Кампании</h2>

            <div className="mb-5 grid gap-3 sm:grid-cols-[1.6fr_1fr_1fr_auto]">
              <input
                className="input-glass"
                placeholder="Название кампании"
                value={camp.name}
                onChange={(e) => setCamp({ ...camp, name: e.target.value })}
              />
              <select className="input-glass" value={camp.platform} onChange={(e) => setCamp({ ...camp, platform: e.target.value })}>
                {CAMPAIGN_PLATFORMS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <select className="input-glass" value={camp.status} onChange={(e) => setCamp({ ...camp, status: e.target.value })}>
                {CAMPAIGN_STATUSES.map((s) => (
                  <option key={s} value={s}>{statusOption(s)}</option>
                ))}
              </select>
              <button onClick={addCampaign} disabled={addingCamp} className="btn-gold !px-5 !py-3 !text-[11px] disabled:opacity-60">
                Добавить
              </button>
            </div>

            <div className="space-y-2.5">
              {selected.campaigns.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-col gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-light">{c.name}</div>
                    <div className="text-[11px] text-muted">{c.platform}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      className="input-glass !w-auto !py-1.5 !text-xs"
                      value={c.status}
                      onChange={(e) => updateCampaignStatus(c.id, e.target.value)}
                    >
                      {CAMPAIGN_STATUSES.map((s) => (
                        <option key={s} value={s}>{statusOption(s)}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => deleteCampaign(c.id)}
                      className="rounded-lg border border-white/10 px-3 py-1.5 text-[11px] text-muted transition hover:border-rose-400/40 hover:text-rose-400"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
              {!selected.campaigns.length && (
                <p className="text-sm text-muted">Кампаний в этом отчёте пока нет.</p>
              )}
            </div>
          </div>

          {/* History summary */}
          <div className="glass rounded-2xl p-6">
            <h2 className="mb-4 font-display text-lg font-bold">История по месяцам</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="text-[10px] uppercase tracking-[0.16em] text-muted">
                  <tr>
                    <th className="px-3 py-2 text-left">Месяц</th>
                    <th className="px-3 py-2 text-right">Потрачено</th>
                    <th className="px-3 py-2 text-right">Охват</th>
                    <th className="px-3 py-2 text-right">Клики</th>
                    <th className="px-3 py-2 text-right">Заявки</th>
                    <th className="px-3 py-2 text-right">Кампаний</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedId(r.id)}
                      className={cn(
                        'cursor-pointer border-t border-white/5 transition hover:bg-white/[0.02]',
                        r.id === selectedId && 'bg-brand-lime/[0.04]',
                      )}
                    >
                      <td className="px-3 py-2.5 font-medium text-light">{monthLabel(r.month, r.year)}</td>
                      <td className="px-3 py-2.5 text-right text-muted">{formatMoney(r.spent)}</td>
                      <td className="px-3 py-2.5 text-right text-muted">{new Intl.NumberFormat('ru-RU').format(r.reach)}</td>
                      <td className="px-3 py-2.5 text-right text-muted">{new Intl.NumberFormat('ru-RU').format(r.clicks)}</td>
                      <td className="px-3 py-2.5 text-right text-muted">{new Intl.NumberFormat('ru-RU').format(r.leads)}</td>
                      <td className="px-3 py-2.5 text-right text-muted">{r.campaigns.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  step,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  step?: string;
}) {
  return (
    <div>
      <label className="label-soft">{label}</label>
      <input type="number" min={0} step={step} value={value} onChange={onChange} className="input-glass" />
    </div>
  );
}

function statusOption(s: string) {
  return s === 'ACTIVE' ? 'Активна' : s === 'PAUSED' ? 'Пауза' : 'Завершена';
}
