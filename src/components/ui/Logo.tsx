import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * mimi wordmark — lime "mimi" + orange dots over the "i" stems
 * Mirrors the brandbook lockup (lowercase, sentence-flush).
 */
export function Logo({
  className,
  href = '/',
  size = 'md',
  subtitle = false,
}: {
  className?: string;
  href?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  subtitle?: boolean;
}) {
  const sizeMap = {
    sm: { word: 'text-lg', dot: 'h-1 w-1', gap: 'gap-[1px]' },
    md: { word: 'text-2xl', dot: 'h-1.5 w-1.5', gap: 'gap-[2px]' },
    lg: { word: 'text-5xl md:text-7xl', dot: 'h-2.5 w-2.5 md:h-3.5 md:w-3.5', gap: 'gap-[3px] md:gap-[5px]' },
    xl: { word: 'text-7xl md:text-[10rem]', dot: 'h-4 w-4 md:h-6 md:w-6', gap: 'gap-[5px] md:gap-[8px]' },
  } as const;

  const s = sizeMap[size];

  return (
    <Link href={href} className={cn('group inline-flex flex-col items-start leading-none', className)}>
      <span className={cn('flex items-end font-display font-extrabold tracking-tight text-brand-lime', s.word)}>
        {/* m */}
        <span>m</span>
        {/* i with orange dot */}
        <span className={cn('relative flex flex-col items-center', s.gap)}>
          <span className={cn('-mb-[0.05em] rounded-full bg-brand-orange', s.dot)} />
          <span className="leading-none">i</span>
        </span>
        {/* m */}
        <span>m</span>
        {/* i */}
        <span className={cn('relative flex flex-col items-center', s.gap)}>
          <span className={cn('-mb-[0.05em] rounded-full bg-brand-orange', s.dot)} />
          <span className="leading-none">i</span>
        </span>
      </span>
      {subtitle && (
        <span className="mt-1.5 font-display text-[10px] uppercase tracking-[0.32em] text-brand-orange md:text-xs">
          minimise marketing agency
        </span>
      )}
    </Link>
  );
}
