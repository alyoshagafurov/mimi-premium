import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(6),
  role: z.enum(['CLIENT', 'ADMIN']).default('CLIENT'),
  businessName: z.string().optional(),
  niche: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = schema.parse(body);
    const email = data.email.toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: 'Email уже занят' }, { status: 400 });

    // First admin gets ADMIN role; subsequent admin-registrations downgrade to CLIENT
    let role: Role = data.role as Role;
    if (role === 'ADMIN') {
      const adminExists = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
      if (adminExists) role = 'CLIENT';
    }

    const password = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password,
        name: data.name,
        phone: data.phone,
        role,
        ...(role === 'CLIENT' && data.businessName
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
    return NextResponse.json({ error: e?.message ?? 'Bad request' }, { status: 400 });
  }
}
