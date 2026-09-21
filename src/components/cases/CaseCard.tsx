import Link from 'next/link';
import Image from 'next/image';
import { cn, isOptimizableImage } from '@/lib/utils';
import { CaseStage } from './CaseStage';

export type CaseCardData = {
  slug: string;
  title: string;
  description: string;
  category?: string | null;
  logo: string | null;
  /** Ширина логотипа к высоте — сохраняется при загрузке в админке. */
  logoRatio?: number | null;
  coverImage: string | null;
  /** Карточке нужны только первые 3 фото; общее число — в imagesCount. */
  images: string[];
  imagesCount?: number;
  instagramUrl: string | null;
};

/** Веер из фото-доказательств в углу карточки: при наведении раскрывается. */
function ProofFan({ images, total }: { images: string[]; total: number }) {
  const shown = images.slice(0, 3);
  const tilt = [
    '-rotate-[9deg] group-hover:-rotate-[16deg] group-hover:-translate-x-3',
    'rotate-0 group-hover:-translate-y-1',
    'rotate-[9deg] group-hover:rotate-[16deg] group-hover:translate-x-3',
  ];
  // Одно фото — прямо, два — по краям веера, три — весь веер.
  const pick = (i: number) => (shown.length === 1 ? 1 : shown.length === 2 ? i * 2 : i);
  return (
    <div className="absolute bottom-4 right-4 flex items-end gap-3">
      <span className="rounded-full bg-ink/75 px-3 py-1 text-[11px] font-semibold tabular-nums text-light backdrop-blur">
        {total} фото
      </span>
      <div className="flex">
        {shown.map((src, i) => (
          <span
            key={src}
            className={cn(
              'relative -ml-6 block h-[68px] w-[52px] overflow-hidden rounded-lg border-2 border-ink shadow-[0_10px_24px_-8px_rgba(0,0,0,0.7)] transition-transform duration-500 ease-out first:ml-0',
              tilt[pick(i)],
            )}
          >
            <Image src={src} alt="" aria-hidden fill sizes="64px" unoptimized={!isOptimizableImage(src)} className="object-cover" />
          </span>
        ))}
      </div>
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="3.8" />
      <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

const CARD_SIZES = '(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw';

/** Карточка кейса — одна и та же на странице «Кейсы» и на лендинге. */
export function CaseCard({
  c,
  priority = false,
  headingLevel = 'h3',
}: {
  c: CaseCardData;
  priority?: boolean;
  /** h2 — когда карточки идут сразу под h1 страницы (как на /cases). */
  headingLevel?: 'h2' | 'h3';
}) {
  const proofs = c.images.filter(Boolean);
  const total = c.imagesCount ?? proofs.length;
  const Heading = headingLevel;
  // Без логотипа и обложки сцену занимает первое фото-доказательство.
  const cover = c.coverImage || (c.logo ? null : proofs[0] ?? null);
  return (
    <Link
      href={`/cases/${c.slug}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-[28px] border border-white/[0.07] bg-ink2/50 transition-[transform,box-shadow,border-color] duration-500 ease-out hover:-translate-y-1 hover:border-brand-lime/30 hover:shadow-[0_28px_60px_-32px_rgba(212,236,76,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime/60"
    >
      {/* Квадрат: логотипы из Instagram почти всегда квадратные и заполняют его целиком. */}
      <div className="relative aspect-square">
        <CaseStage
          logo={c.logo}
          logoRatio={c.logoRatio}
          cover={cover}
          title={c.title}
          sizes={CARD_SIZES}
          priority={priority}
          className="absolute inset-0"
        />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink/70 to-transparent" />
        {c.category && (
          <span className="absolute left-4 top-4 rounded-full bg-ink/75 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-brand-orange backdrop-blur">
            {c.category}
          </span>
        )}
        {proofs.length > 0 && <ProofFan images={proofs} total={total} />}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <Heading className="font-display text-[22px] font-extrabold leading-tight tracking-tight text-light">{c.title}</Heading>
        {c.description && <p className="mt-3 line-clamp-3 text-[14px] leading-relaxed text-light/60">{c.description}</p>}
        <div className="mt-auto flex items-center justify-between gap-3 pt-6">
          <span className="text-[11px] uppercase tracking-[0.2em] text-brand-lime">Смотреть кейс</span>
          <span className="flex items-center gap-3">
            {c.instagramUrl && (
              <span className="text-light/45" title="Есть в Instagram">
                <InstagramIcon />
              </span>
            )}
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-light/70 transition-colors duration-300 group-hover:border-brand-lime group-hover:bg-brand-lime group-hover:text-[#0A0712]">
              <ArrowIcon />
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}
