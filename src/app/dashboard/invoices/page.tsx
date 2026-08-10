import { redirect } from 'next/navigation';
import { getSafeSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { formatMoney, formatDate, monthLabel, paymentStatusLabel, paymentStatusAccent } from '@/lib/utils';

export default async function ClientFinancePage() {
  const session = await getSafeSession();
  const me = session?.user as any;
  if (!me?.id) redirect('/auth/login?callbackUrl=/dashboard/invoices');

  const client = await prisma.client.findUnique({ where: { ownerId: me.id }, select: { id: true } });
  const payments = client
    ? await prisma.payment.findMany({
        where: { clientId: client.id },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
      })
    : [];

  const now = new Date();
  // Ближайшая неоплаченная — «следующая дата оплаты».
  const upcoming = payments
    .filter((p) => p.status !== 'PAID' && p.dueDate)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())[0];
  const overdueTotal = payments
    .filter((p) => p.status === 'OVERDUE' || (p.status === 'PENDING' && p.dueDate && new Date(p.dueDate) < now))
    .reduce((s, p) => s + p.amount, 0);

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 lg:px-6">
      <div className="mb-6">
        <p className="text-[10px] uppercase tracking-[0.32em] text-brand-orange">Финансы</p>
        <h1 className="mt-2 font-display text-2xl font-extrabold text-light sm:text-3xl">Оплаты</h1>
      </div>

      {/* Напоминание об оплате */}
      {overdueTotal > 0 && (
        <div className="mb-4 rounded-2xl border border-rose-400/30 bg-rose-400/[0.06] p-5">
          <p className="text-[10px] uppercase tracking-[0.24em] text-rose-300">Напоминание об оплате</p>
          <p className="mt-2 text-sm text-light/85">
            Есть просроченные платежи на сумму <span className="font-bold text-rose-200">{formatMoney(overdueTotal)}</span>. Пожалуйста, свяжитесь с менеджером.
          </p>
        </div>
      )}

      {/* Следующая дата оплаты */}
      {upcoming && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-brand-lime/25 bg-brand-lime/[0.05] p-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-brand-lime">Следующая оплата</p>
            <p className="mt-2 text-sm text-light/70">
              за {monthLabel(upcoming.month, upcoming.year)} · до {formatDate(upcoming.dueDate!)}
            </p>
          </div>
          <div className="font-display text-2xl font-extrabold text-light">{formatMoney(upcoming.amount)}</div>
        </div>
      )}

      {/* История платежей */}
      <h2 className="mb-3 text-[11px] uppercase tracking-[0.2em] text-light/45">История платежей</h2>
      <div className="space-y-2">
        {payments.length === 0 && (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 text-center text-sm text-light/45">
            Пока нет платежей.
          </div>
        )}
        {payments.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4">
            <div>
              <div className="font-display text-base font-bold text-light">{monthLabel(p.month, p.year)}</div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-light/40">
                {p.paidAt ? <span>оплачено {formatDate(p.paidAt)}</span> : p.dueDate ? <span>до {formatDate(p.dueDate)}</span> : null}
                {p.method && <span>· {p.method}</span>}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className={`rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${paymentStatusAccent(p.status)}`}>
                {paymentStatusLabel(p.status)}
              </span>
              <div className="font-display text-xl font-extrabold text-light">{formatMoney(p.amount)}</div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
