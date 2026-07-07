import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';
import { clientIp } from '@/lib/request';
import { captureError } from '@/lib/monitoring';

const schema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().max(160),
  phone: z.string().max(40).optional(),
  password: z.string().min(8).max(200),
  businessName: z.string().min(2).max(120).optional(),
  niche: z.string().max(120).optional(),
});

export async function POST(req: Request) {
  // Throttle: max 5 registrations per IP per 10 minutes
  const ip = clientIp(req);
  const limited = await rateLimit(`register:${ip}`, 5, 10 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json({ error: 'Слишком много попыток. Попробуйте позже.' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const data = schema.parse(body);
    const email = data.email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: 'Email уже занят' }, { status: 400 });

    // Public self-registration ALWAYS creates a CLIENT. Admin accounts are
    // provisioned via the seed/console only — never through this endpoint.
    const password = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password,
        name: data.name,
        phone: data.phone,
        role: 'CLIENT',
        ...(data.businessName
          ? {
              client: {
                create: {
                  businessName: data.businessName,
                  niche: data.niche ?? 'Не указана',
                },
              },
            }
          : {}),
      },
    });

    return NextResponse.json({ id: user.id, role: user.role });
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return NextResponse.json({ error: 'Проверьте корректность полей' }, { status: 400 });
    }
    captureError(e, { where: 'register' });
    return NextResponse.json({ error: 'Не удалось зарегистрироваться' }, { status: 400 });
  }
}
