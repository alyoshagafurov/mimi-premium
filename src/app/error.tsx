'use client';

import { useEffect } from 'react';

/**
 * Route-level error boundary. Turns an unhandled server/client exception into a
 * recoverable page (with a retry) instead of Next's raw white "Application
 * error" screen — important because a transient DB hiccup on an authed page
 * shouldn't look like the whole app is broken.
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Surface it in the browser console / any attached monitoring.
    console.error('Route error:', error);
  }, [error]);

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-3 text-[10px] uppercase tracking-[0.32em] text-brand-orange">Ошибка</div>
      <h1 className="font-display text-2xl font-extrabold text-light sm:text-3xl">Что-то пошло не так</h1>
      <p className="mt-3 max-w-md text-sm text-light/60">
        Не удалось загрузить страницу. Обычно помогает повторить попытку — если ошибка
        повторяется, обновите страницу через минуту.
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <button onClick={() => reset()} className="btn-lime !px-6 !py-3 !text-[12px]">
          Повторить
        </button>
        <a href="/" className="btn-ghost !px-6 !py-3 !text-[12px]">
          На главную
        </a>
      </div>
      {error?.digest && (
        <p className="mt-6 font-mono text-[11px] text-light/25">код: {error.digest}</p>
      )}
    </main>
  );
}
