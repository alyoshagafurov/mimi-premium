import { redirect } from 'next/navigation';
import { getSafeSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { isAdminLike, ROLE_LABEL } from '@/lib/roles';
import { PageHeader } from '@/components/admin/PageHeader';
import type { Role } from '@prisma/client';

const ACTION_LABEL: Record<string, string> = {
  created: 'Создание', updated: 'Изменение', deleted: 'Удаление', status: 'Статус',
};
const ACTION_STYLE: Record<string, string> = {
  created: 'border-brand-lime/40 bg-brand-lime/10 text-brand-lime',
  updated: 'border-brand-orange/40 bg-brand-orange/10 text-brand-orange',
  deleted: 'border-red-400/40 bg-red-400/10 text-red-300',
  status: 'border-white/15 text-light/60',
};
const ENTITY_LABEL: Record<string, string> = {
  client: 'Клиент', report: 'Отчёт', payment: 'Оплата', user: 'Сотрудник', project: 'Проект',
};

export default async function AdminAuditPage() {
  const session = await getSafeSession();
  const role = (session?.user as any)?.role as string;
  if (!isAdminLike(role)) redirect('/admin');

  const logs = await prisma.auditLog
    .findMany({ orderBy: { createdAt: 'desc' }, take: 200 })
    .catch(() => []);

  const fmt = (d: Date) =>
    new Date(d).toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Audit"
        title={<>История действий</>}
        subtitle="Кто, когда и что создал, изменил или удалил. Последние 200 записей."
      />

      {logs.length === 0 ? (
        <p className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-10 text-center text-light/50">
          Пока нет записей.
        </p>
      ) : (
        <div className="glass overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-white/[0.02] text-[10px] uppercase tracking-[0.16em] text-muted">
                <tr>
                  <th className="px-4 py-3 text-left">Когда</th>
                  <th className="px-4 py-3 text-left">Кто</th>
                  <th className="px-4 py-3 text-left">Действие</th>
                  <th className="px-4 py-3 text-left">Объект</th>
                  <th className="px-4 py-3 text-left">Описание</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-t border-white/5">
                    <td className="whitespace-nowrap px-4 py-3 text-[12px] text-muted">{fmt(l.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="text-light/85">{l.actorName}</div>
                      {l.actorRole && (
                        <div className="text-[11px] text-muted">{ROLE_LABEL[l.actorRole as Role] ?? l.actorRole}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-[0.1em] ${ACTION_STYLE[l.action] ?? 'border-white/15 text-light/60'}`}>
                        {ACTION_LABEL[l.action] ?? l.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">{ENTITY_LABEL[l.entity] ?? l.entity}</td>
                    <td className="px-4 py-3 text-light/80">{l.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
