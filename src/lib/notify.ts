import { prisma } from './prisma';
import type { NotificationKind } from '@prisma/client';
import { sendEmail, emailLayout } from './email';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mimitj.agency';

type NotifyArgs = {
  userId: string;
  kind?: NotificationKind;
  title: string;
  body?: string;
  link?: string;
  /** Also deliver by email (if the user has an email + email is configured). */
  email?: boolean;
};

/**
 * Create an in-app notification for a user, optionally also emailing them.
 * Email delivery is a no-op until RESEND_API_KEY is configured.
 */
export async function notify({ userId, kind = 'SYSTEM', title, body, link, email }: NotifyArgs) {
  const notification = await prisma.notification.create({
    data: { userId, kind, title, body, link },
  });

  if (email) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (user?.email) {
      await sendEmail({
        to: user.email,
        subject: title,
        html: emailLayout({
          heading: title,
          body: body ?? '',
          ctaLabel: link ? 'Открыть в кабинете' : undefined,
          ctaHref: link ? `${APP_URL}${link}` : undefined,
        }),
      });
    }
  }

  return notification;
}

/**
 * Notify all admins (in-app; pass email:true to also email them).
 */
export async function notifyAdmins(args: Omit<NotifyArgs, 'userId'>) {
  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
  await Promise.all(admins.map((a) => notify({ ...args, userId: a.id })));
}

/**
 * Notify everyone who works the sales pipeline (admin, ops director, sales).
 * Used when a new lead lands so the sales team can pick it up.
 */
export async function notifySales(args: Omit<NotifyArgs, 'userId'>) {
  const reps = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'OPS_DIRECTOR', 'SALES'] } },
    select: { id: true },
  });
  await Promise.all(reps.map((r) => notify({ ...args, userId: r.id })));
}
