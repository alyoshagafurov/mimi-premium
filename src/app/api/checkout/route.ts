import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Tariff } from '@prisma/client';

const schema = z.object({ plan: z.enum(['START', 'GROWTH', 'PREMIUM']) });

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await req.json();
    const { plan } = schema.parse(body);
    const end = new Date();
    end.setMonth(end.getMonth() + 1);
    await prisma.user.update({
      where: { id: (session.user as any).id },
      data: { tariff: plan as Tariff, tariffEnd: end },
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Bad request' }, { status: 400 });
  }
}
