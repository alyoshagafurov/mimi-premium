import { prisma } from '@/lib/prisma';
import { AnalyticsClient } from './AnalyticsClient';

export default async function AdminAnalyticsPage() {
  const [clients, deals, payments, tasks, allInvoices] = await Promise.all([
    prisma.client.findMany({ include: { owner: { select: { tariff: true, tariffEnd: true, createdAt: true } } } }),
    prisma.deal.findMany(),
    prisma.payment.findMany(),
    prisma.task.findMany({ where: { done: false } }),
    prisma.invoice.findMany(),
  ]);

  const now = new Date();
  const curYear = now.getFullYear();

  // Revenue по 12 месяцам
  const monthLabels = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];
  const revenueByMonth = monthLabels.map((label, idx) => ({
    label,
    amount: payments
      .filter((p) => p.status === 'PAID' && p.year === curYear && p.month === idx + 1)
      .reduce((s, p) => s + p.amount, 0),
  }));

  const totalRevenue = revenueByMonth.reduce((s, b) => s + b.amount, 0);
  const avgCheck = clients.length ? totalRevenue / clients.length : 0;
  const wonDeals = deals.filter((d) => d.stage === 'WON').length;
  const totalDeals = deals.length;
  const conversionRate = totalDeals ? (wonDeals / totalDeals) * 100 : 0;

  // Распределение по тарифам
  const tariffDist = ['START', 'GROWTH', 'PREMIUM'].map((t) => ({
    tariff: t,
    count: clients.filter((c) => c.owner.tariff === t).length,
  }));

  // Retention — клиенты активные больше 3 месяцев
  const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const retained = clients.filter((c) => c.owner.createdAt < threeMonthsAgo && c.status === 'ACTIVE').length;
  const retentionRate = clients.length ? (retained / clients.length) * 100 : 0;

  return (
    <AnalyticsClient
      stats={{
        totalRevenue,
        avgCheck,
        clientsTotal: clients.length,
        clientsActive: clients.filter((c) => c.status === 'ACTIVE').length,
        dealsTotal: totalDeals,
        dealsWon: wonDeals,
        conversionRate,
        retentionRate,
        openTasks: tasks.length,
        invoicesPaid: allInvoices.filter((i) => i.status === 'PAID').length,
        invoicesOverdue: allInvoices.filter((i) => i.status === 'OVERDUE').length,
      }}
      revenueByMonth={revenueByMonth}
      tariffDist={tariffDist}
    />
  );
}
