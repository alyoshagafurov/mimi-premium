'use client';

import { useEffect, useMemo, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Logo } from '@/components/ui/Logo';
import { GoogleButton } from '@/components/auth/GoogleButton';
import { useCopy } from '@/i18n/LanguageProvider';
import type { Lang } from '@/i18n/config';
import { ASSIGNABLE_ROLES, ROLE_LABEL } from '@/lib/roles';
import type { Role } from '@prisma/client';
import { passwordRules, isStrongPassword, emailProblem, phoneProblem } from '@/lib/validation';

const ru = {
  cabinet: 'создание аккаунта',
  labelName: 'Имя',
  placeholderName: 'Иван Иванов',
  labelPhone: 'Телефон',
  labelEmail: 'Email',
  labelPassword: 'Пароль',
  labelConfirm: 'Подтверждение',
  submit: 'Создать аккаунт',
  submitting: 'Создаём аккаунт...',
  errPassMatch: 'Пароли не совпадают',
  errAutoLogin: 'Аккаунт создан, но не получилось войти. Попробуйте сами.',
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
  labelPassword: 'Password',
  labelConfirm: 'Confirm password',
  submit: 'Create account',
  submitting: 'Creating account...',
  errPassMatch: 'Passwords do not match',
  errAutoLogin: 'Account created but auto-login failed. Please sign in manually.',
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
  labelPassword: 'Парол',
  labelConfirm: 'Тасдиқи парол',
  submit: 'Сохтани аккаунт',
  submitting: 'Аккаунт сохта истодаем...',
  errPassMatch: 'Паролҳо мувофиқат намекунанд',
  errAutoLogin: 'Аккаунт сохта шуд, аммо даромадан нашуд. Худатон кӯшиш кунед.',
  successClient: 'Хуш омадед ба mimi.',
  errGeneric: 'Бақайдгирӣ нашуд',
  home: '← Ба саҳифаи асосӣ',
  hasAccount: 'Аккаунт доред',
};
const COPY: Record<Lang, typeof ru> = { ru, en, tg };

export default function RegisterPage() {
  const t = useCopy(COPY);
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  // Клиент или сотрудник агентства — сотрудник дополнительно выбирает должность.
  const [asStaff, setAsStaff] = useState(false);
  const [staffRole, setStaffRole] = useState<Role>('VIDEOGRAPHER');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'code'>('form');
  const [code, setCode] = useState('');
  const [resendIn, setResendIn] = useState(0);

  const onChange = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));
  const blur = (k: string) => () => setTouched((s) => ({ ...s, [k]: true }));

  const rules = useMemo(() => passwordRules(form.password), [form.password]);
  const emailErr = form.email ? emailProblem(form.email) : null;
  const phoneErr = form.phone ? phoneProblem(form.phone) : null;
  const passOk = isStrongPassword(form.password);
  const matchErr = form.confirm && form.password !== form.confirm ? t.errPassMatch : null;

  const canSubmit =
    form.name.trim().length >= 2 && !emailErr && form.email && !phoneErr && form.phone && passOk && !matchErr && form.confirm;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, phone: true, password: true, confirm: true });
    const firstError = emailProblem(form.email) ?? phoneProblem(form.phone) ?? (passOk ? null : 'Пароль не соответствует требованиям') ?? matchErr;
    if (firstError) return toast.error(firstError);

    setLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name, email: form.email, phone: form.phone, password: form.password,
          ...(asStaff ? { role: staffRole } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'failed');

      // Email confirmation required → show the code step (password kept in state).
      if (data.needsVerification) {
        setStep('code');
        setResendIn(45);
        toast.success('Код отправлен на ' + form.email);
        return;
      }
      await finishLogin();
    } catch (err: any) {
      toast.error(err.message ?? t.errGeneric);
    } finally {
      setLoading(false);
    }
  };

  // Sign in with the credentials we still hold in state, then go to the cabinet.
  const finishLogin = async () => {
    if (asStaff) {
      toast.success('Почта подтверждена. Осталось дождаться одобрения администратора.');
      router.push('/auth/login?pending=1');
      return;
    }
    const signed = await signIn('credentials', { email: form.email, password: form.password, redirect: false });
    if (signed?.error) {
      toast.error(t.errAutoLogin);
      router.push('/auth/login');
      return;
    }
    toast.success(t.successClient);
    router.push('/dashboard');
    router.refresh();
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.replace(/\D/g, '').length !== 6) return toast.error('Введите 6-значный код из письма');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Неверный код');
      await finishLogin();
    } catch (err: any) {
      toast.error(err.message ?? 'Неверный код');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (resendIn > 0) return;
    await fetch('/api/auth/verify-email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.email }),
    });
    setResendIn(45);
    toast.success('Код отправлен повторно');
  };

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [resendIn]);

  const errText = (msg: string | null, key: string) =>
    msg && touched[key] ? <p className="mt-1.5 text-[11px] leading-snug text-rose-400">{msg}</p> : null;

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
          <p className="mt-3 text-xs uppercase tracking-[0.3em] text-muted">
            {step === 'code' ? 'подтверждение почты' : t.cabinet}
          </p>
        </div>

        {step === 'code' ? (
          <form onSubmit={verify} className="space-y-5">
            <p className="text-center text-sm leading-relaxed text-light/65">
              Мы отправили 6-значный код на<br />
              <span className="font-medium text-light">{form.email}</span>. Введите его ниже.
            </p>
            <input
              autoFocus
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="______"
              className="input-glass text-center font-mono text-2xl tracking-[0.5em]"
            />
            <button type="submit" disabled={loading} className="btn-gold w-full disabled:opacity-60">
              {loading ? 'Проверяем…' : 'Подтвердить и войти'}
            </button>
            <div className="flex items-center justify-between text-xs text-muted">
              <button type="button" onClick={() => setStep('form')} className="hover:text-gold">← Изменить данные</button>
              <button type="button" onClick={resend} disabled={resendIn > 0} className="hover:text-gold disabled:opacity-50">
                {resendIn > 0 ? `Отправить снова (${resendIn})` : 'Отправить код снова'}
              </button>
            </div>
          </form>
        ) : (
        <form onSubmit={submit} noValidate className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <GoogleButton />

          {/* Клиент или сотрудник агентства */}
          <div className="md:col-span-2">
            <label className="label-soft">Я регистрируюсь как</label>
            <div className="mt-1 flex gap-2">
              {[
                { v: false, label: 'Клиент' },
                { v: true, label: 'Сотрудник агентства' },
              ].map((o) => (
                <button
                  key={String(o.v)}
                  type="button"
                  onClick={() => setAsStaff(o.v)}
                  className={
                    'rounded-full border px-4 py-2 text-[12px] transition ' +
                    (asStaff === o.v
                      ? 'border-brand-lime bg-brand-lime text-[#0A0712]'
                      : 'border-white/10 text-light/55 hover:text-light')
                  }
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {asStaff && (
            <div className="md:col-span-2">
              <label className="label-soft">Должность</label>
              <select className="input-glass" value={staffRole} onChange={(e) => setStaffRole(e.target.value as Role)}>
                {ASSIGNABLE_ROLES.filter((r) => r !== 'ADMIN').map((r) => (
                  <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                ))}
              </select>
              <p className="mt-2 text-[11px] leading-relaxed text-light/45">
                После подтверждения почты доступ откроется, когда вашу заявку одобрит администратор.
              </p>
            </div>
          )}

          <div>
            <label className="label-soft">{t.labelName}</label>
            <input required className="input-glass" value={form.name} onChange={onChange('name')} onBlur={blur('name')} placeholder={t.placeholderName} />
          </div>
          <div>
            <label className="label-soft">{t.labelPhone}</label>
            <input
              required
              inputMode="tel"
              className="input-glass"
              value={form.phone}
              onChange={onChange('phone')}
              onBlur={blur('phone')}
              placeholder="+992 90 123 45 67"
            />
            {errText(phoneErr, 'phone')}
          </div>
          <div className="md:col-span-2">
            <label className="label-soft">{t.labelEmail}</label>
            <input
              type="email"
              required
              inputMode="email"
              autoComplete="email"
              className="input-glass"
              value={form.email}
              onChange={onChange('email')}
              onBlur={blur('email')}
              placeholder="you@company.com"
            />
            {errText(emailErr, 'email')}
          </div>
          <div>
            <label className="label-soft">{t.labelPassword}</label>
            <input
              type="password"
              required
              autoComplete="new-password"
              className="input-glass"
              value={form.password}
              onChange={onChange('password')}
              onBlur={blur('password')}
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="label-soft">{t.labelConfirm}</label>
            <input
              type="password"
              required
              autoComplete="new-password"
              className="input-glass"
              value={form.confirm}
              onChange={onChange('confirm')}
              onBlur={blur('confirm')}
              placeholder="••••••••"
            />
            {errText(matchErr, 'confirm')}
          </div>

          {/* Live password checklist */}
          <ul className="md:col-span-2 grid grid-cols-1 gap-1.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 sm:grid-cols-2">
            {rules.map((r) => (
              <li key={r.id} className="flex items-center gap-2 text-[11px]">
                <span
                  className={
                    r.ok
                      ? 'flex h-4 w-4 items-center justify-center rounded-full bg-brand-lime/20 text-[9px] text-brand-lime'
                      : 'flex h-4 w-4 items-center justify-center rounded-full border border-white/15 text-[9px] text-light/30'
                  }
                >
                  {r.ok ? '✓' : '•'}
                </span>
                <span className={r.ok ? 'text-light/70' : 'text-light/40'}>{r.label}</span>
              </li>
            ))}
          </ul>

          <button type="submit" disabled={loading || !canSubmit} className="btn-gold mt-2 w-full disabled:opacity-50 md:col-span-2">
            {loading ? t.submitting : t.submit}
          </button>
        </form>
        )}
        <div className="mt-6 flex items-center justify-between text-xs text-muted">
          <Link href="/" className="transition hover:text-gold">{t.home}</Link>
          <Link href="/auth/login" className="transition hover:text-gold">{t.hasAccount}</Link>
        </div>
      </motion.div>
    </main>
  );
}
