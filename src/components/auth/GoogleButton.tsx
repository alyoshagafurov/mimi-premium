'use client';

import { useEffect, useState } from 'react';
import { getProviders, signIn } from 'next-auth/react';

/**
 * "Continue with Google" — renders only when the Google provider is actually
 * configured on the server (getProviders reflects the live auth config), so it
 * never appears as a dead button before the credentials are set.
 */
export function GoogleButton({ label = 'Продолжить через Google' }: { label?: string }) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getProviders().then((p) => setEnabled(!!p?.google)).catch(() => setEnabled(false));
  }, []);

  if (!enabled) return null;

  return (
    <div className="md:col-span-2">
      <button
        type="button"
        disabled={loading}
        onClick={() => { setLoading(true); signIn('google', { callbackUrl: '/dashboard' }); }}
        className="flex w-full items-center justify-center gap-3 rounded-full border border-white/15 bg-white/[0.03] px-6 py-3.5 text-[13px] font-bold uppercase tracking-[0.14em] text-light transition-all duration-300 hover:border-brand-lime/50 hover:bg-white/[0.06] disabled:opacity-60"
      >
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22 22-9.8 22-22c0-1.2-.1-2.3-.4-3.5z" />
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 4.1 29.6 2 24 2 15.5 2 8.1 6.8 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 46c5.5 0 10.5-2.1 14.3-5.5l-6.6-5.6C29.6 36.7 26.9 38 24 38c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C8 41.1 15.4 46 24 46z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.6l6.6 5.6C41.1 36.9 44 31 44 24c0-1.2-.1-2.3-.4-3.5z" />
        </svg>
        {label}
      </button>
      <div className="mt-4 flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-muted">
        <span className="h-px flex-1 bg-white/[0.08]" />или<span className="h-px flex-1 bg-white/[0.08]" />
      </div>
    </div>
  );
}
