import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notify } from '@/lib/notify';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const me = session.user as any;
  const url = new URL(req.url);
  const requestedClient = url.searchParams.get('clientId');

  let clientId: string | null = requestedClient;
  if (me.role === 'CLIENT') {
    const c = await prisma.client.findUnique({ where: { ownerId: me.id }, select: { id: true } });
    if (!c) return NextResponse.json({ messages: [], clientId: null });
    clientId = c.id;
  }
  if (!clientId) return NextResponse.json({ messages: [], clientId: null });

  const messages = await prisma.message.findMany({
    where: { clientId },
    orderBy: { createdAt: 'asc' },
    take: 200,
    include: { sender: { select: { id: true, name: true, role: true } } },
  });

  await prisma.message.updateMany({
    where: { clientId, read: false, NOT: { senderId: me.id } },
    data: { read: true },
  });

  return NextResponse.json({ messages, clientId });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const me = session.user as any;
  const { clientId: requestedClient, body } = await req.json();

  let clientId: string | null = requestedClient;
  if (me.role === 'CLIENT') {
    const c = await prisma.client.findUnique({ where: { ownerId: me.id }, select: { id: true } });
    if (!c) return NextResponse.json({ error: 'no_client' }, { status: 400 });
    clientId = c.id;
  }
  if (!clientId || !body?.trim()) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }

  const msg = await prisma.message.create({
    data: { clientId, senderId: me.id, body: body.trim() },
    include: { sender: { select: { id: true, name: true, role: true } } },
  });

  // notify the other side
  if (me.role === 'CLIENT') {
    const client = await prisma.client.findUnique({ where: { id: clientId }, include: { owner: true } });
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
    await Promise.all(
      admins.map((a) =>
        notify({
          userId: a.id,
          kind: 'MESSAGE',
          title: `Сообщение от ${client?.businessName ?? me.name}`,
          body: body.slice(0, 80),
          link: `/admin/clients/${clientId}`,
        }),
      ),
    );
  } else {
    const c = await prisma.client.findUnique({ where: { id: clientId }, include: { owner: true } });
    if (c?.owner) {
      await notify({
        userId: c.owner.id,
        kind: 'MESSAGE',
        title: 'Сообщение от агентства',
        body: body.slice(0, 80),
        link: `/dashboard/chat`,
      });
    }
  }

  return NextResponse.json(msg);
}
