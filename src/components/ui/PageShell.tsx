import { cn } from '@/lib/utils';

export function PageShell({
  children,
  className,
  bare = false,
}: {
  children: React.ReactNode;
  className?: string;
  bare?: boolean;
}) {
  return (
    <div
      className={cn(
        'relative min-h-screen w-full',
        !bare && 'mx-auto max-w-7xl px-5 py-10 md:py-14',
        className,
      )}
    >
      {children}
    </div>
  );
}
