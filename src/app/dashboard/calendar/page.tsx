import { redirect } from 'next/navigation';
import { getSafeSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

const KIND_LABEL: Record<string, string> = {
  MEETING: 'Встреча',
  CALL: 'Созвон',
  CONSULTATION: 'Консультация',
  PAYMENT: 'Оплата',
  COLLABORATION: 'Сотрудничество',
  SHOOTING: 'Съёмка',
  LAUNCH: 'Запуск',
  RETARGETING: 'Ретаргет',
  DEADLINE: 'Дедлайн',
  TASK: 'Задача',
  OTHER: 'Событие',
};

function fmt(d: Date) {
  return new Date(d).toLocaleString('ru-RU', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' });
}

export default async function ClientCalendarPage() {
  const session = await getSafeSession();
  const me = session?.user as any;
  if (!me?.id) redirect('/auth/login?callbackUrl=/dashboard/calendar');

  const client = await prisma.client.findUnique({ where: { ownerId: me.id }, select: { id: true } });
  // Клиент видит ТОЛЬКО события своего проекта (внутренние задачи сотрудников и
  // события других проектов сюда не попадают — фильтр строго по clientId).
  const events = client
    ? await prisma.calendarEvent.findMany({
        where: { clientId: client.id },
        orderBy: { startAt: 'asc' },
        select: { id: true, title: true, description: true, kind: true, startAt: true, endAt: true },
      })
    : [];

  const now = new Date();
  const upcoming = events.filter((e) => new Date(e.startAt) >= now);
  const past = events.filter((e) => new Date(e.startAt) < now).reverse();

  const Card = ({ e }: { e: (typeof events)[number] }) => (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-brand-lime/25 bg-brand-lime/[0.06] px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] text-brand-lime">
            {KIND_LABEL[e.kind] ?? 'Событие'}
          </span>
          <span className="truncate text-sm font-medium text-light">{e.title}</span>
        </div>
        {e.description && <div className="mt-1 truncate text-[12px] text-light/50">{e.description}</div>}
      </div>
      <div className="shrink-0 text-[12px] text-light/55">{fmt(e.startAt)}</div>
    </div>
  );

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 lg:px-6">
      <div className="mb-6">
        <p className="text-[10px] uppercase tracking-[0.32em] text-brand-orange">Календарь</p>
        <h1 className="mt-2 font-display text-2xl font-extrabold text-light sm:text-3xl">События проекта</h1>
      </div>

      <h2 className="mb-3 text-[11px] uppercase tracking-[0.2em] text-light/45">Предстоящие</h2>
      <div className="space-y-2">
        {upcoming.length === 0 && (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 text-center text-sm text-light/45">
            Предстоящих событий нет.
          </div>
        )}
        {upcoming.map((e) => <Card key={e.id} e={e} />)}
      </div>

      {past.length > 0 && (
        <>
          <h2 className="mb-3 mt-8 text-[11px] uppercase tracking-[0.2em] text-light/45">Прошедшие</h2>
          <div className="space-y-2 opacity-70">
            {past.map((e) => <Card key={e.id} e={e} />)}
          </div>
        </>
      )}
    </main>
  );
}
