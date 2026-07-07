import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/admin/PageHeader';
import { RowActions } from '@/components/admin/RowActions';

export default async function AdminCasesPage() {
  const cases = await prisma.case.findMany({ orderBy: [{ sortOrder: 'asc' }, { date: 'desc' }] });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="CMS"
        title={<>Кейсы</>}
        subtitle="Портфолио агентства — публикуется на /cases с SEO и разметкой."
        action={<Link href="/admin/cases/new" className="btn-lime">+ Кейс</Link>}
      />

      <div className="overflow-hidden rounded-3xl border border-white/[0.06]">
        <table className="w-full text-sm">
          <thead className="border-b border-white/[0.06] bg-white/[0.02] text-left text-[10px] uppercase tracking-[0.16em] text-light/45">
            <tr>
              <th className="px-4 py-3">Название</th>
              <th className="hidden px-4 py-3 sm:table-cell">Категория</th>
              <th className="hidden px-4 py-3 md:table-cell">Клиент</th>
              <th className="px-4 py-3 text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((c) => (
              <tr key={c.id} className="border-b border-white/[0.04]">
                <td className="px-4 py-3">
                  <div className="font-medium text-light">{c.title}</div>
                  <div className="text-[11px] text-light/40">/cases/{c.slug}</div>
                </td>
                <td className="hidden px-4 py-3 text-light/60 sm:table-cell">{c.category || '—'}</td>
                <td className="hidden px-4 py-3 text-light/60 md:table-cell">{c.clientName || '—'}</td>
                <td className="px-4 py-3">
                  <RowActions apiBase="/api/admin/cases" id={c.id} editHref={`/admin/cases/${c.id}`} published={c.published} viewHref={`/cases/${c.slug}`} />
                </td>
              </tr>
            ))}
            {!cases.length && (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-light/45">Пока нет кейсов. Создайте первый.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
