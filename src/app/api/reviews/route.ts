import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';
import { clientIp } from '@/lib/request';
import { notifyAdmins } from '@/lib/notify';

const schema = z.object({
  name: z.string().trim().min(2, 'Укажите имя').max(80, 'Имя слишком длинное'),
  company: z.string().trim().max(80, 'Слишком длинное название').optional().default(''),
  rating: z.coerce.number().int().min(1, 'Поставьте оценку').max(5),
  text: z.string().trim().min(10, 'Напишите хотя бы пару предложений').max(1500, 'Отзыв слишком длинный'),
  /** Honeypot: поле скрыто от людей, его заполняют только боты. */
  website: z.string().optional(),
});

/**
 * Публичный отзыв со страницы /reviews.
 * Сохраняется скрытым (`published: false`, `fromSite: true`): на сайт компании
 * он попадает только после того, как админ посмотрит и опубликует его.
 */
export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!(await rateLimit(`review:${ip}`, 3, 60 * 60 * 1000)).ok) {
    return NextResponse.json({ error: 'Слишком много отзывов подряд. Попробуйте чуть позже.' }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Проверьте поля' }, { status: 400 });
  }
  const d = parsed.data;

  // Бот заполнил скрытое поле — отвечаем «успех», но ничего не сохраняем.
  if (d.website) return NextResponse.json({ ok: true });

  await prisma.testimonial.create({
    data: {
      name: d.name,
      company: d.company || null,
      rating: d.rating,
      text: d.text,
      published: false,
      fromSite: true,
    },
  });

  await notifyAdmins({
    kind: 'MESSAGE',
    title: 'Новый отзыв на сайте',
    body: `${d.name} · ${'★'.repeat(d.rating)} — «${d.text.slice(0, 90)}${d.text.length > 90 ? '…' : ''}»`,
    link: '/admin/reviews',
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
