'use client';

import { useEffect } from 'react';
import { formatInt, formatMoney, formatPct, formatRoas, monthName, reportKpis } from '@/lib/utils';

type Report = {
  month: number;
  year: number;
  spent: number;
  budget: number;
  reach: number;
  clicks: number;
  leads: number;
  revenue: number;
  profileVisits: number;
  campaignCount: number;
  platforms: { name: string; spent: number; roas: number }[];
  campaigns: { name: string; platform: string; status: string }[];
  audience: { age18_24: number; age25_34: number; age35_44: number; age45plus: number } | null;
};

export function ReportPrintClient({
  report,
  client,
}: {
  report: Report;
  client: { businessName: string; niche: string };
}) {
  useEffect(() => {
    setTimeout(() => window.print(), 800);
  }, []);

  const k = reportKpis(report);

  return (
    <div className="mx-auto max-w-[800px] bg-[#fff] p-12 text-[#111] print:p-0 print:shadow-none" style={{ minHeight: '297mm' }}>
      <style>{`
        @page { size: A4; margin: 16mm; }
        @media print {
          body { background: white; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="no-print mb-6 flex items-center justify-between rounded-2xl border border-gray-200 p-4">
        <div className="text-sm text-gray-600">Этот отчёт оптимизирован под печать (Ctrl/Cmd + P → Сохранить как PDF).</div>
        <button onClick={() => window.print()} className="rounded-lg bg-[#3C1975] px-4 py-2 text-sm font-bold text-[#fff]">
          Скачать PDF
        </button>
      </div>

      <header className="flex items-end justify-between border-b-2 border-[#3C1975] pb-6">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#FC9603]">mimi marketing</div>
          <div className="mt-3 font-display text-3xl font-extrabold text-[#3C1975]">{client.businessName}</div>
          <div className="text-sm text-gray-600">{client.niche}</div>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-[0.2em] text-gray-500">Отчёт</div>
          <div className="font-display text-xl font-bold text-[#3C1975]">
            {monthName(report.month)} {report.year}
          </div>
        </div>
      </header>

      <section className="mt-8">
        <h2 className="font-display text-lg font-bold text-[#3C1975]">Ключевые показатели</h2>
        <div className="mt-4 grid grid-cols-4 gap-4">
          {[
            { label: 'Расход', value: formatMoney(report.spent) },
            { label: 'Выручка', value: formatMoney(report.revenue) },
            { label: 'Охват', value: formatInt(report.reach) },
            { label: 'Лиды', value: formatInt(report.leads) },
          ].map((m) => (
            <div key={m.label} className="rounded-xl border border-gray-200 p-4">
              <div className="text-[10px] uppercase tracking-[0.18em] text-gray-500">{m.label}</div>
              <div className="mt-2 font-display text-xl font-extrabold text-[#3C1975]">{m.value}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-4 gap-4">
          {[
            { label: 'CPL — цена заявки', value: formatMoney(k.cpl) },
            { label: 'CPC — цена клика', value: formatMoney(k.cpc) },
            { label: 'Клики', value: formatInt(report.clicks) },
            { label: 'Переходы в профиль', value: formatInt(report.profileVisits) },
          ].map((m) => (
            <div key={m.label} className="rounded-xl border border-gray-200 p-4">
              <div className="text-[10px] uppercase tracking-[0.18em] text-gray-500">{m.label}</div>
              <div className="mt-2 font-display text-lg font-bold text-[#3C1975]">{m.value}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg font-bold text-[#3C1975]">Окупаемость маркетинга</h2>
        <div className="mt-4 grid grid-cols-4 gap-4">
          {[
            { label: 'ROAS', value: formatRoas(k.roas) },
            { label: 'ROMI', value: formatPct(k.romi, true) },
            { label: 'Окупаемость', value: `${Math.round(k.payback)}%` },
            { label: 'Кампаний', value: formatInt(report.campaignCount) },
          ].map((m) => (
            <div key={m.label} className="rounded-xl border border-gray-200 p-4">
              <div className="text-[10px] uppercase tracking-[0.18em] text-gray-500">{m.label}</div>
              <div className="mt-2 font-display text-lg font-bold text-[#3C1975]">{m.value}</div>
            </div>
          ))}
        </div>
      </section>

      {report.platforms.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-lg font-bold text-[#3C1975]">Платформы</h2>
          <table className="mt-4 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-300 text-left text-[11px] uppercase tracking-[0.16em] text-gray-500">
                <th className="py-2">Платформа</th>
                <th className="py-2 text-right">Расход</th>
                <th className="py-2 text-right">ROAS</th>
              </tr>
            </thead>
            <tbody>
              {report.platforms.map((p) => (
                <tr key={p.name} className="border-b border-gray-100">
                  <td className="py-2 font-medium">{p.name}</td>
                  <td className="py-2 text-right">{formatMoney(p.spent)}</td>
                  <td className="py-2 text-right">{formatRoas(p.roas)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {report.audience && (
        <section className="mt-8">
          <h2 className="font-display text-lg font-bold text-[#3C1975]">Аудитория</h2>
          <div className="mt-4 grid grid-cols-4 gap-3">
            {[
              { label: '18-24', v: report.audience.age18_24 },
              { label: '25-34', v: report.audience.age25_34 },
              { label: '35-44', v: report.audience.age35_44 },
              { label: '45+', v: report.audience.age45plus },
            ].map((a) => (
              <div key={a.label} className="rounded-xl border border-gray-200 p-3 text-center">
                <div className="text-[10px] uppercase text-gray-500">{a.label}</div>
                <div className="mt-1 font-display text-base font-bold text-[#3C1975]">{a.v}%</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {report.campaigns.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-lg font-bold text-[#3C1975]">Кампании</h2>
          <table className="mt-4 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-300 text-left text-[11px] uppercase tracking-[0.16em] text-gray-500">
                <th className="py-2">Название</th>
                <th className="py-2">Платформа</th>
                <th className="py-2">Статус</th>
              </tr>
            </thead>
            <tbody>
              {report.campaigns.map((c, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-2">{c.name}</td>
                  <td className="py-2">{c.platform}</td>
                  <td className="py-2">{c.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <footer className="mt-12 border-t border-gray-200 pt-4 text-center text-[10px] uppercase tracking-[0.3em] text-gray-400">
        minimise the noise. maximise the impact.
      </footer>
    </div>
  );
}
