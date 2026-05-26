import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const schema = z.object({
  clientId: z.string(),
  date: z.string(),
  clicks: z.number().nonnegative().default(0),
  leads: z.number().nonnegative().default(0),
  qualified: z.number().nonnegative().default(0),
  sales: z.number().nonnegative().default(0),
  spent: z.number().nonnegative().default(0),
  revenue: z.number().nonnegative().default(0),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const body = await req.json();
    const data = schema.parse(body);
    const romi = data.spent > 0 ? Math.round(((data.revenue - data.spent) / data.spent) * 100) : 0;
    const metric = await prisma.metric.create({
      data: { ...data, date: new Date(data.date), romi },
    });
    return NextResponse.json(metric);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Bad request' }, { status: 400 });
  }
}
