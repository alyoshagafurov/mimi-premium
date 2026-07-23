'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { passwordRules, isStrongPassword } from '@/lib/validation';
import { Logo } from '@/components/ui/Logo';

function ResetInner() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStrongPassword(password)) {
      toast.error('Пароль не соответствует требованиям безопасности');
      return;
    }
    if (password !== confirm) {
      toast.error('Пароли не совпадают');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'failed');
      toast.success('Пароль обновлён. Войдите с новым паролем.');
      router.push('/auth/login');
    } catch (err: any) {
      toast.error(err.message ?? 'Не удалось сбросить пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center px-5 py-16">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-[80vh] w-[80vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-purple/20 blur-3xl" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="glass-gold relative z-10 w-full max-w-md rounded-3xl p-8 md:p-10"
      >
        <div className="mb-8 text-center">
          <Logo size="md" />
          <p className="mt-3 text-xs uppercase tracking-[0.3em] text-muted">новый пароль</p>
        </div>

        {!token ? (
          <div className="text-center text-sm text-muted">
            Ссылка недействительна.{' '}
            <Link href="/auth/forgot" className="text-gold hover:underline">Запросить заново</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="label-soft">Новый пароль</label>
              <input type="password" required minLength={8} className="input-glass" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoFocus />
            </div>
            <div>
              <label className="label-soft">Подтверждение</label>
              <input type="password" required minLength={8} className="input-glass" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" />
            </div>
            <div>
              <ul className="grid grid-cols-1 gap-1.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 sm:grid-cols-2">
                {passwordRules(password).map((r) => (
                  <li key={r.id} className="flex items-center gap-2 text-[11px]">
                    <span className={r.ok ? 'flex h-4 w-4 items-center justify-center rounded-full bg-brand-lime/20 text-[9px] text-brand-lime' : 'flex h-4 w-4 items-center justify-center rounded-full border border-white/15 text-[9px] text-light/30'}>
                      {r.ok ? '✓' : '•'}
                    </span>
                    <span className={r.ok ? 'text-light/70' : 'text-light/40'}>{r.label}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button type="submit" disabled={loading} className="btn-gold w-full disabled:opacity-60">
              {loading ? 'Сохраняем...' : 'Сохранить пароль'}
            </button>
          </form>
        )}
      </motion.div>
    </main>
  );
}

export default function ResetPage() {
  return (
    <Suspense fallback={null}>
      <ResetInner />
    </Suspense>
  );
}
