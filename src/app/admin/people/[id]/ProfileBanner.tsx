/**
 * Обложка профиля. Прилипает к верху и уезжает **за** карточку профиля при
 * скролле: сама карточка непрозрачная и с z-index выше, поэтому просто
 * наползает сверху. Параллакс — только `transform`/`opacity` через CSS,
 * без слушателей скролла и без работы в главном потоке.
 */
export function ProfileBanner({ src }: { src: string | null }) {
  return (
    <div className="sticky top-0 z-0 h-44 w-full overflow-hidden rounded-3xl sm:h-64">
      {src ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" className="h-full w-full object-cover" />
          {/* Затемнение к низу — обложка мягко уходит в фон карточки */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-ink2/90" />
        </>
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-brand-purple/35 via-ink2 to-brand-lime/10" />
      )}
    </div>
  );
}
