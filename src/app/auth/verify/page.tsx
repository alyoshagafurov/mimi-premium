'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Logo } from '@/components/ui/Logo';
import { emailProblem } from '@/lib/validation';

function VerifyInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState(params.get('email') ?? '');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [sentOnce, setSentOnce] = useState(false);

  const send = async () => {
    if (resendIn > 0) return;
    if (emailProblem(email)) return toast.error('Введите корректный email');
    await fetch('/api/auth/verify-email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setResendIn(45);
    setSentOnce(true);
    toast.success('Если email зарегистрирован — код отправлен');
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.replace(/\D/g, '').length !== 6) return toast.error('Введите 6-значный код');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Неверный код');
      toast.success('Почта подтверждена — войдите');
      router.push('/auth/login');
    } catch (err: any) {
      toast.error(err.message ?? 'Неверный код');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [resendIn]);

  return (
    <main className="relative flex min-h-screen items-center justify-center px-5 py-16">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-[80vh] w-[80vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-purple/20 blur-3xl" />
        <div className="absolute right-[10%] top-[15%] h-72 w-72 rounded-full bg-brand-lime/8 blur-3xl" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="glass-gold relative z-10 w-full max-w-md rounded-3xl p-8 md:p-10"
      >
        <div className="mb-8 text-center">
          <Logo size="md" />
          <p className="mt-3 text-xs uppercase tracking-[0.3em] text-muted">подтверждение почты</p>
        </div>

        <form onSubmit={verify} className="space-y-5">
          <div>
            <label className="label-soft">Email</label>
            <input
              type="email"
              required
              className="input-glass"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
          </div>

          {!sentOnce ? (
            <button type="button" onClick={send} className="btn-gold w-full">Отправить код на почту</button>
          ) : (
            <>
              <div>
                <label className="label-soft">Код из письма</label>
                <input
                  autoFocus
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="______"
                  className="input-glass text-center font-mono text-2xl tracking-[0.5em]"
                />
              </div>
              <button type="submit" disabled={loading} className="btn-gold w-full disabled:opacity-60">
                {loading ? 'Проверяем…' : 'Подтвердить'}
              </button>
              <div className="text-center">
                <button type="button" onClick={send} disabled={resendIn > 0} className="text-xs text-muted transition hover:text-gold disabled:opacity-50">
                  {resendIn > 0 ? `Отправить снова (${resendIn})` : 'Отправить код снова'}
                </button>
              </div>
            </>
          )}
        </form>

        <div className="mt-6 text-center text-xs text-muted">
          <Link href="/auth/login" className="transition hover:text-gold">← Ко входу</Link>
        </div>
      </motion.div>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyInner />
    </Suspense>
  );
}
