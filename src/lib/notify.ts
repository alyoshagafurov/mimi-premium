import { prisma } from './prisma';
import type { NotificationKind } from '@prisma/client';

type NotifyArgs = {
  userId: string;
  kind?: NotificationKind;
  title: string;
  body?: string;
  link?: string;
};

/**
 * Create an in-app notification for a user.
 * Email/Telegram delivery hooks can be plugged in here later.
 */
export async function notify({ userId, kind = 'SYSTEM', title, body, link }: NotifyArgs) {
  return prisma.notification.create({
    data: { userId, kind, title, body, link },
  });
}

/**
 * Notify all admins.
 */
export async function notifyAdmins(args: Omit<NotifyArgs, 'userId'>) {
  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
  await Promise.all(admins.map((a) => notify({ ...args, userId: a.id })));
}
