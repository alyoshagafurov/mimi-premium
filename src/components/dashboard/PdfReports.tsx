'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { formatBytes, formatDate, reportPeriod, MONTHS_RU } from '@/lib/utils';

export type PdfReport = { id: string; name: string; url: string; size: number; createdAt: string };

/** Vercel Blob отдаёт файл «скачиванием», если добавить ?download=1. */
const downloadUrl = (url: string) => `${url}${url.includes('?') ? '&' : '?'}download=1`;

/** Угол листа загнут — карточка читается как документ, а не как ещё одна плитка. */
const FOLD = 22;
const sheetClip = `polygon(0 0, calc(100% - ${FOLD}px) 0, 100% ${FOLD}px, 100% 100%, 0 100%)`;

function DocCard({
  r, index, isNew, onOpen, onDelete,
}: {
  r: PdfReport; index: number; isNew: boolean;
  onOpen: () => void; onDelete?: () => void;
}) {
  const period = reportPeriod(r.name);
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.05, 0.4), ease: [0.22, 1, 0.36, 1] }}
      className="group relative"
    >
      {/* лист позади — стопка, а не одиночная карточка */}
      <div
        aria-hidden
        className="absolute inset-0 translate-x-[5px] translate-y-[5px] rotate-[1.2deg] rounded-2xl bg-white/[0.025] transition-transform duration-300 group-hover:translate-x-[8px] group-hover:translate-y-[8px] group-hover:rotate-[2.2deg]"
        style={{ clipPath: sheetClip }}
      />

      <button
        type="button"
        onClick={onOpen}
        className="relative block w-full rounded-2xl bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-4 text-left transition-transform duration-300 group-hover:-translate-y-1 focus-visible:-translate-y-1 focus-visible:outline-none sm:p-5"
        style={{ clipPath: sheetClip }}
      >
        {/* сам загиб */}
        <span
          aria-hidden
          className="absolute right-0 top-0 bg-gradient-to-bl from-white/25 to-white/5"
          style={{ width: FOLD, height: FOLD, clipPath: 'polygon(0 0, 0 100%, 100% 100%)' }}
        />

        <div className="flex items-center gap-2">
          <span className="rounded-md bg-rose-400/15 px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-[0.1em] text-rose-300">
            PDF
          </span>
          {isNew && (
            <span className="rounded-md bg-brand-lime/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-brand-lime">
              новый
            </span>
          )}
        </div>

        {/* «строки текста» — лист узнаётся с одного взгляда */}
        <div aria-hidden className="mt-4 space-y-1.5">
          {[82, 64, 74].map((w) => (
            <span key={w} className="block h-[3px] rounded-full bg-white/[0.08]" style={{ width: `${w}%` }} />
          ))}
        </div>

        <div className="mt-5">
          {period ? (
            <>
              <div className="font-display text-xl font-extrabold leading-none text-light transition-colors group-hover:text-brand-lime sm:text-2xl">
                {MONTHS_RU[period.month - 1]}
              </div>
              <div className="mt-1 font-mono text-[13px] text-brand-lime/80">{period.year}</div>
            </>
          ) : (
            <div className="line-clamp-2 font-display text-lg font-extrabold leading-tight text-light">{r.name}</div>
          )}
        </div>

        <div className="mt-4 border-t border-white/[0.06] pt-3 pr-16 text-[10.5px] text-light/40">
          {formatBytes(r.size)} · {formatDate(r.createdAt)}
        </div>
      </button>

      {/* действия поверх листа, не внутри кнопки — иначе клик открывал бы просмотр */}
      <div className="absolute bottom-3 right-3 flex gap-1 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
        <a
          href={downloadUrl(r.url)}
          title="Скачать"
          aria-label={`Скачать отчёт ${r.name}`}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-ink/80 text-[12px] text-light/70 transition hover:border-brand-lime/50 hover:text-brand-lime"
        >
          ↓
        </a>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            title="Удалить"
            aria-label={`Удалить отчёт ${r.name}`}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-ink/80 text-[12px] text-light/70 transition hover:border-rose-400/50 hover:text-rose-300"
          >
            ✕
          </button>
        )}
      </div>
    </motion.div>
  );
}

/** Полноэкранный просмотр PDF прямо на сайте. */
function Viewer({ report, onClose }: { report: PdfReport; onClose: () => void }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <motion.div
      role="dialog"
      aria-modal
      aria-label={`Отчёт ${report.name}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[90] flex flex-col bg-ink/90 p-3 backdrop-blur-md sm:p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="mx-auto flex h-full w-full max-w-6xl flex-col"
      >
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <span className="rounded-md bg-rose-400/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-rose-300">PDF</span>
          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-lg font-extrabold text-light">Отчёт · {report.name}</div>
            <div className="text-[11px] text-light/40">{formatBytes(report.size)} · загружен {formatDate(report.createdAt)}</div>
          </div>
          <a href={downloadUrl(report.url)} className="btn-lime !px-4 !py-2 !text-[11px]">Скачать</a>
          <a href={report.url} target="_blank" rel="noopener noreferrer" className="btn-ghost !px-4 !py-2 !text-[11px]">
            В новой вкладке
          </a>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-light/60 transition hover:border-brand-lime/50 hover:text-brand-lime"
          >
            ✕
          </button>
        </div>
        <iframe
          src={`${report.url}#view=FitH`}
          title={`Отчёт ${report.name}`}
          className="w-full flex-1 rounded-2xl border border-white/10 bg-white"
        />
      </motion.div>
    </motion.div>
  );
}

export function PdfReports({
  reports, onDelete, emptyText,
}: {
  reports: PdfReport[];
  onDelete?: (r: PdfReport) => void;
  emptyText?: string;
}) {
  const [open, setOpen] = useState<PdfReport | null>(null);

  // На телефоне PDF во фрейме показывает одну страницу — там честнее
  // открыть встроенный просмотрщик системы.
  const openReport = (r: PdfReport) => {
    if (window.matchMedia('(max-width: 767px)').matches) {
      window.open(r.url, '_blank', 'noopener,noreferrer');
      return;
    }
    setOpen(r);
  };

  if (reports.length === 0) {
    return emptyText ? (
      <p className="rounded-2xl border border-dashed border-white/10 py-10 text-center text-sm text-light/40">{emptyText}</p>
    ) : null;
  }

  // «Новый» — загружен за последние 7 дней.
  const weekAgo = Date.now() - 7 * 86_400_000;

  return (
    <>
      <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {reports.map((r, i) => (
          <DocCard
            key={r.id}
            r={r}
            index={i}
            isNew={new Date(r.createdAt).getTime() > weekAgo}
            onOpen={() => openReport(r)}
            onDelete={onDelete ? () => onDelete(r) : undefined}
          />
        ))}
      </div>
      <AnimatePresence>
        {open && <Viewer key={open.id} report={open} onClose={() => setOpen(null)} />}
      </AnimatePresence>
    </>
  );
}
