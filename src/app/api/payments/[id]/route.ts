import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ensureAdmin } from '@/lib/api-guard';
import { logAudit } from '@/lib/audit';
import { PaymentStatus } from '@prisma/client';

const schema = z.object({
  amount: z.number().nonnegative().optional(),
  status: z.enum(['PAID', 'PENDING', 'OVERDUE']).optional(),
  dueDate: z.string().nullable().optional(),
  method: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!(await ensureAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const { dueDate, status, ...rest } = schema.parse(await req.json());
    const payment = await prisma.payment.update({
      where: { id: params.id },
      data: {
        ...rest,
        ...(status ? { status: status as PaymentStatus, paidAt: status === 'PAID' ? new Date() : null } : {}),
        ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
      },
    });

    // ТЗ: после оплаты лид становится партнёром и переходит в «Проекты».
    if (status === 'PAID') {
      const client = await prisma.client.findUnique({
        where: { id: payment.clientId },
        select: { salesStatus: true, businessName: true },
      });
      if (client && client.salesStatus !== 'PARTNER') {
        await prisma.client.update({
          where: { id: payment.clientId },
          data: { salesStatus: 'PARTNER', status: 'ACTIVE' },
        });
        await logAudit({
          action: 'status',
          entity: 'client',
          entityId: payment.clientId,
          summary: `«${client.businessName}» переведён в партнёры после оплаты`,
        });
      }
    }

    return NextResponse.json(payment);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Bad request' }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!(await ensureAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  await prisma.payment.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
