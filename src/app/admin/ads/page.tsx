import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getSafeSession } from '@/lib/session';
import { PageHeader } from '@/components/admin/PageHeader';
import { canSeeRevenue } from '@/lib/roles';

const nf = (n: number) => new Intl.NumberFormat('ru-RU').format(Math.round(n));
const money = (n: number) => `${nf(n)} c.`;

export default async function AdminAdsPage() {
  const session = await getSafeSession();
  const showMoney = canSeeRevenue((session?.user as any)?.role) || (session?.user as any)?.role === 'TARGETOLOGIST';

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [accounts, metrics] = await Promise.all([
    prisma.facebookAccount.findMany({
      include: { client: { select: { id: true, businessName: true } } },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.adMetric.findMany({
      where: { date: { gte: since } },
      include: { client: { select: { id: true, businessName: true } } },
      orderBy: { date: 'desc' },
    }),
  ]);

  // Totals for the last 30 days
  const t = metrics.reduce(
    (a, m) => ({
      spent: a.spent + m.spent,
      reach: a.reach + m.reach,
      clicks: a.clicks + m.clicks,
      impressions: a.impressions + m.impressions,
      leads: a.leads + m.leads,
    }),
    { spent: 0, reach: 0, clicks: 0, impressions: 0, leads: 0 },
  );
  const ctr = t.impressions ? (t.clicks / t.impressions) * 100 : 0;
  const cpl = t.leads ? t.spent / t.leads : 0;

  // Per-client rollup
  const byClient = new Map<string, { name: string; spent: number; leads: number; clicks: number; impressions: number }>();
  for (const m of metrics) {
    const k = m.clientId;
    const cur = byClient.get(k) ?? { name: m.client.businessName, spent: 0, leads: 0, clicks: 0, impressions: 0 };
    cur.spent += m.spent; cur.leads += m.leads; cur.clicks += m.clicks; cur.impressions += m.impressions;
    byClient.set(k, cur);
  }
  const rows = [...byClient.entries()].sort((a, b) => b[1].spent - a[1].spent);

  const connected = accounts.filter((a) => !!a.accessToken);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Meta Ads"
        title={<>Реклама</>}
        subtitle="Состояние рекламных кабинетов и результаты кампаний за 30 дней."
      />

      {/* KPI */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          { label: 'Потрачено', value: showMoney ? money(t.spent) : '—' },
          { label: 'Лиды', value: nf(t.leads) },
          { label: 'Цена лида', value: showMoney && cpl ? money(cpl) : '—' },
          { label: 'Клики', value: nf(t.clicks) },
          { label: 'CTR', value: `${ctr.toFixed(2)}%` },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-light/45">{k.label}</p>
            <p className="mt-2 font-display text-xl font-extrabold text-light">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Ad accounts */}
      <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[10px] uppercase tracking-[0.24em] text-brand-orange">Рекламные кабинеты</p>
          <span className="text-[11px] text-light/40">подключено {connected.length} из {accounts.length}</span>
        </div>
        {accounts.length === 0 ? (
          <p className="py-6 text-center text-light/45">
            Кабинеты не подключены. Подключение — в разделе «Интеграции».
          </p>
        ) : (
          <div className="divide-y divide-white/[0.05]">
            {accounts.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-light">{a.client.businessName}</div>
                  <div className="truncate text-[11px] text-light/45">
                    {a.pageName || a.pageId || 'Страница не указана'}
                    {a.adAccountId ? ` · ${a.adAccountId}` : ''}
                  </div>
                </div>
                {a.lastSyncAt && (
                  <span className="text-[10px] uppercase tracking-[0.12em] text-light/30">
                    синк {new Date(a.lastSyncAt).toLocaleDateString('ru-RU')}
                  </span>
                )}
                <span className={`rounded-full border px-2.5 py-1 text-[9px] uppercase tracking-[0.14em] ${
                  a.accessToken
                    ? 'border-brand-lime/30 bg-brand-lime/[0.06] text-brand-lime'
                    : 'border-brand-orange/30 bg-brand-orange/[0.06] text-brand-orange'
                }`}>
                  {a.accessToken ? 'активно' : 'нужен токен'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Per client */}
      <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6">
        <p className="mb-4 text-[10px] uppercase tracking-[0.24em] text-brand-orange">По проектам · 30 дней</p>
        {rows.length === 0 ? (
          <p className="py-6 text-center text-light/45">
            Данных пока нет — появятся после подключения токена и первой синхронизации.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-[0.14em] text-light/40">
                  <th className="pb-3">Проект</th>
                  {showMoney && <th className="pb-3">Потрачено</th>}
                  <th className="pb-3">Лиды</th>
                  {showMoney && <th className="pb-3">Цена лида</th>}
                  <th className="pb-3">CTR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {rows.map(([id, r]) => (
                  <tr key={id}>
                    <td className="py-3">
                      <Link href={`/admin/projects/${id}`} className="text-light hover:text-brand-lime">{r.name}</Link>
                    </td>
                    {showMoney && <td className="py-3 text-light/70">{money(r.spent)}</td>}
                    <td className="py-3 text-light/70">{nf(r.leads)}</td>
                    {showMoney && <td className="py-3 text-light/70">{r.leads ? money(r.spent / r.leads) : '—'}</td>}
                    <td className="py-3 text-light/70">{r.impressions ? ((r.clicks / r.impressions) * 100).toFixed(2) : '0.00'}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
