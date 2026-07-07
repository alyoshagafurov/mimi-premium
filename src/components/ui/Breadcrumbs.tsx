import Link from 'next/link';
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd';

/** Visible breadcrumb trail + matching BreadcrumbList JSON-LD. */
export function Breadcrumbs({ items }: { items: { name: string; path: string }[] }) {
  return (
    <>
      <BreadcrumbJsonLd items={items} />
      <nav aria-label="Хлебные крошки" className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-light/45">
        {items.map((it, i) => (
          <span key={it.path} className="flex items-center gap-2">
            {i > 0 && <span className="text-light/25">/</span>}
            {i < items.length - 1 ? (
              <Link href={it.path} className="transition-colors hover:text-brand-lime">{it.name}</Link>
            ) : (
              <span className="text-light/70">{it.name}</span>
            )}
          </span>
        ))}
      </nav>
    </>
  );
}
