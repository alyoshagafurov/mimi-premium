import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * mimi wordmark — lime "mimi" with two orange dots over the i-stems.
 * Mirrors the hero lockup / brandbook photo (lime letters + orange dots).
 *
 * The i is built from a dotless stem (ı, U+0131) plus an absolutely-positioned
 * orange dot, so the dot colour is independent of the lime letters. Dot metrics
 * are em-based, so they scale with every size.
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

  // dotless stem (ı) + orange dot. letterSpacing:0 isolates the stem box from the
  // wordmark tracking so left:50% lands on the stem; dot metrics tuned to Outfit 800.
  const dotI = (key: string) => (
    <span key={key} className="relative inline-block" style={{ letterSpacing: 0 }}>
      ı
      <span
        aria-hidden
        className="absolute left-1/2 -translate-x-1/2 rounded-full bg-brand-orange"
        style={{ width: '0.185em', height: '0.185em', bottom: '0.43em' }}
      />
    </span>
  );

  return (
    <Link href={href} className={cn('group inline-flex flex-col items-start leading-none', className)}>
      <span className={cn('flex items-end font-display font-extrabold tracking-tight text-brand-lime', wordMap[size])}>
        {/* m i m i — lime letters, orange dots over the i-stems */}
        <span>m</span>
        {dotI('i1')}
        <span>m</span>
        {dotI('i2')}
      </span>
      {subtitle && (
        <span className="mt-1.5 font-display text-[10px] uppercase tracking-[0.32em] text-brand-orange md:text-xs">
          minimise marketing agency
        </span>
      )}
    </Link>
  );
}
