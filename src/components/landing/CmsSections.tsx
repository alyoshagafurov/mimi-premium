'use client';

import Link from 'next/link';
import { Reveal } from '@/components/ui/Reveal';

/* ─── shared types (serialised from Prisma) ─── */
export type CmsData = {
  cases: { id: string; slug: string; title: string; category: string; clientName: string; description: string; coverImage: string | null }[];
  testimonials: { id: string; name: string; company: string | null; position: string | null; photo: string | null; rating: number; text: string }[];
  clients: { id: string; name: string; logo: string | null; url: string | null }[];
  team: { id: string; name: string; position: string; photo: string | null; bio: string | null; socials: Record<string, string> | null }[];
  stats: { id: string; label: string; value: string; suffix: string | null }[];
  posts: { id: string; slug: string; title: string; category: string; cover: string | null; excerpt: string | null; date: string }[];
  partners: { id: string; name: string; logo: string | null; url: string | null }[];
  certificates: { id: string; title: string; image: string | null; issuer: string | null }[];
  awards: { id: string; title: string; image: string | null; issuer: string | null }[];
  faqs: { id: string; question: string; answer: string }[];
};

/* ─── shared section header ─── */
function Header({ eyebrow, pre, emphasis, subtitle, link }: { eyebrow: string; pre: string; emphasis: string; subtitle?: string; link?: { href: string; label: string } }) {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1fr] lg:items-end">
      <div>
        <Reveal><p className="text-[10px] uppercase tracking-[0.5em] text-brand-orange">{eyebrow}</p></Reveal>
        <Reveal delay={0.06}>
          <h2 className="mt-6 max-w-[16ch] font-display text-hero-sm font-extrabold text-light">
            {pre} <span className="font-serif italic font-normal text-lime-grad">{emphasis}</span>
          </h2>
        </Reveal>
      </div>
      {(subtitle || link) && (
        <Reveal delay={0.14}>
          <div className="lg:text-right">
            {subtitle && <p className="max-w-md text-base leading-relaxed text-light/55 lg:ml-auto">{subtitle}</p>}
            {link && <Link href={link.href} className="mt-4 inline-block text-[12px] font-bold uppercase tracking-[0.2em] text-brand-lime transition-colors hover:text-brand-limeSoft">{link.label} →</Link>}
          </div>
        </Reveal>
      )}
    </div>
  );
}

const Section = ({ id, children }: { id?: string; children: React.ReactNode }) => (
  <section id={id} className="relative w-full px-6 py-section lg:px-12">
    <div className="mx-auto max-w-[1500px]">{children}</div>
  </section>
);

/* ─── 1. Latest cases ─── */
export function CmsCases({ items }: { items: CmsData['cases'] }) {
  if (!items.length) return null;
  return (
    <Section id="cms-cases">
      <Header eyebrow="Портфолио" pre="Последние" emphasis="кейсы." subtitle="Реальные проекты в Душанбе и Таджикистане." link={{ href: '/cases', label: 'Все кейсы' }} />
      <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((c, i) => (
          <Reveal key={c.id} delay={0.05 + i * 0.05}>
            <Link href={`/cases/${c.slug}`} className="group flex h-full flex-col overflow-hidden rounded-3xl border border-white/[0.06] bg-ink2/30 transition-colors hover:border-brand-lime/30">
              <div className="aspect-[16/10] overflow-hidden bg-brand-purple/20">
                {c.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.coverImage} alt={c.title} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="flex h-full items-center justify-center font-display text-4xl font-extrabold text-brand-lime/30">mımı</div>
                )}
              </div>
              <div className="flex flex-1 flex-col p-6">
                <div className="text-[10px] uppercase tracking-[0.18em] text-brand-orange">{c.category}{c.clientName && ` · ${c.clientName}`}</div>
                <h3 className="mt-3 font-display text-xl font-extrabold leading-tight text-light group-hover:text-brand-lime">{c.title}</h3>
                <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-light/55">{c.description}</p>
                <span className="mt-auto pt-5 text-[11px] uppercase tracking-[0.2em] text-brand-lime">Смотреть →</span>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/* ─── 2. Company stats ─── */
export function CmsStats({ items }: { items: CmsData['stats'] }) {
  if (!items.length) return null;
  return (
    <Section>
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-white/[0.05] md:grid-cols-4">
        {items.slice(0, 8).map((s, i) => (
          <Reveal key={s.id} delay={0.05 + i * 0.05}>
            <div className="flex h-full flex-col items-center justify-center bg-ink px-4 py-12 text-center">
              <div className="font-display text-5xl font-extrabold leading-none tracking-tight text-lime-grad md:text-6xl">
                {s.value}{s.suffix && <span className="text-brand-orange">{s.suffix}</span>}
              </div>
              <div className="mt-3 text-[11px] uppercase tracking-[0.24em] text-light/55">{s.label}</div>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/* ─── 3. Client logos ─── */
export function CmsClients({ items }: { items: CmsData['clients'] }) {
  if (!items.length) return null;
  return (
    <Section>
      <Header eyebrow="Клиенты" pre="Нам" emphasis="доверяют." />
      <div className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-white/[0.05] sm:grid-cols-3 lg:grid-cols-5">
        {items.map((c, i) => {
          const inner = c.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.logo} alt={c.name} loading="lazy" decoding="async" className="max-h-12 w-auto max-w-[70%] object-contain opacity-60 grayscale transition group-hover:opacity-100 group-hover:grayscale-0" />
          ) : (
            <span className="font-display text-lg font-bold text-light/60 group-hover:text-light">{c.name}</span>
          );
          return (
            <Reveal key={c.id} delay={0.03 + i * 0.03}>
              <div className="group flex h-28 items-center justify-center bg-ink px-4">
                {c.url ? <a href={c.url} target="_blank" rel="noreferrer" className="flex items-center justify-center">{inner}</a> : inner}
              </div>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}

/* ─── 4. Testimonials ─── */
export function CmsTestimonials({ items }: { items: CmsData['testimonials'] }) {
  if (!items.length) return null;
  return (
    <Section>
      <Header eyebrow="Отзывы" pre="Что говорят" emphasis="клиенты." />
      <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((t, i) => (
          <Reveal key={t.id} delay={0.05 + i * 0.05}>
            <figure className="flex h-full flex-col rounded-3xl border border-white/[0.06] bg-ink2/30 p-7">
              <div className="flex gap-1 text-brand-lime">{Array.from({ length: 5 }).map((_, j) => <span key={j} className={j < t.rating ? '' : 'text-light/20'}>★</span>)}</div>
              <blockquote className="mt-5 flex-1 text-[15px] leading-relaxed text-light/75">“{t.text}”</blockquote>
              <figcaption className="mt-6 flex items-center gap-3 border-t border-white/[0.06] pt-5">
                {t.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.photo} alt={t.name} loading="lazy" decoding="async" className="h-11 w-11 rounded-full object-cover" />
                ) : (
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-lime-gradient font-display text-sm font-extrabold text-ink">{t.name.charAt(0)}</span>
                )}
                <div>
                  <div className="text-sm font-semibold text-light">{t.name}</div>
                  <div className="text-[11px] text-light/45">{[t.position, t.company].filter(Boolean).join(', ')}</div>
                </div>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/* ─── 5. Team ─── */
const SOCIAL_ICON: Record<string, string> = { instagram: '◎', telegram: '✈', linkedin: 'in', website: '▤' };
export function CmsTeam({ items }: { items: CmsData['team'] }) {
  if (!items.length) return null;
  return (
    <Section>
      <Header eyebrow="Команда" pre="Люди за" emphasis="результатом." />
      <div className="mt-14 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
        {items.map((m, i) => (
          <Reveal key={m.id} delay={0.04 + i * 0.04}>
            <div className="group flex h-full flex-col overflow-hidden rounded-3xl border border-white/[0.06] bg-ink2/30">
              <div className="aspect-square overflow-hidden bg-brand-purple/20">
                {m.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.photo} alt={m.name} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="flex h-full items-center justify-center font-display text-3xl font-extrabold text-brand-lime/30">{m.name.charAt(0)}</div>
                )}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="font-display text-base font-extrabold text-light">{m.name}</div>
                <div className="mt-1 text-[11px] uppercase tracking-[0.16em] text-brand-orange">{m.position}</div>
                {m.bio && <p className="mt-3 line-clamp-3 text-[13px] leading-relaxed text-light/55">{m.bio}</p>}
                {m.socials && (
                  <div className="mt-auto flex gap-3 pt-4">
                    {Object.entries(m.socials).filter(([, v]) => v).map(([k, v]) => (
                      <a key={k} href={v} target="_blank" rel="noreferrer" className="text-light/45 transition hover:text-brand-lime" aria-label={k}>{SOCIAL_ICON[k] ?? '↗'}</a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/* ─── 6. Latest blog posts ─── */
export function CmsBlog({ items }: { items: CmsData['posts'] }) {
  if (!items.length) return null;
  return (
    <Section id="cms-blog">
      <Header eyebrow="Блог" pre="Последние" emphasis="статьи." subtitle="Разборы, кейсы и советы по маркетингу." link={{ href: '/blog', label: 'Весь блог' }} />
      <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
        {items.map((p, i) => (
          <Reveal key={p.id} delay={0.05 + i * 0.05}>
            <Link href={`/blog/${p.slug}`} className="group flex h-full flex-col overflow-hidden rounded-3xl border border-white/[0.06] bg-ink2/30 transition-colors hover:border-brand-lime/30">
              <div className="aspect-[16/10] overflow-hidden bg-brand-purple/20">
                {p.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.cover} alt={p.title} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="flex h-full items-center justify-center font-display text-4xl font-extrabold text-brand-lime/30">mımı</div>
                )}
              </div>
              <div className="flex flex-1 flex-col p-6">
                <div className="text-[10px] uppercase tracking-[0.18em] text-brand-orange">{p.category}</div>
                <h3 className="mt-3 font-display text-lg font-extrabold leading-tight text-light group-hover:text-brand-lime">{p.title}</h3>
                {p.excerpt && <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-light/55">{p.excerpt}</p>}
                <span className="mt-auto pt-5 text-[11px] uppercase tracking-[0.2em] text-brand-lime">Читать →</span>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/* ─── 7. Partners ─── */
export function CmsPartners({ items }: { items: CmsData['partners'] }) {
  if (!items.length) return null;
  return (
    <Section>
      <Header eyebrow="Партнёры" pre="Наши" emphasis="партнёры." />
      <div className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-white/[0.05] sm:grid-cols-3 lg:grid-cols-5">
        {items.map((p, i) => {
          const inner = p.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.logo} alt={p.name} loading="lazy" decoding="async" className="max-h-12 w-auto max-w-[70%] object-contain opacity-60 grayscale transition group-hover:opacity-100 group-hover:grayscale-0" />
          ) : (
            <span className="font-display text-lg font-bold text-light/60 group-hover:text-light">{p.name}</span>
          );
          return (
            <Reveal key={p.id} delay={0.03 + i * 0.03}>
              <div className="group flex h-28 items-center justify-center bg-ink px-4">
                {p.url ? <a href={p.url} target="_blank" rel="noreferrer" className="flex items-center justify-center">{inner}</a> : inner}
              </div>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}

/* ─── 8. Certificates + 9. Awards (shared card grid) ─── */
function ImageCards({ eyebrow, pre, emphasis, items }: { eyebrow: string; pre: string; emphasis: string; items: { id: string; title: string; image: string | null; issuer: string | null }[] }) {
  if (!items.length) return null;
  return (
    <Section>
      <Header eyebrow={eyebrow} pre={pre} emphasis={emphasis} />
      <div className="mt-12 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
        {items.map((it, i) => (
          <Reveal key={it.id} delay={0.04 + i * 0.04}>
            <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-ink2/30">
              <div className="aspect-[4/3] overflow-hidden bg-white/[0.03]">
                {it.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.image} alt={it.title} loading="lazy" decoding="async" className="h-full w-full object-contain p-4" />
                ) : (
                  <div className="flex h-full items-center justify-center text-brand-lime/30">◆</div>
                )}
              </div>
              <div className="p-4">
                <div className="text-sm font-semibold text-light">{it.title}</div>
                {it.issuer && <div className="mt-1 text-[11px] text-light/45">{it.issuer}</div>}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
export const CmsCertificates = ({ items }: { items: CmsData['certificates'] }) => <ImageCards eyebrow="Сертификаты" pre="Наши" emphasis="сертификаты." items={items} />;
export const CmsAwards = ({ items }: { items: CmsData['awards'] }) => <ImageCards eyebrow="Награды" pre="Наши" emphasis="награды." items={items} />;
