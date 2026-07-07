'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Logo } from '@/components/ui/Logo';
import { useCopy } from '@/i18n/LanguageProvider';
import type { Lang } from '@/i18n/config';

const ru = {
  cabinet: 'личный кабинет',
  labelEmail: 'Email',
  labelPassword: 'Пароль',
  submit: 'Войти',
  submitting: 'Входим...',
  errorLogin: 'Неверный email или пароль',
  successLogin: 'Добро пожаловать обратно',
  home: '← На главную',
  register: 'Создать аккаунт',
  forgot: 'Забыли пароль?',
};
const en: typeof ru = {
  cabinet: 'personal account',
  labelEmail: 'Email',
  labelPassword: 'Password',
  submit: 'Sign in',
  submitting: 'Signing in...',
  errorLogin: 'Invalid email or password',
  successLogin: 'Welcome back',
  home: '← Home',
  register: 'Create account',
  forgot: 'Forgot password?',
};
const tg: typeof ru = {
  cabinet: 'кабинети шахсӣ',
  labelEmail: 'Email',
  labelPassword: 'Парол',
  submit: 'Даромадан',
  submitting: 'Дохил мешавем...',
  errorLogin: 'Email ё парол нодуруст аст',
  successLogin: 'Хуш омадед',
  home: '← Ба саҳифаи асосӣ',
  register: 'Сохтани аккаунт',
  forgot: 'Паролро фаромӯш кардед?',
};
const COPY: Record<Lang, typeof ru> = { ru, en, tg };

function LoginInner() {
  const t = useCopy(COPY);
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get('callbackUrl') ?? '/dashboard';
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await signIn('credentials', {
      ...form,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      toast.error(t.errorLogin);
      return;
    }
    toast.success(t.successLogin);
    router.push(callbackUrl);
    router.refresh();
  };

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
          <p className="mt-3 text-xs uppercase tracking-[0.3em] text-muted">{t.cabinet}</p>
        </div>
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="label-soft">{t.labelEmail}</label>
            <input
              type="email"
              required
              className="input-glass"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@company.com"
              autoFocus
            />
          </div>
          <div>
            <label className="label-soft">{t.labelPassword}</label>
            <input
              type="password"
              required
              className="input-glass"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-gold w-full disabled:opacity-60">
            {loading ? t.submitting : t.submit}
          </button>
        </form>
        <div className="mt-6 flex items-center justify-between text-xs text-muted">
          <Link href="/" className="transition hover:text-gold">{t.home}</Link>
          <Link href="/auth/register" className="transition hover:text-gold">{t.register}</Link>
        </div>
        <div className="mt-3 text-center">
          <Link href="/auth/forgot" className="text-xs text-muted transition hover:text-gold">{t.forgot}</Link>
        </div>
      </motion.div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
