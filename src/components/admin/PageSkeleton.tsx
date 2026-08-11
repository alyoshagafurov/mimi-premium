/**
 * Instant placeholder for admin routes.
 *
 * Every admin page is a server component that queries the DB, so without a
 * Suspense boundary Next.js blocks on the *old* page until the new one is ready
 * — which reads as "the panel froze". A `loading.tsx` exporting this renders
 * immediately on click, so navigation always feels instant.
 */
export function PageSkeleton({ rows = 6, chart = false }: { rows?: number; chart?: boolean }) {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Загрузка">
      {/* header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="w-full">
          <div className="h-2.5 w-24 animate-pulse rounded-full bg-white/[0.07]" />
          <div className="mt-4 h-9 w-2/3 max-w-md animate-pulse rounded-xl bg-white/[0.07] sm:h-11" />
          <div className="mt-3 h-3 w-1/2 max-w-sm animate-pulse rounded-full bg-white/[0.05]" />
        </div>
        <div className="h-11 w-40 shrink-0 animate-pulse rounded-full bg-white/[0.05]" />
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl border border-white/[0.05] bg-white/[0.03] sm:h-28" />
        ))}
      </div>

      {chart && <div className="h-64 animate-pulse rounded-3xl border border-white/[0.05] bg-white/[0.03]" />}

      {/* content rows */}
      <div className="space-y-2.5">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-2xl border border-white/[0.05] bg-white/[0.03]"
            style={{ animationDelay: `${i * 60}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
