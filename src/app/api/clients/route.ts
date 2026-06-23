import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ensureAdmin } from '@/lib/api-guard';
import { Tariff } from '@prisma/client';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  businessName: z.string().min(1),
  niche: z.string().optional(),
  tariff: z.enum(['NONE', 'START', 'GROWTH', 'PREMIUM']).default('NONE'),
});

/** Admin: create a new client (User with CLIENT role + linked Client business). */
export async function POST(req: Request) {
  if (!(await ensureAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const data = schema.parse(await req.json());
    const email = data.email.toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: 'Email уже занят' }, { status: 400 });

    const password = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password,
        name: data.name,
        phone: data.phone,
        role: 'CLIENT',
        tariff: data.tariff as Tariff,
        client: {
          create: {
            businessName: data.businessName,
            niche: data.niche?.trim() || 'Не указана',
          },
        },
      },
      include: { client: true },
    });

    return NextResponse.json({ id: user.client?.id, userId: user.id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Bad request' }, { status: 400 });
  }
}
