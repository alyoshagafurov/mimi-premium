export default function Loading() {
  return (
    <div className="mx-auto flex min-h-[80svh] max-w-3xl flex-col items-center justify-center gap-6 px-5 pt-32" aria-busy>
      <div className="h-12 w-3/4 animate-pulse rounded-2xl bg-white/[0.05]" />
      <div className="h-5 w-1/2 animate-pulse rounded-full bg-white/[0.04]" />
      <div className="mt-6 flex gap-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 w-12 animate-pulse rounded-full bg-white/[0.05] sm:h-16 sm:w-16" />
        ))}
      </div>
    </div>
  );
}
