import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/admin/PageHeader';

const STATUS_LABEL: Record<string, string> = { ACTIVE: 'Активен', ARCHIVED: 'В архиве' };

export default async function AdminProjectsPage() {
  // Только партнёры: новый лид сюда не попадает, пока админ не переведёт его
  // в статус «Партнёр» в карточке лида (или пока не отмечена оплата).
  const clients = await prisma.client.findMany({
    relationLoadStrategy: 'join',
    where: { salesStatus: 'PARTNER' },
    include: { owner: { select: { name: true, email: true, phone: true } } },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
  });

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Projects" title={<>Проекты</>} subtitle="Клиенты агентства, их ниша и контакты для связи." />

      {clients.length === 0 ? (
        <p className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-10 text-center text-light/50">
          Пока нет проектов. Лид появится здесь, когда получит статус «Партнёр».
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((c) => (
            <Link
              key={c.id}
              href={`/admin/projects/${c.id}`}
              className="group flex flex-col rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5 transition-colors hover:border-brand-lime/30"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] uppercase tracking-[0.18em] text-brand-orange">{c.niche || 'Ниша не указана'}</span>
                <span className={`rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] ${c.status === 'ACTIVE' ? 'border-brand-lime/30 bg-brand-lime/[0.06] text-brand-lime' : 'border-white/10 text-light/45'}`}>
                  {STATUS_LABEL[c.status] ?? c.status}
                </span>
              </div>
              <h3 className="mt-3 font-display text-lg font-extrabold leading-tight text-light group-hover:text-brand-lime">{c.businessName}</h3>
              <div className="mt-4 space-y-1 text-[12px] text-light/55">
                <div>{c.owner.name}</div>
                {c.owner.phone && <div className="font-mono text-light/45">{c.owner.phone}</div>}
                <div className="truncate text-light/40">{c.owner.email}</div>
              </div>
              <span className="mt-4 text-[10px] uppercase tracking-[0.16em] text-light/30">
                с {new Date(c.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
