import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { getSafeSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { isStaff } from '@/lib/roles';

const schema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string().min(8).optional(),
  jobTitle: z.string().max(80).optional(),
  bio: z.string().max(1000).optional(),
  banner: z.string().nullable().optional(),
});

export async function PATCH(req: Request) {
  const session = await getSafeSession();
  // Свой профиль правит любой сотрудник, не только администратор.
  if (!session?.user || !isStaff((session.user as any).role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const body = await req.json();
    const data = schema.parse(body);
    const update: any = { ...data };
    if (data.email) update.email = data.email.toLowerCase();
    if (data.password) update.password = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.update({ where: { id: (session.user as any).id }, data: update });
    return NextResponse.json({ id: user.id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Bad request' }, { status: 400 });
  }
}
