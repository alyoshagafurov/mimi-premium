'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CaseCard, type CaseCardData } from './CaseCard';

/**
 * Карусель кейсов: в центре — крупная карточка, соседние уменьшены, повёрнуты
 * и размыты, как будто колесо провернули вбок.
 *
 * Прокрутка настоящая, нативная: тач-свайп и трекпад работают сами, поэтому
 * без JS это просто горизонтальный список — карточки видны сразу, а не ждут
 * скрипта. Поворот и размытие считаются от расстояния до центра и пишутся в
 * transform/opacity, чтобы не трогать раскладку.
 */

/** Насколько далеко от центра карточка ещё участвует в эффекте. */
const MAX_DEPTH = 2;

export function CasesCarousel({ cases }: { cases: CaseCardData[] }) {
  const trackRef = useRef<HTMLUListElement>(null);
  const cardsRef = useRef<(HTMLLIElement | null)[]>([]);
  const frameRef = useRef(0);
  const [active, setActive] = useState(0);
  /** Тот же active, но доступный из обработчиков событий без пересоздания. */
  const activeRef = useRef(0);

  /** Пересчитать вид карточек по текущему положению прокрутки. */
  const paint = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const center = track.scrollLeft + track.clientWidth / 2;
    let nearest = 0;
    let nearestDistance = Infinity;

    cardsRef.current.forEach((card, i) => {
      if (!card) return;
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      // Расстояние в ширинах карточки: 0 — ровно в центре, 1 — соседняя.
      const offset = (cardCenter - center) / card.offsetWidth;
      const depth = Math.min(Math.abs(offset), MAX_DEPTH);

      card.style.transform =
        `perspective(1400px) translateX(${-offset * 16}%) rotateY(${offset * -24}deg) scale(${1 - depth * 0.17})`;
      card.style.opacity = String(Math.max(0.3, 1 - depth * 0.3));
      card.style.filter = depth < 0.2 ? 'none' : `blur(${Math.min(depth * 3.5, 6)}px)`;
      card.style.zIndex = String(100 - Math.round(depth * 10));

      if (depth < nearestDistance) {
        nearestDistance = depth;
        nearest = i;
      }
    });

    activeRef.current = nearest;
    setActive((cur) => (cur === nearest ? cur : nearest));
  }, []);

  const schedulePaint = useCallback(() => {
    cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(paint);
  }, [paint]);

  const scrollToIndex = useCallback((index: number, behavior: ScrollBehavior = 'smooth') => {
    const track = trackRef.current;
    const card = cardsRef.current[index];
    if (!track || !card) return;
    track.scrollTo({
      left: card.offsetLeft + card.offsetWidth / 2 - track.clientWidth / 2,
      behavior,
    });
  }, []);

  useEffect(() => {
    // Входим со второго кейса: тогда сразу видно три — крупный по центру и по
    // одному с каждой стороны.
    if (cases.length >= 3) scrollToIndex(1, 'auto');
    paint();
    const onResize = () => schedulePaint();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(frameRef.current);
    };
  }, [cases.length, paint, schedulePaint, scrollToIndex]);

  /**
   * Одно движение колеса — один кейс. Доехали до края — колесо снова листает
   * страницу, иначе на карусели было бы не выбраться к кнопке под ней.
   */
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let lockedUntil = 0;

    const onWheel = (e: WheelEvent) => {
      // Трекпад сам умеет вбок — ему не мешаем.
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      const next = activeRef.current + (e.deltaY > 0 ? 1 : -1);
      if (next < 0 || next > cases.length - 1) return;
      e.preventDefault();
      // Инерция трекпада шлёт десятки событий — пропускаем их до конца хода.
      const now = performance.now();
      if (now < lockedUntil) return;
      lockedUntil = now + 420;
      scrollToIndex(next);
    };

    track.addEventListener('wheel', onWheel, { passive: false });
    return () => track.removeEventListener('wheel', onWheel);
  }, [cases.length, scrollToIndex]);

  /* ── Перетаскивание мышью ── */
  const drag = useRef({ active: false, startX: 0, startScroll: 0, moved: 0 });

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return; // тач и перо скроллят сами
    const track = trackRef.current;
    if (!track) return;
    drag.current = { active: true, startX: e.clientX, startScroll: track.scrollLeft, moved: 0 };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const track = trackRef.current;
    if (!drag.current.active || !track) return;
    const dx = e.clientX - drag.current.startX;
    drag.current.moved = Math.max(drag.current.moved, Math.abs(dx));
    track.scrollLeft = drag.current.startScroll - dx;
  };

  const endDrag = () => {
    drag.current.active = false;
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); scrollToIndex(Math.min(active + 1, cases.length - 1)); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); scrollToIndex(Math.max(active - 1, 0)); }
  };

  return (
    <div className="relative">
      {/* Края растворяются — карусель выглядит продолжающейся, а не обрезанной. */}
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 z-[200] w-12 bg-gradient-to-r from-ink to-transparent sm:w-24" />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 z-[200] w-12 bg-gradient-to-l from-ink to-transparent sm:w-24" />

      <ul
        ref={trackRef}
        onScroll={schedulePaint}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onKeyDown={onKeyDown}
        tabIndex={0}
        role="region"
        aria-roledescription="карусель"
        aria-label="Кейсы агентства — листайте вбок"
        className="scrollbar-none flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain py-10 focus-visible:outline-none"
        style={{ ['--card' as string]: 'min(78vw, 460px)' }}
      >
        {/* Распорки, чтобы первая и последняя карточка вставали по центру. */}
        <li aria-hidden className="w-[calc(50%-var(--card)/2)] shrink-0" />

        {cases.map((c, i) => (
          <li
            key={c.slug}
            ref={(el) => { cardsRef.current[i] = el; }}
            className="w-[var(--card)] shrink-0 snap-center px-3 will-change-transform"
            onClickCapture={(e) => {
              // Клик по соседней карточке подводит её в центр, а не уводит со страницы.
              if (drag.current.moved > 6) { e.preventDefault(); e.stopPropagation(); return; }
              if (i !== active) { e.preventDefault(); e.stopPropagation(); scrollToIndex(i); }
            }}
          >
            <CaseCard c={c} priority={i === 0} headingLevel="h2" />
          </li>
        ))}

        <li aria-hidden className="w-[calc(50%-var(--card)/2)] shrink-0" />
      </ul>

      {/* Управление: стрелки, точки и счётчик. */}
      <div className="mt-2 flex items-center justify-center gap-5">
        <button
          type="button"
          onClick={() => scrollToIndex(Math.max(active - 1, 0))}
          disabled={active === 0}
          aria-label="Предыдущий кейс"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-light/70 transition-colors duration-300 hover:border-brand-lime hover:text-brand-lime disabled:opacity-25 disabled:hover:border-white/10 disabled:hover:text-light/70"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M19 12H5M11 18l-6-6 6-6" />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          {cases.map((c, i) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => scrollToIndex(i)}
              aria-label={`Кейс ${i + 1}: ${c.title}`}
              aria-current={i === active}
              className={
                i === active
                  ? 'h-1.5 w-7 rounded-full bg-brand-lime transition-all duration-500'
                  : 'h-1.5 w-1.5 rounded-full bg-light/20 transition-all duration-500 hover:bg-light/50'
              }
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => scrollToIndex(Math.min(active + 1, cases.length - 1))}
          disabled={active === cases.length - 1}
          aria-label="Следующий кейс"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-light/70 transition-colors duration-300 hover:border-brand-lime hover:text-brand-lime disabled:opacity-25 disabled:hover:border-white/10 disabled:hover:text-light/70"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>

      <p aria-live="polite" className="mt-4 text-center text-[11px] uppercase tracking-[0.24em] text-light/35">
        {active + 1} / {cases.length}
      </p>
    </div>
  );
}
