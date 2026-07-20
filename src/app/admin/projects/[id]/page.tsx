import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSafeSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { isAdminLike, SALES_STATUS_LABEL, PACKAGE_LABEL, type SalesStatus, type ClientPackage } from '@/lib/roles';
import { TechSpec } from './TechSpec';

const STATUS_LABEL: Record<string, string> = { ACTIVE: 'Активен', ARCHIVED: 'В архиве' };

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-white/[0.05] py-3 last:border-0 sm:flex-row sm:gap-4">
      <span className="w-40 shrink-0 text-[11px] uppercase tracking-[0.16em] text-light/40">{label}</span>
      <span className="text-sm text-light/85">{value || '—'}</span>
    </div>
  );
}

export default async function AdminProjectDetailPage({ params }: { params: { id: string } }) {
  const session = await getSafeSession();
  const adminLike = isAdminLike((session?.user as any)?.role);

  const c = await prisma.client.findUnique({
    where: { id: params.id },
    include: { owner: { select: { name: true, email: true, phone: true } } },
  });
  if (!c) notFound();

  const waPhone = c.owner.phone?.replace(/[^0-9]/g, '');

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/projects" className="text-xs uppercase tracking-[0.18em] text-light/45 hover:text-brand-lime">← Проекты</Link>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-extrabold text-light sm:text-4xl">{c.businessName}</h1>
          <span className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] ${c.status === 'ACTIVE' ? 'border-brand-lime/30 bg-brand-lime/[0.06] text-brand-lime' : 'border-white/10 text-light/45'}`}>
            {STATUS_LABEL[c.status] ?? c.status}
          </span>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Business */}
        <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6">
          <p className="mb-4 text-[10px] uppercase tracking-[0.24em] text-brand-orange">О бизнесе</p>
          <Row label="Ниша" value={c.niche} />
          <Row label="Дата поступления" value={new Date(c.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })} />
          <Row label="Статус в CRM" value={SALES_STATUS_LABEL[c.salesStatus as SalesStatus]} />
          {c.packageType !== 'NONE' && <Row label="Пакет" value={PACKAGE_LABEL[c.packageType as ClientPackage]} />}
          {c.comment && <Row label="Комментарий" value={c.comment} />}
          <Row label="Цели" value={c.briefGoals} />
          <Row label="Аудитория" value={c.briefTargetAudience} />
          <Row label="УТП" value={c.briefUSP} />
          <Row label="Конкуренты" value={c.briefCompetitors} />
          {adminLike && <Row label="Бюджет" value={c.briefBudget ? `${c.briefBudget.toLocaleString('ru-RU')} c.` : ''} />}
        </div>

        {/* Contacts */}
        <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6">
          <p className="mb-4 text-[10px] uppercase tracking-[0.24em] text-brand-orange">Контакты для связи</p>
          <Row label="Имя" value={c.owner.name} />
          <Row label="Телефон" value={c.owner.phone} />
          <Row label="Email" value={c.owner.email} />
          <div className="mt-5 flex flex-wrap gap-3">
            {waPhone && (
              <a href={`https://wa.me/${waPhone}`} target="_blank" rel="noreferrer" className="btn-lime !px-5 !py-2.5 !text-[12px]">
                WhatsApp
              </a>
            )}
            <a href={`mailto:${c.owner.email}`} className="btn-ghost !px-5 !py-2.5 !text-[12px]">Написать email</a>
          </div>
        </div>
      </div>

      {/* Tech spec — for the developer; filled by admin / ops */}
      <TechSpec clientId={c.id} value={c.techSpec ?? ''} canEdit={adminLike} />
    </div>
  );
}
