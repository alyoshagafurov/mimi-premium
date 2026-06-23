import { cn, statusLabel } from '@/lib/utils';

const palette: Record<string, string> = {
  ACTIVE: 'bg-brand-lime/12 text-brand-lime border-brand-lime/30',
  PAUSED: 'bg-brand-orange/15 text-brand-orange border-brand-orange/40',
  FINISHED: 'bg-white/5 text-muted border-white/10',
  ARCHIVED: 'bg-white/5 text-muted border-white/10',
  NEW: 'bg-brand-lime/12 text-brand-lime border-brand-lime/30',
  WORKING: 'bg-brand-orange/15 text-brand-orange border-brand-orange/40',
  CLOSED: 'bg-white/5 text-muted border-white/10',
};

export function StatusPill({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em]',
        palette[status] ?? palette.ARCHIVED,
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
      {statusLabel(status)}
    </span>
  );
}
