import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ensureAdmin } from '@/lib/api-guard';
import { CampaignStatus } from '@prisma/client';

const schema = z.object({
  reportId: z.string(),
  name: z.string().min(1),
  platform: z.string().min(1),
  status: z.enum(['ACTIVE', 'PAUSED', 'FINISHED']).default('ACTIVE'),
});

/** Admin: add a campaign to a monthly report. */
export async function POST(req: Request) {
  if (!(await ensureAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const data = schema.parse(await req.json());
    const campaign = await prisma.campaign.create({
      data: {
        reportId: data.reportId,
        name: data.name,
        platform: data.platform,
        status: data.status as CampaignStatus,
      },
    });
    return NextResponse.json(campaign);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Bad request' }, { status: 400 });
  }
}
