/** Скелет страницы «Кейсы»: те же пропорции, что у настоящих карточек, — ничего не прыгает. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-[1500px] px-5 pb-24 pt-32 lg:px-12" aria-busy>
      <div className="h-4 w-40 animate-pulse rounded-full bg-white/[0.05]" />
      <div className="mt-6 h-14 w-2/3 max-w-xl animate-pulse rounded-2xl bg-white/[0.06]" />
      <div className="mt-5 h-5 w-1/2 max-w-md animate-pulse rounded-full bg-white/[0.04]" />
      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
        {[0, 1, 2].map((i) => (
          <div key={i} className="overflow-hidden rounded-[28px] border border-white/[0.07]">
            <div className="aspect-square animate-pulse bg-white/[0.05]" />
            <div className="space-y-3 p-6">
              <div className="h-6 w-3/4 animate-pulse rounded-lg bg-white/[0.06]" />
              <div className="h-4 w-full animate-pulse rounded-full bg-white/[0.04]" />
              <div className="h-4 w-2/3 animate-pulse rounded-full bg-white/[0.04]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
