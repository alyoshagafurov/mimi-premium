import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatMoney, formatDate } from '@/lib/utils';

const STATUS_LABEL = {
  DRAFT: 'Черновик',
  SENT: 'Выставлен',
  PAID: 'Оплачен',
  OVERDUE: 'Просрочен',
  CANCELLED: 'Отменён',
} as const;

const STATUS_COLOR = {
  DRAFT: 'border-white/10 bg-white/[0.03] text-light/55',
  SENT: 'border-sky-400/30 bg-sky-400/[0.06] text-sky-300',
  PAID: 'border-brand-lime/30 bg-brand-lime/[0.06] text-brand-lime',
  OVERDUE: 'border-rose-400/30 bg-rose-400/[0.06] text-rose-300',
  CANCELLED: 'border-white/10 bg-white/[0.03] text-light/40',
} as const;

export default async function ClientInvoicesPage() {
  const session = await getServerSession(authOptions);
  const me = session?.user as any;
  const client = await prisma.client.findUnique({ where: { ownerId: me.id }, select: { id: true } });
  const invoices = client
    ? await prisma.invoice.findMany({ where: { clientId: client.id }, orderBy: { issuedAt: 'desc' } })
    : [];

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 lg:px-6">
      <div className="mb-6">
        <p className="text-[10px] uppercase tracking-[0.32em] text-brand-orange">Финансы</p>
        <h1 className="mt-2 font-display text-2xl font-extrabold text-light sm:text-3xl">Счета</h1>
      </div>
      <div className="space-y-2">
        {invoices.length === 0 && (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 text-center text-sm text-light/45">
            Пока нет выставленных счетов.
          </div>
        )}
        {invoices.map((inv) => (
          <div key={inv.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4">
            <div>
              <div className="font-display text-base font-bold text-light">{inv.number}</div>
              {inv.description && <div className="text-[12px] text-light/55">{inv.description}</div>}
              <div className="mt-1 flex items-center gap-3 text-[11px] text-light/40">
                <span>{formatDate(inv.issuedAt)}</span>
                {inv.dueDate && <span>· до {formatDate(inv.dueDate)}</span>}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className={`rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${STATUS_COLOR[inv.status]}`}>
                {STATUS_LABEL[inv.status]}
              </span>
              <div className="font-display text-xl font-extrabold text-light">{formatMoney(inv.amount)}</div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
