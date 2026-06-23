import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ensureAdmin } from '@/lib/api-guard';
import { PaymentStatus } from '@prisma/client';

const schema = z.object({
  clientId: z.string(),
  amount: z.number().nonnegative(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  status: z.enum(['PAID', 'PENDING', 'OVERDUE']).default('PENDING'),
  dueDate: z.string().nullable().optional(),
  paidAt: z.string().nullable().optional(),
  method: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
});

/** Admin: record a payment / invoice for a client period. */
export async function POST(req: Request) {
  if (!(await ensureAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const data = schema.parse(await req.json());
    const payment = await prisma.payment.create({
      data: {
        clientId: data.clientId,
        amount: data.amount,
        month: data.month,
        year: data.year,
        status: data.status as PaymentStatus,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        paidAt: data.paidAt ? new Date(data.paidAt) : data.status === 'PAID' ? new Date() : null,
        method: data.method ?? null,
        note: data.note ?? null,
      },
    });
    return NextResponse.json(payment);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Bad request' }, { status: 400 });
  }
}
