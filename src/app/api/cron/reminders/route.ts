import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureAdmin } from '@/lib/api-guard';
import { notify, notifyAdmins } from '@/lib/notify';
import { formatMoney } from '@/lib/utils';

const DAY = 24 * 60 * 60 * 1000;

/**
 * Fan out reminders for:
 *   • payments due within 3 days or overdue (auto-flips PENDING → OVERDUE),
 *   • calendar events starting within 24 hours,
 *   • tasks due within 24 hours and not done.
 * `remindedAt` caps each item to one reminder per day so a daily cron never spams.
 */
async function runReminders() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const notRemindedToday = [{ remindedAt: null }, { remindedAt: { lt: startOfToday } }];
  let payments = 0;
  let events = 0;
  let tasks = 0;

  // ── Payments due soon / overdue ──────────────────────────────
  const duePayments = await prisma.payment.findMany({
    where: {
      status: { in: ['PENDING', 'OVERDUE'] },
      dueDate: { not: null, lte: new Date(now.getTime() + 3 * DAY) },
      OR: notRemindedToday,
    },
    include: { client: { select: { businessName: true, ownerId: true } } },
  });
  for (const p of duePayments) {
    const overdue = p.dueDate! < now;
    if (overdue && p.status === 'PENDING') {
      await prisma.payment.update({ where: { id: p.id }, data: { status: 'OVERDUE' } });
    }
    const dateStr = p.dueDate!.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long' });
    const title = overdue ? 'Просрочена оплата' : 'Скоро оплата';
    const body = `${formatMoney(p.amount)} — ${overdue ? 'срок был' : 'до'} ${dateStr}`;
    if (p.client.ownerId) {
      await notify({ userId: p.client.ownerId, kind: 'PAYMENT', title, body, link: '/dashboard/invoices', email: true });
    }
    await notifyAdmins({ kind: 'PAYMENT', title: `${title}: ${p.client.businessName}`, body, link: `/admin/clients/${p.clientId}` });
    await prisma.payment.update({ where: { id: p.id }, data: { remindedAt: now } });
    payments++;
  }

  // ── Calendar events in the next 24 hours ─────────────────────
  const upcomingEvents = await prisma.calendarEvent.findMany({
    where: { startAt: { gte: now, lte: new Date(now.getTime() + DAY) }, OR: notRemindedToday },
    include: { client: { select: { ownerId: true } } },
  });
  for (const e of upcomingEvents) {
    const when = e.startAt.toLocaleString('ru-RU', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' });
    const body = `${e.title} — ${when}`;
    const staff = new Set<string>();
    if (e.ownerId) staff.add(e.ownerId);
    if (e.assigneeId) staff.add(e.assigneeId);
    for (const uid of staff) {
      await notify({ userId: uid, kind: 'TASK', title: 'Скоро событие', body, link: '/admin/calendar' });
    }
    if (e.client?.ownerId) {
      await notify({ userId: e.client.ownerId, kind: 'TASK', title: 'Скоро событие', body, link: '/dashboard' });
    }
    await prisma.calendarEvent.update({ where: { id: e.id }, data: { remindedAt: now } });
    events++;
  }

  // ── Tasks due in the next 24 hours ───────────────────────────
  const dueTasks = await prisma.task.findMany({
    where: { done: false, dueDate: { not: null, lte: new Date(now.getTime() + DAY) }, OR: notRemindedToday },
  });
  for (const t of dueTasks) {
    const dateStr = t.dueDate!.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long' });
    const body = `${t.title} — до ${dateStr}`;
    if (t.ownerId) {
      await notify({ userId: t.ownerId, kind: 'TASK', title: 'Задача к сроку', body, link: '/admin/sales' });
    } else {
      await notifyAdmins({ kind: 'TASK', title: 'Задача к сроку', body, link: '/admin/sales' });
    }
    await prisma.task.update({ where: { id: t.id }, data: { remindedAt: now } });
    tasks++;
  }

  // ── Напоминания по личным заметкам ────────────────────────
  let notes = 0;
  const dueNotes = await prisma.staffNote.findMany({
    where: { remindAt: { not: null, lte: now }, remindedAt: null },
    select: { id: true, body: true, remindText: true, authorId: true },
  });
  for (const n of dueNotes) {
    await notify({
      userId: n.authorId,
      kind: 'TASK',
      title: 'Напоминание по заметке',
      body: n.remindText || n.body.slice(0, 140),
      link: '/admin/notes',
    });
    await prisma.staffNote.update({ where: { id: n.id }, data: { remindedAt: now } });
    notes++;
  }

  return { payments, events, tasks, notes };
}

// Vercel Cron hits this daily with `Authorization: Bearer ${CRON_SECRET}`.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  const result = await runReminders();
  return NextResponse.json({ ok: true, ...result });
}

// Admin can trigger the sweep manually from the panel.
export async function POST() {
  if (!(await ensureAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const result = await runReminders();
  return NextResponse.json({ ok: true, ...result });
}
