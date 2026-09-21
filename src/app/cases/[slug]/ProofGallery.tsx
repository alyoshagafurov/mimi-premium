'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { cn, isOptimizableImage } from '@/lib/utils';

function Chevron({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={dir === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

/** Сколько колонок у сетки при таком количестве фото. */
function gridCols(count: number): string {
  // Одно-два фото не растягиваем на всю ширину экрана — они стали бы огромными.
  if (count === 1) return 'grid-cols-1 max-w-md';
  if (count === 2) return 'grid-cols-2 max-w-3xl';
  if (count === 3) return 'grid-cols-2 md:grid-cols-3';
  return 'grid-cols-2 md:grid-cols-4';
}

/**
 * Форма каждой плитки подобрана так, чтобы ряды заполнялись целиком и нигде
 * не оставалось одинокой плитки с пустотой рядом. С 5 фото первое становится
 * крупным (2×2 на компьютере). Одно-два фото — вертикальные: доказательства
 * чаще всего скриншоты телефона.
 */
function tileShape(i: number, count: number): { cls: string; wide: boolean } {
  if (count <= 2) return { cls: 'aspect-[4/5]', wide: true };
  if (count === 4) return { cls: 'aspect-square', wide: false };
  if (count === 3) {
    return i === 0
      ? { cls: 'col-span-2 aspect-[4/3] md:col-span-1 md:aspect-square', wide: true }
      : { cls: 'aspect-square', wide: false };
  }
  if (i === 0) return { cls: 'col-span-2 aspect-[4/3] md:row-span-2 md:aspect-auto', wide: true };
  // На телефоне фото идут парами — если последнее осталось без пары, растягиваем его.
  const orphan = (count - 1) % 2 === 1 && i === count - 1;
  return orphan
    ? { cls: 'col-span-2 aspect-[2/1] md:col-span-1 md:aspect-square', wide: true }
    : { cls: 'aspect-square', wide: false };
}

/** Попал ли клик в нарисованную часть картинки с object-contain, а не в поля вокруг. */
function hitsPicture(img: HTMLImageElement, x: number, y: number): boolean {
  const r = img.getBoundingClientRect();
  if (!img.naturalWidth || !img.naturalHeight) return true;
  const scale = Math.min(r.width / img.naturalWidth, r.height / img.naturalHeight);
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  const left = r.left + (r.width - w) / 2;
  const top = r.top + (r.height - h) / 2;
  return x >= left && x <= left + w && y >= top && y <= top + h;
}

/**
 * Фото-доказательства кейса: мозаика превью и просмотр на весь экран —
 * стрелками, клавишами ← → и свайпом на телефоне, с увеличением двумя пальцами.
 */
export function ProofGallery({ images, title }: { images: string[]; title: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const pictureRef = useRef<HTMLImageElement | null>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const lastTile = useRef<HTMLButtonElement | null>(null);
  const swipeX = useRef<number | null>(null);
  // Активные касания: два пальца — это увеличение, а не листание.
  const pointers = useRef(new Set<number>());
  // После свайпа браузер присылает ещё и click — его нужно проглотить.
  const swiped = useRef(false);
  const count = images.length;
  const isOpen = open !== null;

  const go = useCallback((step: number) => {
    setOpen((i) => (i === null ? i : (i + step + count) % count));
  }, [count]);

  const close = useCallback(() => {
    setOpen(null);
    lastTile.current?.focus();
  }, []);

  // Пока просмотр открыт: страница не прокручивается, работают ← → Esc,
  // а Tab не уходит за пределы окна просмотра.
  useEffect(() => {
    if (!isOpen) return;
    const html = document.documentElement;
    const prev = { html: html.style.overflow, body: document.body.style.overflow };
    // Прокручивается html (в globals.css у html и body overflow-x: hidden),
    // поэтому блокируем оба.
    html.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'Tab' && dialogRef.current) {
        const items = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled])'))
          .filter((el) => el.offsetParent !== null);
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      html.style.overflow = prev.html;
      document.body.style.overflow = prev.body;
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, go, close]);

  // Активная миниатюра всегда видна в ленте, даже если листали свайпом.
  useEffect(() => {
    if (open === null) return;
    thumbsRef.current
      ?.querySelector<HTMLElement>(`[data-thumb="${open}"]`)
      ?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }, [open]);

  if (!count) return null;

  const viewer =
    open !== null ? (
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${title}: фото ${open + 1} из ${count}`}
        // Просмотр всегда тёмный, в том числе в светлой теме сайта, и лежит
        // поверх всего — включая шапку сайта.
        className="fixed inset-0 z-[100] flex flex-col overscroll-contain bg-[#07050C] text-[#F5F1FA]"
      >
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
          <span className="font-mono text-[13px] tabular-nums text-[#F5F1FA]/70" aria-live="polite">
            {open + 1} / {count}
          </span>
          <button
            ref={closeRef}
            type="button"
            onClick={close}
            aria-label="Закрыть"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[#F5F1FA]/20 text-[#F5F1FA]/85 transition-colors hover:border-[#D4EC4C] hover:text-[#D4EC4C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4EC4C]/70"
          >
            <CloseIcon />
          </button>
        </div>

        <div
          className="relative flex-1 touch-pan-y touch-pinch-zoom"
          onPointerDown={(e) => {
            pointers.current.add(e.pointerId);
            swipeX.current = pointers.current.size === 1 ? e.clientX : null;
          }}
          onPointerUp={(e) => {
            const multi = pointers.current.size > 1;
            pointers.current.delete(e.pointerId);
            const start = swipeX.current;
            swipeX.current = null;
            // Увеличенное двумя пальцами фото тоже не листаем.
            const zoomed = (window.visualViewport?.scale ?? 1) > 1.01;
            if (start === null || multi || zoomed) return;
            const dx = e.clientX - start;
            if (Math.abs(dx) > 50) {
              swiped.current = true;
              go(dx < 0 ? 1 : -1);
            }
          }}
          onPointerCancel={(e) => { pointers.current.delete(e.pointerId); swipeX.current = null; }}
          onPointerLeave={(e) => { pointers.current.delete(e.pointerId); }}
          onClick={(e) => {
            if (swiped.current) { swiped.current = false; return; }
            // Клик по тёмному полю вокруг фото закрывает просмотр, по самому фото — нет.
            const img = pictureRef.current;
            if (e.target === e.currentTarget || (img && !hitsPicture(img, e.clientX, e.clientY))) close();
          }}
        >
          {/* Пока крупное фото грузится, в центре видно, что оно в пути. */}
          <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="h-9 w-9 animate-spin rounded-full border-2 border-[#F5F1FA]/15 border-t-[#D4EC4C]" />
          </div>
          <div className="absolute inset-y-0 left-2 right-2 sm:left-20 sm:right-20">
            {/* Соседние фото грузим заранее — листание без ожидания. */}
            {count > 1 &&
              Array.from(new Set([images[(open + 1) % count], images[(open - 1 + count) % count]]))
                .filter((src) => src !== images[open])
                .map((src) => (
                  <Image
                    key={`pre-${src}`}
                    src={src}
                    alt=""
                    aria-hidden
                    fill
                    sizes="100vw"
                    unoptimized={!isOptimizableImage(src)}
                    className="pointer-events-none opacity-0"
                  />
                ))}
            <Image
              key={images[open]}
              ref={pictureRef}
              src={images[open]}
              alt={`${title} — фото ${open + 1}`}
              fill
              sizes="100vw"
              priority
              unoptimized={!isOptimizableImage(images[open])}
              className="object-contain"
            />
          </div>
          {count > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); go(-1); }}
                aria-label="Предыдущее фото"
                className="absolute left-3 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-[#F5F1FA]/20 bg-[#07050C]/70 text-[#F5F1FA]/85 transition-colors hover:border-[#D4EC4C] hover:text-[#D4EC4C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4EC4C]/70 sm:flex"
              >
                <Chevron dir="left" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); go(1); }}
                aria-label="Следующее фото"
                className="absolute right-3 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-[#F5F1FA]/20 bg-[#07050C]/70 text-[#F5F1FA]/85 transition-colors hover:border-[#D4EC4C] hover:text-[#D4EC4C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4EC4C]/70 sm:flex"
              >
                <Chevron dir="right" />
              </button>
            </>
          )}
        </div>

        {count > 1 && (
          <div ref={thumbsRef} className="overflow-x-auto px-4 py-4">
            {/* w-max + mx-auto: лента по центру, но при переполнении прокручивается до самого начала. */}
            <div className="mx-auto flex w-max gap-2">
              {images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  data-thumb={i}
                  onClick={() => setOpen(i)}
                  aria-label={`Фото ${i + 1}`}
                  aria-current={i === open}
                  className={cn(
                    'relative h-14 w-11 shrink-0 overflow-hidden rounded-lg border-2 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4EC4C]/70',
                    i === open ? 'border-[#D4EC4C] opacity-100' : 'border-transparent opacity-50 hover:opacity-90',
                  )}
                >
                  <Image src={src} alt="" aria-hidden fill sizes="48px" unoptimized={!isOptimizableImage(src)} className="object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    ) : null;

  return (
    <>
      <div className={cn('grid gap-3 sm:gap-4', gridCols(count))}>
        {images.map((src, i) => {
          const shape = tileShape(i, count);
          return (
            <button
              key={src}
              type="button"
              onClick={(e) => { lastTile.current = e.currentTarget; setOpen(i); }}
              className={cn(
                'group relative block overflow-hidden rounded-2xl border border-white/[0.07] bg-ink2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime/60',
                shape.cls,
              )}
              aria-label={`Открыть фото ${i + 1} из ${count}`}
            >
              <Image
                src={src}
                alt={`${title} — фото ${i + 1}`}
                fill
                sizes={shape.wide ? '(min-width: 768px) 50vw, 100vw' : '(min-width: 768px) 25vw, 50vw'}
                unoptimized={!isOptimizableImage(src)}
                className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.04]"
              />
              <span className="absolute left-3 top-3 rounded-full bg-ink/75 px-2.5 py-0.5 font-mono text-[11px] tabular-nums text-light/80 backdrop-blur">
                {String(i + 1).padStart(2, '0')}
              </span>
            </button>
          );
        })}
      </div>

      {/* Портал в body: иначе просмотр остаётся внутри <main> и оказывается под шапкой сайта. */}
      {viewer && createPortal(viewer, document.body)}
    </>
  );
}
