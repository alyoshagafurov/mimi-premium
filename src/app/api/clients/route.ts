import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ensureAdminLike } from '@/lib/api-guard';
import { emailProblem, normalizeEmail } from '@/lib/validation';
import { SALES_STATUSES } from '@/lib/roles';
import { logAudit } from '@/lib/audit';
import { Tariff } from '@prisma/client';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().optional(),
  password: z.string().optional(),
  phone: z.string().optional(),
  businessName: z.string().optional(),
  niche: z.string().optional(),
  tariff: z.enum(['NONE', 'START', 'GROWTH', 'PREMIUM']).default('NONE'),
  salesStatus: z.enum(SALES_STATUSES as unknown as [string, ...string[]]).default('NEW_LEAD'),
});

/**
 * Admin/ops: create a client or a quick lead.
 * - Full client: pass email + password → the client can log in immediately
 *   (email is pre-verified, since an admin vouches for it).
 * - Quick lead: email/password optional → we generate a placeholder login that
 *   the admin can replace later from the client card.
 */
export async function POST(req: Request) {
  if (!(await ensureAdminLike())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const data = schema.parse(await req.json());
    const name = data.name.trim();

    let email = data.email ? normalizeEmail(data.email) : '';
    if (email) {
      const err = emailProblem(email);
      if (err) return NextResponse.json({ error: err }, { status: 400 });
    } else {
      email = `lead-${randomUUID().slice(0, 8)}@lead.mimitj.agency`; // placeholder for a lead
    }

    if (data.password && data.password.length < 6) {
      return NextResponse.json({ error: 'Пароль минимум 6 символов' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: 'Email уже занят' }, { status: 400 });

    const rawPassword = data.password || randomUUID(); // random if the admin didn't set one
    const password = await bcrypt.hash(rawPassword, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password,
        name,
        phone: data.phone?.trim() || null,
        role: 'CLIENT',
        tariff: data.tariff as Tariff,
        emailVerified: new Date(), // admin-created → can log in right away
        client: {
          create: {
            businessName: data.businessName?.trim() || name,
            niche: data.niche?.trim() || 'Не указана',
            contactName: name,
            salesStatus: data.salesStatus as any,
          },
        },
      },
      include: { client: true },
    });

    await logAudit({
      action: 'created',
      entity: 'client',
      entityId: user.client?.id,
      summary: `Создан клиент/лид «${data.businessName?.trim() || name}»`,
    });

    return NextResponse.json({ id: user.client?.id, userId: user.id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Bad request' }, { status: 400 });
  }
}
