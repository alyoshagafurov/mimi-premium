'use client';

/**
 * Last-resort boundary for errors thrown in the root layout itself (where the
 * normal error.tsx can't render). Must provide its own <html>/<body>.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ru">
      <body style={{ background: '#0A0712', color: '#F5F1FA', fontFamily: 'system-ui, sans-serif', margin: 0 }}>
        <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '24px' }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Что-то пошло не так</h1>
          <p style={{ marginTop: 12, maxWidth: 420, color: 'rgba(245,241,250,0.6)', fontSize: 14 }}>
            Попробуйте повторить попытку или обновите страницу через минуту.
          </p>
          <button
            onClick={() => reset()}
            style={{ marginTop: 24, background: '#D4EC4C', color: '#0A0712', border: 0, borderRadius: 999, padding: '12px 24px', fontWeight: 700, cursor: 'pointer' }}
          >
            Повторить
          </button>
          {error?.digest && <p style={{ marginTop: 20, fontFamily: 'monospace', fontSize: 11, color: 'rgba(245,241,250,0.25)' }}>код: {error.digest}</p>}
        </main>
      </body>
    </html>
  );
}
