import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notifyAdmins } from '@/lib/notify';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const me = session.user as any;
  const body = await req.json();
  const client = await prisma.client.findUnique({ where: { ownerId: me.id } });
  if (!client) return NextResponse.json({ error: 'no_client' }, { status: 400 });
  const updated = await prisma.client.update({
    where: { id: client.id },
    data: {
      briefDone: true,
      briefGoals: body.goals ?? null,
      briefTargetAudience: body.targetAudience ?? null,
      briefBudget: body.budget ? parseFloat(body.budget) : null,
      briefCompetitors: body.competitors ?? null,
      briefUSP: body.usp ?? null,
    },
  });
  await notifyAdmins({
    kind: 'SYSTEM',
    title: 'Клиент заполнил бриф',
    body: `${client.businessName}`,
    link: `/admin/clients/${client.id}`,
  });
  return NextResponse.json({ ok: true, client: updated });
}
