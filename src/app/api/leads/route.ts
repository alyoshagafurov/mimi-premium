import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { notifyAdmins } from '@/lib/notify';
import { rateLimit } from '@/lib/rate-limit';
import { clientIp } from '@/lib/request';
import { captureError } from '@/lib/monitoring';

const schema = z.object({
  name: z.string().min(2).max(120),
  phone: z.string().min(5).max(40),
  email: z.string().email().max(160),
  message: z.string().max(2000).optional(),
});

/** Public: landing-form submission → a new Deal at the top of the pipeline. */
export async function POST(req: Request) {
  // Throttle: max 5 submissions per IP per 5 minutes
  const ip = clientIp(req);
  if (!(await rateLimit(`leads:${ip}`, 5, 5 * 60 * 1000)).ok) {
    return NextResponse.json({ error: 'Слишком много заявок. Попробуйте позже.' }, { status: 429 });
  }

  try {
    const data = schema.parse(await req.json());
    const deal = await prisma.deal.create({
      data: {
        title: data.name,
        contactName: data.name,
        phone: data.phone,
        email: data.email,
        message: data.message,
        source: 'Лендинг',
        stage: 'NEW',
      },
    });
    await notifyAdmins({
      kind: 'LEAD',
      title: 'Новая заявка с лендинга',
      body: `${data.name} · ${data.phone}${data.email ? ` · ${data.email}` : ''}`,
      link: `/admin/leads`,
      email: true,
    });
    return NextResponse.json({ id: deal.id });
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return NextResponse.json({ error: 'Проверьте корректность полей' }, { status: 400 });
    }
    captureError(e, { where: 'leads' });
    return NextResponse.json({ error: 'Не удалось отправить заявку' }, { status: 400 });
  }
}
