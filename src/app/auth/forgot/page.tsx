'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Logo } from '@/components/ui/Logo';

export default function ForgotPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/auth/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch {
      toast.error('Что-то пошло не так. Попробуйте ещё раз.');
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
          <p className="mt-3 text-xs uppercase tracking-[0.3em] text-muted">восстановление пароля</p>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="mx-auto mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full border border-brand-lime/40 text-xl text-brand-lime">✓</div>
            <h1 className="font-display text-2xl font-extrabold">Проверьте почту</h1>
            <p className="mt-3 text-sm text-muted">
              Если аккаунт с таким email существует, мы отправили ссылку для сброса пароля. Ссылка действует 1 час.
            </p>
            <Link href="/auth/login" className="mt-6 inline-block text-xs uppercase tracking-[0.2em] text-muted transition hover:text-gold">
              ← Вернуться ко входу
            </Link>
          </div>
        ) : (
          <>
            <p className="mb-6 text-sm text-muted">Введите email — пришлём ссылку для восстановления пароля.</p>
            <form onSubmit={submit} className="space-y-5">
              <div>
                <label className="label-soft">Email</label>
                <input
                  type="email"
                  required
                  className="input-glass"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  autoFocus
                />
              </div>
              <button type="submit" disabled={loading} className="btn-gold w-full disabled:opacity-60">
                {loading ? 'Отправляем...' : 'Отправить ссылку'}
              </button>
            </form>
            <div className="mt-6 flex items-center justify-between text-xs text-muted">
              <Link href="/auth/login" className="transition hover:text-gold">← Вход</Link>
              <Link href="/auth/register" className="transition hover:text-gold">Создать аккаунт</Link>
            </div>
          </>
        )}
      </motion.div>
    </main>
  );
}
