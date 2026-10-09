import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ensureStaff } from '@/lib/api-guard';

export const dynamic = 'force-dynamic';

const schema = z.object({
  label: z.string().trim().min(1).max(160).optional(),
  campaign: z.string().trim().max(160).nullable().optional(),
  adName: z.string().trim().max(200).nullable().optional(),
  postUrl: z.string().trim().max(500).nullable().optional(),
  active: z.boolean().optional(),
});

/**
 * Правка ссылки. Удаления нет намеренно: метка уже записана в карточках лидов,
 * и удалив её, мы потеряли бы связь источника с публикацией. Ненужную ссылку
 * выключают через active: false.
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await ensureStaff();
  if (!session) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Проверьте поля' }, { status: 400 });

  const updated = await prisma.whatsAppLink.updateMany({ where: { id: params.id }, data: parsed.data });
  if (!updated.count) return NextResponse.json({ error: 'Ссылка не найдена' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
