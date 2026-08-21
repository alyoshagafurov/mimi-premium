import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSafeSession } from '@/lib/session';
import { isAdminLike } from '@/lib/roles';
import { notify } from '@/lib/notify';
import { logAudit } from '@/lib/audit';

const MAX = 500;

/**
 * Массовые действия над выбранными лидами.
 *
 *   op: 'assign' — назначить всем выбранным один и тот же состав ответственных;
 *   op: 'swap'   — обменять лиды между двумя людьми: выбранные лиды первого
 *                  уходят второму, а выбранные лиды второго — первому.
 *
 * Перекидывать чужие лиды может только админ / опер. директор.
 */
export async function POST(req: Request) {
  const session = await getSafeSession();
  const me = session?.user as any;
  if (!isAdminLike(me?.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const ids: string[] = Array.isArray(body.ids) ? body.ids.filter(Boolean).slice(0, MAX) : [];
  if (!ids.length) return NextResponse.json({ error: 'Не выбрано ни одного лида' }, { status: 400 });

  const leads = await prisma.client.findMany({
    where: { id: { in: ids } },
    select: {
      id: true, contactName: true, businessName: true,
      assignees: { select: { id: true, name: true } },
    },
  });
  if (!leads.length) return NextResponse.json({ error: 'Лиды не найдены' }, { status: 404 });

  /** id → новый состав ответственных */
  const plan = new Map<string, string[]>();
  let summary = '';

  if (body.op === 'assign') {
    const next: string[] = Array.isArray(body.assigneeIds) ? body.assigneeIds.filter(Boolean) : [];
    if (!next.length) return NextResponse.json({ error: 'Выберите, кому передать' }, { status: 400 });
    const people = await prisma.user.findMany({ where: { id: { in: next } }, select: { id: true, name: true } });
    if (people.length !== next.length) return NextResponse.json({ error: 'Сотрудник не найден' }, { status: 400 });
    for (const l of leads) plan.set(l.id, next);
    summary = `Передано ${leads.length} лидов: ${people.map((p) => p.name).join(', ')}`;
  } else if (body.op === 'swap') {
    // Ровно два участника обмена — иначе непонятно, кто с кем меняется.
    const involved = new Map<string, string>();
    for (const l of leads) for (const a of l.assignees) involved.set(a.id, a.name);
    if (involved.size !== 2) {
      return NextResponse.json({
        error: involved.size < 2
          ? 'Для обмена выберите лиды двух разных сотрудников'
          : `В выборке ${involved.size} ответственных — обмен возможен только между двумя`,
      }, { status: 400 });
    }
    const [a, b] = [...involved.keys()];
    for (const l of leads) {
      const swapped = l.assignees.map((x) => (x.id === a ? b : x.id === b ? a : x.id));
      plan.set(l.id, [...new Set(swapped)]);
    }
    const names = [...involved.values()];
    summary = `Обмен ${leads.length} лидов: ${names[0]} ⇄ ${names[1]}`;
  } else {
    return NextResponse.json({ error: 'Неизвестное действие' }, { status: 400 });
  }

  // Кому сколько прилетело нового — чтобы отправить одно уведомление, а не сотню.
  const gained = new Map<string, number>();
  const notes: { kind: 'NOTE'; body: string; clientId: string; authorId: string | null }[] = [];

  for (const l of leads) {
    const next = plan.get(l.id)!;
    const before = l.assignees.map((x) => x.id);
    if (next.length === before.length && next.every((id) => before.includes(id))) continue;
    await prisma.client.update({
      where: { id: l.id },
      data: { assignees: { set: next.map((id) => ({ id })) } },
    });
    for (const id of next) if (!before.includes(id)) gained.set(id, (gained.get(id) ?? 0) + 1);
    notes.push({
      kind: 'NOTE',
      body: summary,
      clientId: l.id,
      authorId: me?.id ?? null,
    });
  }

  if (notes.length) await prisma.activity.createMany({ data: notes });

  for (const [uid, n] of gained) {
    await notify({
      userId: uid,
      kind: 'LEAD',
      title: 'Вам передали лиды',
      body: `${n} ${n === 1 ? 'лид' : 'лидов'} — посмотрите в разделе «Продажи»`,
      link: '/admin/sales',
    }).catch(() => {});
  }

  await logAudit({ action: 'updated', entity: 'lead', entityId: 'bulk', summary });

  return NextResponse.json({ ok: true, updated: notes.length, summary });
}
