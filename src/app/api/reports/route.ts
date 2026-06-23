import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ensureAdmin } from '@/lib/api-guard';

const schema = z.object({
  clientId: z.string(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
});

/** Admin: create an (empty) monthly report for a client. */
export async function POST(req: Request) {
  if (!(await ensureAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const data = schema.parse(await req.json());

    const exists = await prisma.monthlyReport.findUnique({
      where: { clientId_year_month: { clientId: data.clientId, year: data.year, month: data.month } },
    });
    if (exists) return NextResponse.json({ error: 'Отчёт за этот месяц уже существует' }, { status: 400 });

    const report = await prisma.monthlyReport.create({
      data: {
        clientId: data.clientId,
        month: data.month,
        year: data.year,
        // Seed the two default platforms + an empty audience row so the editor has fields to fill.
        platforms: {
          create: [
            { name: 'Instagram', spent: 0, roas: 0 },
            { name: 'Facebook', spent: 0, roas: 0 },
          ],
        },
        audience: { create: {} },
      },
    });
    return NextResponse.json({ id: report.id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Bad request' }, { status: 400 });
  }
}
