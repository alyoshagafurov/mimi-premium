import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * mimi wordmark — clean lime "mımı" (dotless i, no dots over the stems).
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
  const wordMap = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-5xl md:text-7xl',
    xl: 'text-7xl md:text-[10rem]',
  } as const;

  return (
    <Link href={href} className={cn('group inline-flex flex-col items-start leading-none', className)}>
      <span className={cn('flex items-end font-display font-extrabold tracking-tight text-brand-lime', wordMap[size])}>
        {/* m ı m ı — dotless i, no dots over the stems */}
        <span>m</span>
        <span>ı</span>
        <span>m</span>
        <span>ı</span>
      </span>
      {subtitle && (
        <span className="mt-1.5 font-display text-[10px] uppercase tracking-[0.32em] text-brand-orange md:text-xs">
          minimise marketing agency
        </span>
      )}
    </Link>
  );
}
