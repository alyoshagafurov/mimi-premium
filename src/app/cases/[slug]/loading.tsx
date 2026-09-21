/** Скелет страницы кейса: большая квадратная сцена и заголовок, как в настоящей шапке. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-[1180px] px-5 pb-24 pt-32 lg:px-8" aria-busy>
      <div className="h-4 w-56 animate-pulse rounded-full bg-white/[0.05]" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,440px)_1fr] lg:items-center lg:gap-14">
        <div className="aspect-square animate-pulse rounded-[32px] bg-white/[0.05]" />
        <div className="space-y-4">
          <div className="h-3 w-40 animate-pulse rounded-full bg-white/[0.05]" />
          <div className="h-12 w-4/5 animate-pulse rounded-2xl bg-white/[0.06]" />
          <div className="h-4 w-full animate-pulse rounded-full bg-white/[0.04]" />
          <div className="h-4 w-11/12 animate-pulse rounded-full bg-white/[0.04]" />
          <div className="h-4 w-3/4 animate-pulse rounded-full bg-white/[0.04]" />
        </div>
      </div>
    </div>
  );
}
