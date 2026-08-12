import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSafeSession } from '@/lib/session';
import { isAdminLike, SALES_STATUSES } from '@/lib/roles';
import { normalizeEmail } from '@/lib/validation';
import { logAudit } from '@/lib/audit';

const schema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().max(80).optional(),
  phone: z.string().max(40).optional(),
  email: z.string().max(160).optional(),
  businessName: z.string().max(160).optional(),
  niche: z.string().max(160).optional(),
  salesStatus: z.enum(SALES_STATUSES as unknown as [string, ...string[]]).default('NEW_LEAD'),
  packageType: z.string().optional(),
  sourceType: z.enum(['VIDEO', 'OTHER']).default('OTHER'),
  sourceUrl: z.string().max(500).optional(),
  sourceCover: z.string().optional(),
  sourceNote: z.string().max(500).optional(),
  comment: z.string().max(2000).optional(),
  assignedToId: z.string().optional(),
});

/** Sales / admin / ops: create a CRM lead. */
export async function POST(req: Request) {
  const session = await getSafeSession();
  const me = session?.user as any;
  const role = me?.role as string | undefined;
  if (!isAdminLike(role) && role !== 'SALES') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  try {
    const d = schema.parse(await req.json());
    const firstName = d.firstName.trim();
    const lastName = d.lastName?.trim() || '';
    const fullName = [firstName, lastName].filter(Boolean).join(' ');

    // A Client always needs an owning User; leads rarely have a real login yet,
    // so fall back to a placeholder address the admin can replace later.
    let email = d.email ? normalizeEmail(d.email) : '';
    if (email) {
      const taken = await prisma.user.findUnique({ where: { email } });
      if (taken) return NextResponse.json({ error: 'Клиент с таким email уже есть' }, { status: 400 });
    } else {
      email = `lead-${randomUUID().slice(0, 8)}@lead.mimitj.agency`;
    }

    const user = await prisma.user.create({
      data: {
        email,
        password: await bcrypt.hash(randomUUID(), 10),
        name: fullName,
        phone: d.phone?.trim() || null,
        role: 'CLIENT',
        emailVerified: new Date(),
        client: {
          create: {
            businessName: d.businessName?.trim() || fullName,
            niche: d.niche?.trim() || 'Не указана',
            contactName: fullName,
            firstName,
            lastName: lastName || null,
            salesStatus: d.salesStatus as any,
            ...(d.packageType ? { packageType: d.packageType as any } : {}),
            sourceType: d.sourceType as any,
            sourceUrl: d.sourceUrl?.trim() || null,
            sourceCover: d.sourceCover || null,
            sourceNote: d.sourceNote?.trim() || null,
            comment: d.comment?.trim() || null,
            createdById: me?.id ?? null,
            // Sales keep their own leads; admin/ops may assign to someone else.
            assignedToId: d.assignedToId || me?.id || null,
          },
        },
      },
      include: { client: true },
    });

    await logAudit({
      action: 'created',
      entity: 'lead',
      entityId: user.client?.id,
      summary: `Добавлен лид «${fullName}»`,
    });

    return NextResponse.json({ id: user.client?.id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Bad request' }, { status: 400 });
  }
}
