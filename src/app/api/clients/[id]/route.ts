import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ensureAdmin } from '@/lib/api-guard';
import { emailProblem, normalizeEmail } from '@/lib/validation';
import { SALES_STATUSES } from '@/lib/roles';
import { logAudit } from '@/lib/audit';
import { Tariff } from '@prisma/client';

const schema = z.object({
  // Client (project) fields
  businessName: z.string().optional(),
  niche: z.string().optional(),
  logo: z.string().nullable().optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
  tariff: z.enum(['NONE', 'START', 'GROWTH', 'PREMIUM']).optional(),
  salesStatus: z.enum(SALES_STATUSES as unknown as [string, ...string[]]).optional(),
  // Owner (login) fields
  name: z.string().min(2).optional(),
  email: z.string().optional(),
  phone: z.string().nullable().optional(),
  password: z.string().optional(),
  avatar: z.string().nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!(await ensureAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const {
      tariff, name, email, phone, password, avatar, salesStatus,
      ...clientData
    } = schema.parse(await req.json());

    const client = await prisma.client.findUnique({ where: { id: params.id } });
    if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Build the owner (User) update only from the fields that were sent.
    const ownerData: any = {};
    if (tariff) ownerData.tariff = tariff as Tariff;
    if (name !== undefined) ownerData.name = name.trim();
    if (phone !== undefined) ownerData.phone = phone?.trim() || null;
    if (avatar !== undefined) ownerData.avatar = avatar || null;

    if (email !== undefined && email.trim()) {
      const normalized = normalizeEmail(email);
      const err = emailProblem(normalized);
      if (err) return NextResponse.json({ error: err }, { status: 400 });
      const taken = await prisma.user.findFirst({
        where: { email: normalized, id: { not: client.ownerId } },
        select: { id: true },
      });
      if (taken) return NextResponse.json({ error: 'Email уже занят' }, { status: 400 });
      ownerData.email = normalized;
    }

    if (password !== undefined && password.trim()) {
      if (password.length < 6) {
        return NextResponse.json({ error: 'Пароль минимум 6 символов' }, { status: 400 });
      }
      ownerData.password = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.client.update({
      where: { id: params.id },
      data: {
        ...clientData,
        ...(salesStatus ? { salesStatus: salesStatus as any } : {}),
        ...(name !== undefined ? { contactName: name.trim() } : {}),
        ...(Object.keys(ownerData).length ? { owner: { update: ownerData } } : {}),
      },
    });
    await logAudit({
      action: 'updated',
      entity: 'client',
      entityId: params.id,
      summary: `Изменён клиент «${updated.businessName}»`,
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Bad request' }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!(await ensureAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    // Removing the owning user cascades to the client and all its reports.
    const client = await prisma.client.findUnique({ where: { id: params.id } });
    if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await prisma.user.delete({ where: { id: client.ownerId } });
    await logAudit({
      action: 'deleted',
      entity: 'client',
      entityId: params.id,
      summary: `Удалён клиент «${client.businessName}»`,
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Bad request' }, { status: 400 });
  }
}
