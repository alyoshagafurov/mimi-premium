'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { upload } from '@vercel/blob/client';
import { PdfReports, type PdfReport } from '@/components/dashboard/PdfReports';
import { MONTHS_RU, cn } from '@/lib/utils';

const MAX_BYTES = 50 * 1024 * 1024;

/** Отчёт обычно сдают за прошедший месяц — его и подставляем. */
function lastMonth() {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

export function ClientReportsPanel({ clientId, reports }: { clientId: string; reports: PdfReport[] }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [period, setPeriod] = useState(lastMonth);
  const [progress, setProgress] = useState<number | null>(null);
  const [drag, setDrag] = useState(false);

  const now = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => now - 3 + i);
  const busy = progress !== null;

  async function send(file: File) {
    if (busy) return;
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) return toast.error('Нужен PDF. Из Excel: Файл → Экспорт → PDF');
    if (file.size > MAX_BYTES) return toast.error('Файл больше 50 МБ');

    setProgress(0);
    try {
      // Файл уходит прямо в Blob — через нашу функцию прошёл бы только до 4,5 МБ.
      const blob = await upload(`reports/${clientId}/${period.year}-${String(period.month).padStart(2, '0')}.pdf`, file, {
        access: 'public',
        handleUploadUrl: '/api/client-files/upload',
        contentType: 'application/pdf',
        multipart: file.size > 4 * 1024 * 1024,
        onUploadProgress: ({ percentage }) => setProgress(Math.round(percentage)),
      });

      const res = await fetch('/api/client-files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, url: blob.url, size: file.size, ...period }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || 'Не удалось сохранить отчёт');

      toast.success(`Отчёт за ${MONTHS_RU[period.month - 1].toLowerCase()} ${period.year} добавлен — клиент получил уведомление`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Не удалось загрузить');
    } finally {
      setProgress(null);
      if (input.current) input.current.value = '';
    }
  }

  async function remove(r: PdfReport) {
    if (!confirm(`Удалить отчёт «${r.name}»? Клиент перестанет его видеть.`)) return;
    const res = await fetch(`/api/client-files/${r.id}`, { method: 'DELETE' });
    if (!res.ok) return toast.error('Не удалось удалить');
    toast.success('Отчёт удалён');
    router.refresh();
  }

  return (
    <div className="glass rounded-2xl p-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold">PDF-отчёты</h2>
          <p className="mt-0.5 text-[12px] text-muted">Клиент видит их в своём кабинете и может скачать.</p>
        </div>
        <span className="text-[11px] text-muted">{reports.length ? `${reports.length} в архиве` : 'пока пусто'}</span>
      </div>

      {/* Период + зона загрузки */}
      <div className="mb-6 grid gap-3 sm:grid-cols-[auto_1fr]">
        <div className="flex gap-2 sm:flex-col">
          <select
            className="input-glass"
            value={period.month}
            disabled={busy}
            onChange={(e) => setPeriod((p) => ({ ...p, month: Number(e.target.value) }))}
          >
            {MONTHS_RU.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select
            className="input-glass"
            value={period.year}
            disabled={busy}
            onChange={(e) => setPeriod((p) => ({ ...p, year: Number(e.target.value) }))}
          >
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={() => input.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            const f = e.dataTransfer.files?.[0];
            if (f) send(f);
          }}
          className={cn(
            'relative flex min-h-[96px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed px-4 py-5 text-center transition',
            drag ? 'border-brand-lime bg-brand-lime/[0.08]' : 'border-white/15 hover:border-brand-lime/50 hover:bg-white/[0.02]',
            busy && 'cursor-wait',
          )}
        >
          {busy ? (
            <>
              <span className="font-display text-2xl font-extrabold text-brand-lime">{progress}%</span>
              <span className="mt-1 text-[12px] text-muted">Загружаю отчёт за {MONTHS_RU[period.month - 1].toLowerCase()} {period.year}…</span>
              <span
                aria-hidden
                className="absolute bottom-0 left-0 h-1 bg-brand-lime transition-[width] duration-200"
                style={{ width: `${progress}%` }}
              />
            </>
          ) : (
            <>
              <span className="text-[13px] text-light">
                Перетащите PDF сюда или <span className="text-brand-lime underline underline-offset-4">выберите файл</span>
              </span>
              <span className="mt-1 text-[11px] text-muted">
                отчёт за {MONTHS_RU[period.month - 1].toLowerCase()} {period.year} · до 50 МБ
              </span>
            </>
          )}
        </button>
        <input
          ref={input}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) send(f);
          }}
        />
      </div>

      <PdfReports reports={reports} onDelete={remove} />
    </div>
  );
}
