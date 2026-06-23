import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { notifyAdmins } from '@/lib/notify';

const schema = z.object({
  name: z.string().min(2),
  phone: z.string().min(5),
  email: z.string().email(),
  message: z.string().optional(),
});

/** Public: landing-form submission → a new Deal at the top of the pipeline. */
export async function POST(req: Request) {
  try {
    const data = schema.parse(await req.json());
    const deal = await prisma.deal.create({
      data: {
        title: data.name,
        contactName: data.name,
        phone: data.phone,
        email: data.email,
        message: data.message,
        source: 'Лендинг',
        stage: 'NEW',
      },
    });
    await notifyAdmins({
      kind: 'LEAD',
      title: 'Новая заявка с лендинга',
      body: `${data.name} · ${data.phone}`,
      link: `/admin/leads`,
    });
    return NextResponse.json({ id: deal.id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Bad request' }, { status: 400 });
  }
}
