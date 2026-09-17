import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { notifyAdmins } from '@/lib/notify';
import { rateLimit } from '@/lib/rate-limit';
import { clientIp } from '@/lib/request';
import { captureError } from '@/lib/monitoring';

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(5).max(40),
  email: z.union([z.literal(''), z.string().trim().email().max(160)]).optional(),
  message: z.string().max(2000).optional(),
  source: z.enum(['landing', 'contacts']).optional(),
  website: z.string().optional(), // honeypot
});

/**
 * Public: заявка с сайта → новый лид в «Продажах» (статус «Новый лид»).
 * Раньше заявка уходила в таблицу сделок, которой в админке больше нет.
 */
export async function POST(req: Request) {
  // Throttle: max 5 submissions per IP per 5 minutes
  const ip = clientIp(req);
  if (!(await rateLimit(`leads:${ip}`, 5, 5 * 60 * 1000)).ok) {
    return NextResponse.json({ error: 'Слишком много заявок. Попробуйте позже.' }, { status: 429 });
  }

  try {
    const data = schema.parse(await req.json());
    if (data.website) return NextResponse.json({ ok: true });

    // Лиду нужен владелец-пользователь. Настоящий email ему не ставим: иначе
    // человек потом не сможет сам зарегистрироваться с этим адресом.
    const from = data.source === 'contacts' ? 'страница «Контакты»' : 'главная страница';
    const comment = [data.message?.trim(), data.email ? `Email: ${data.email}` : ''].filter(Boolean).join('\n\n') || null;

    const user = await prisma.user.create({
      data: {
        email: `lead-${randomUUID().slice(0, 8)}@lead.mimitj.agency`,
        password: await bcrypt.hash(randomUUID(), 10),
        name: data.name,
        phone: data.phone,
        role: 'CLIENT',
        client: {
          create: {
            businessName: data.name,
            niche: 'Не указана',
            contactName: data.name,
            firstName: data.name,
            salesStatus: 'NEW_LEAD',
            sourceType: 'OTHER',
            sourceNote: `Заявка с сайта — ${from}`,
            comment,
          },
        },
      },
      select: { client: { select: { id: true } } },
    });
    const id = user.client?.id;

    await notifyAdmins({
      kind: 'LEAD',
      title: 'Новая заявка с сайта',
      body: `${data.name} · ${data.phone}`,
      link: id ? `/admin/sales/${id}` : '/admin/sales',
      email: true,
    });
    return NextResponse.json({ id });
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return NextResponse.json({ error: 'Проверьте имя и телефон' }, { status: 400 });
    }
    captureError(e, { where: 'leads' });
    return NextResponse.json({ error: 'Не удалось отправить заявку' }, { status: 400 });
  }
}
