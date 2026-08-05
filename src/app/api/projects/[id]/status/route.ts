import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ensureStaff } from '@/lib/api-guard';
import { canEditProduction, PRODUCTION_BY_KIND, WORK_STATUSES, type ProductionKind } from '@/lib/roles';

const schema = z.object({
  kind: z.enum(['shooting', 'montage', 'design', 'dev']),
  status: z.enum(WORK_STATUSES as unknown as [string, ...string[]]),
});

/** Staff: change one production status on a project (gated to the owning role). */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await ensureStaff();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const role = (session.user as any).role as string;
  try {
    const { kind, status } = schema.parse(await req.json());
    if (!canEditProduction(role, kind as ProductionKind)) {
      return NextResponse.json({ error: 'Нет доступа к этому статусу' }, { status: 403 });
    }
    const field = PRODUCTION_BY_KIND[kind as ProductionKind].field;
    await prisma.client.update({ where: { id: params.id }, data: { [field]: status } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Bad request' }, { status: 400 });
  }
}
