'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Logo } from '@/components/ui/Logo';
import { useCopy } from '@/i18n/LanguageProvider';
import type { Lang } from '@/i18n/config';

const ru = {
  cabinet: 'создание аккаунта',
  labelName: 'Имя',
  placeholderName: 'Иван Иванов',
  labelPhone: 'Телефон',
  labelEmail: 'Email',
  labelBusiness: 'Название бизнеса',
  labelNiche: 'Ниша',
  placeholderNiche: 'Недвижимость',
  labelPassword: 'Пароль',
  labelConfirm: 'Подтверждение',
  submit: 'Создать аккаунт',
  submitting: 'Создаём аккаунт...',
  errPassMatch: 'Пароли не совпадают',
  errPassLen: 'Пароль минимум 8 символов',
  errBusiness: 'Укажите название бизнеса',
  errAutoLogin: 'Аккаунт создан, но не получилось войти. Попробуйте сами.',
  successAdmin: 'Админ-аккаунт создан',
  successClient: 'Добро пожаловать в mimi.',
  errGeneric: 'Не удалось зарегистрироваться',
  home: '← На главную',
  hasAccount: 'Уже есть аккаунт',
};
const en: typeof ru = {
  cabinet: 'create account',
  labelName: 'Name',
  placeholderName: 'John Smith',
  labelPhone: 'Phone',
  labelEmail: 'Email',
  labelBusiness: 'Business name',
  labelNiche: 'Niche',
  placeholderNiche: 'Real estate',
  labelPassword: 'Password',
  labelConfirm: 'Confirm password',
  submit: 'Create account',
  submitting: 'Creating account...',
  errPassMatch: 'Passwords do not match',
  errPassLen: 'Password must be at least 8 characters',
  errBusiness: 'Please enter business name',
  errAutoLogin: 'Account created but auto-login failed. Please sign in manually.',
  successAdmin: 'Admin account created',
  successClient: 'Welcome to mimi.',
  errGeneric: 'Registration failed',
  home: '← Home',
  hasAccount: 'Already have an account',
};
const tg: typeof ru = {
  cabinet: 'сохтани аккаунт',
  labelName: 'Ном',
  placeholderName: 'Аҳмад Аҳмадов',
  labelPhone: 'Телефон',
  labelEmail: 'Email',
  labelBusiness: 'Номи бизнес',
  labelNiche: 'Ниша',
  placeholderNiche: 'Амволи ғайриманқул',
  labelPassword: 'Парол',
  labelConfirm: 'Тасдиқи парол',
  submit: 'Сохтани аккаунт',
  submitting: 'Аккаунт сохта истодаем...',
  errPassMatch: 'Паролҳо мувофиқат намекунанд',
  errPassLen: 'Парол ҳадди ақал 8 рамз',
  errBusiness: 'Номи бизнесро нависед',
  errAutoLogin: 'Аккаунт сохта шуд, аммо даромадан нашуд. Худатон кӯшиш кунед.',
  successAdmin: 'Аккаунти админ сохта шуд',
  successClient: 'Хуш омадед ба mimi.',
  errGeneric: 'Бақайдгирӣ нашуд',
  home: '← Ба саҳифаи асосӣ',
  hasAccount: 'Аккаунт доред',
};
const COPY: Record<Lang, typeof ru> = { ru, en, tg };

export default function RegisterPage() {
  const t = useCopy(COPY);
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
    businessName: '',
    niche: '',
  });
  const [loading, setLoading] = useState(false);

  const onChange = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error(t.errPassMatch);
      return;
    }
    if (form.password.length < 8) {
      toast.error(t.errPassLen);
      return;
    }
    if (!form.businessName) {
      toast.error(t.errBusiness);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'failed');

      const signed = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (signed?.error) {
        toast.error(t.errAutoLogin);
        router.push('/auth/login');
        return;
      }
      toast.success(t.successClient);
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message ?? t.errGeneric);
    } finally {
      setLoading(false);
    }
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
        className="glass-gold relative z-10 w-full max-w-xl rounded-3xl p-8 md:p-10"
      >
        <div className="mb-8 text-center">
          <Logo size="md" />
          <p className="mt-3 text-xs uppercase tracking-[0.3em] text-muted">{t.cabinet}</p>
        </div>

        <form onSubmit={submit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="label-soft">{t.labelName}</label>
            <input required className="input-glass" value={form.name} onChange={onChange('name')} placeholder={t.placeholderName} />
          </div>
          <div>
            <label className="label-soft">{t.labelPhone}</label>
            <input className="input-glass" value={form.phone} onChange={onChange('phone')} placeholder="+992 ___" />
          </div>
          <div className="md:col-span-2">
            <label className="label-soft">{t.labelEmail}</label>
            <input type="email" required className="input-glass" value={form.email} onChange={onChange('email')} placeholder="you@company.com" />
          </div>
          <div>
            <label className="label-soft">{t.labelBusiness}</label>
            <input required className="input-glass" value={form.businessName} onChange={onChange('businessName')} placeholder="Acme Inc." />
          </div>
          <div>
            <label className="label-soft">{t.labelNiche}</label>
            <input className="input-glass" value={form.niche} onChange={onChange('niche')} placeholder={t.placeholderNiche} />
          </div>
          <div>
            <label className="label-soft">{t.labelPassword}</label>
            <input type="password" required minLength={8} className="input-glass" value={form.password} onChange={onChange('password')} placeholder="••••••••" />
          </div>
          <div>
            <label className="label-soft">{t.labelConfirm}</label>
            <input type="password" required minLength={8} className="input-glass" value={form.confirm} onChange={onChange('confirm')} placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading} className="btn-gold mt-2 w-full disabled:opacity-60 md:col-span-2">
            {loading ? t.submitting : t.submit}
          </button>
        </form>
        <div className="mt-6 flex items-center justify-between text-xs text-muted">
          <Link href="/" className="transition hover:text-gold">{t.home}</Link>
          <Link href="/auth/login" className="transition hover:text-gold">{t.hasAccount}</Link>
        </div>
      </motion.div>
    </main>
  );
}
