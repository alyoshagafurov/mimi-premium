import { redirect } from 'next/navigation';
import { getSafeSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { monthName } from '@/lib/utils';
import { DashboardClient } from './DashboardClient';

const deltaPct = (cur?: number, prev?: number): number | null => {
  if (prev === undefined || prev === null || prev === 0) return null;
  if (cur === undefined || cur === null) return null;
  return ((cur - prev) / prev) * 100;
};

export default async function DashboardPage() {
  const session = await getSafeSession();
  if (!session?.user) redirect('/auth/login');

  const user = await prisma.user.findUnique({
    relationLoadStrategy: 'join',
    where: { id: (session.user as any).id },
    include: {
      client: {
        include: {
          reports: {
            orderBy: [{ year: 'asc' }, { month: 'asc' }],
            include: {
              platforms: { orderBy: { name: 'asc' } },
              campaigns: { orderBy: { createdAt: 'asc' } },
              audience: true,
            },
          },
          // Заметки, которые пишет админ именно для клиента (внутренние
          // Activity сюда не попадают никогда).
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: { sender: { select: { name: true, avatar: true } } },
          },
          // Задачи по проекту — те же события календаря, что ставит команда.
          calendarEvents: {
            orderBy: [{ done: 'asc' }, { startAt: 'desc' }],
            take: 30,
            select: { id: true, title: true, kind: true, startAt: true, done: true, doneAt: true },
          },
        },
      },
    },
  });

  if (!user || !user.client) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-20 text-center">
        <h1 className="font-display text-3xl font-bold">Кабинет почти готов</h1>
        <p className="mt-3 text-muted">
          Свяжитесь с менеджером, чтобы привязать ваш бизнес-аккаунт.
        </p>
      </main>
    );
  }

  if (!user.client.briefDone) {
    redirect('/dashboard/onboarding');
  }

  const reports = user.client.reports;
  const current = reports.at(-1);
  const prev = reports.at(-2);

  return (
    <DashboardClient
      user={{
        name: user.name,
        tariff: user.tariff,
        tariffEnd: user.tariffEnd?.toISOString() ?? null,
      }}
      business={{
        name: user.client.businessName,
        niche: user.client.niche,
        logo: user.client.logo,
        since: user.client.createdAt.toISOString(),
      }}
      reportList={[...reports].reverse().map((r) => ({
        id: r.id,
        month: r.month,
        year: r.year,
        revenue: r.revenue,
        spent: r.spent,
        leads: r.leads,
      }))}
      notes={user.client.messages.map((m) => ({
        id: m.id,
        body: m.body,
        createdAt: m.createdAt.toISOString(),
        authorName: m.sender?.name ?? 'mimi',
        authorAvatar: m.sender?.avatar ?? null,
      }))}
      tasks={user.client.calendarEvents.map((e) => ({
        id: e.id,
        title: e.title,
        kind: e.kind,
        date: e.startAt.toISOString(),
        done: e.done,
        doneAt: e.doneAt?.toISOString() ?? null,
      }))}
      period={current ? { month: current.month, year: current.year } : null}
      metrics={{
        spent: current?.spent ?? 0,
        reach: current?.reach ?? 0,
        clicks: current?.clicks ?? 0,
        leads: current?.leads ?? 0,
        budget: current?.budget ?? 0,
        revenue: current?.revenue ?? 0,
        profileVisits: current?.profileVisits ?? 0,
        campaignCount: current?.campaignCount ?? 0,
        spentDelta: deltaPct(current?.spent, prev?.spent),
        reachDelta: deltaPct(current?.reach, prev?.reach),
        clicksDelta: deltaPct(current?.clicks, prev?.clicks),
        leadsDelta: deltaPct(current?.leads, prev?.leads),
        revenueDelta: deltaPct(current?.revenue, prev?.revenue),
      }}
      reachTrend={reports.map((r) => ({
        label: `${monthName(r.month)} ${String(r.year).slice(2)}`,
        reach: r.reach,
      }))}
      platforms={(current?.platforms ?? []).map((p) => ({
        name: p.name,
        spent: p.spent,
        roas: p.roas,
      }))}
      campaigns={(current?.campaigns ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        platform: c.platform,
        status: c.status,
      }))}
      audience={
        current?.audience
          ? {
              age18_24: current.audience.age18_24,
              age25_34: current.audience.age25_34,
              age35_44: current.audience.age35_44,
              age45plus: current.audience.age45plus,
            }
          : null
      }
    />
  );
}
