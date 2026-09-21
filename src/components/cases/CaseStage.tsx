'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn, isOptimizableImage } from '@/lib/utils';

/**
 * Насколько пропорции логотипа могут отличаться от сцены, чтобы его можно было
 * растянуть на всю площадь. 1.28 пропускает квадрат и формат поста Instagram
 * (4:5 = 1080×1350) — у них срезается лишь пустой фон по краям. Всё, что
 * вытянуто сильнее (логотип-надпись в строку), показываем целиком.
 */
const MAX_COVER_SKEW = Math.log(1.28);

const fitFor = (imageRatio: number, stageRatio: number): 'cover' | 'contain' =>
  Math.abs(Math.log(imageRatio / stageRatio)) > MAX_COVER_SKEW ? 'contain' : 'cover';

/**
 * Сцена кейса. Логотип заполняет её целиком — без пустых полей, а сильно
 * вытянутый показывается целиком, поля заполняет его же размытая копия.
 *
 * Пропорции логотипа админка сохраняет при загрузке (logoRatio), поэтому вид
 * выбирается сразу на сервере и ничего не прыгает. Для старых кейсов без
 * logoRatio вид уточняется после загрузки картинки.
 */
export function CaseStage({
  logo,
  logoRatio = null,
  cover,
  title,
  sizes,
  ratio = 1,
  priority = false,
  className,
}: {
  logo: string | null;
  /** Ширина логотипа к высоте, если известна. */
  logoRatio?: number | null;
  cover: string | null;
  title: string;
  sizes: string;
  /** Ширина сцены к высоте: 1 — квадрат. */
  ratio?: number;
  priority?: boolean;
  className?: string;
}) {
  const [measured, setMeasured] = useState<'cover' | 'contain' | null>(null);
  const fit = logoRatio ? fitFor(logoRatio, ratio) : measured ?? 'cover';

  return (
    <div className={cn('relative overflow-hidden bg-ink2', className)}>
      {logo ? (
        <>
          {/* Размытая копия нужна только под вписанным логотипом — иначе её не видно. */}
          {fit === 'contain' && (
            <Image
              src={logo}
              alt=""
              aria-hidden
              fill
              sizes="96px"
              unoptimized={!isOptimizableImage(logo)}
              className="scale-125 object-cover opacity-80 blur-2xl"
            />
          )}
          <Image
            src={logo}
            alt={`Логотип: ${title}`}
            fill
            sizes={sizes}
            priority={priority}
            unoptimized={!isOptimizableImage(logo)}
            onLoad={
              logoRatio
                ? undefined
                : (e) => {
                    const img = e.currentTarget;
                    if (img.naturalWidth && img.naturalHeight) setMeasured(fitFor(img.naturalWidth / img.naturalHeight, ratio));
                  }
            }
            className={cn(
              'transition-transform duration-700 ease-out group-hover:scale-[1.04]',
              fit === 'cover' ? 'object-cover' : 'object-contain',
            )}
          />
        </>
      ) : cover ? (
        <Image
          src={cover}
          alt={title}
          fill
          sizes={sizes}
          priority={priority}
          unoptimized={!isOptimizableImage(cover)}
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
      ) : (
        <div className="flex h-full items-center justify-center bg-brand-purple/25 font-display text-5xl font-extrabold text-brand-lime/40">
          mimi
        </div>
      )}
    </div>
  );
}
