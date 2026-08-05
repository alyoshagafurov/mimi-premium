import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ensureAdmin } from '@/lib/api-guard';

const schema = z.object({
  spent: z.number().nonnegative().optional(),
  budget: z.number().nonnegative().optional(),
  reach: z.number().int().nonnegative().optional(),
  clicks: z.number().int().nonnegative().optional(),
  leads: z.number().int().nonnegative().optional(),
  revenue: z.number().nonnegative().optional(),
  profileVisits: z.number().int().nonnegative().optional(),
  campaignCount: z.number().int().nonnegative().optional(),
  platforms: z
    .array(
      z.object({
        name: z.string().min(1),
        spent: z.number().nonnegative().default(0),
        roas: z.number().nonnegative().default(0),
      }),
    )
    .optional(),
  audience: z
    .object({
      age18_24: z.number().int().nonnegative().default(0),
      age25_34: z.number().int().nonnegative().default(0),
      age35_44: z.number().int().nonnegative().default(0),
      age45plus: z.number().int().nonnegative().default(0),
    })
    .optional(),
});

/** Admin: update a monthly report's metrics, per-platform split and audience breakdown. */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!(await ensureAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const { platforms, audience, ...metrics } = schema.parse(await req.json());

    await prisma.$transaction(async (tx) => {
      if (Object.keys(metrics).length) {
        await tx.monthlyReport.update({ where: { id: params.id }, data: metrics });
      }

      if (platforms) {
        for (const p of platforms) {
          await tx.platform.upsert({
            where: { reportId_name: { reportId: params.id, name: p.name } },
            create: { reportId: params.id, name: p.name, spent: p.spent, roas: p.roas },
            update: { spent: p.spent, roas: p.roas },
          });
        }
      }

      if (audience) {
        await tx.audienceBreakdown.upsert({
          where: { reportId: params.id },
          create: { reportId: params.id, ...audience },
          update: audience,
        });
      }
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Bad request' }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!(await ensureAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    await prisma.monthlyReport.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Bad request' }, { status: 400 });
  }
}
