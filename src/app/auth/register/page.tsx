'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Logo } from '@/components/ui/Logo';
import { cn } from '@/lib/utils';

type Role = 'CLIENT' | 'ADMIN';

export default function RegisterPage() {
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
  const [role, setRole] = useState<Role>('CLIENT');
  const [loading, setLoading] = useState(false);

  const onChange = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error('Пароли не совпадают');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Пароль минимум 6 символов');
      return;
    }
    if (role === 'CLIENT' && !form.businessName) {
      toast.error('Укажите название бизнеса');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'failed');

      const signed = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (signed?.error) {
        toast.error('Аккаунт создан, но не получилось войти. Попробуйте сами.');
        router.push('/auth/login');
        return;
      }
      toast.success(role === 'ADMIN' ? 'Админ-аккаунт создан' : 'Добро пожаловать в mimi.');
      router.push(role === 'ADMIN' ? '/admin' : '/dashboard');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message ?? 'Не удалось зарегистрироваться');
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
          <p className="mt-3 text-xs uppercase tracking-[0.3em] text-muted">создание аккаунта</p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/[0.02] p-1.5">
          {(['CLIENT', 'ADMIN'] as Role[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={cn(
                'rounded-xl px-4 py-2.5 text-xs font-medium uppercase tracking-[0.18em] transition',
                role === r ? 'bg-gold-gradient text-ink shadow-gold' : 'text-muted hover:text-light',
              )}
            >
              {r === 'CLIENT' ? 'Я владелец бизнеса' : 'Я администратор'}
            </button>
          ))}
        </div>
        {role === 'ADMIN' && (
          <p className="mb-5 text-[11px] text-muted">
            * Первый зарегистрированный админ получает права. Последующие — становятся клиентами по умолчанию.
          </p>
        )}

        <form onSubmit={submit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="label-soft">Имя</label>
            <input required className="input-glass" value={form.name} onChange={onChange('name')} placeholder="Иван Иванов" />
          </div>
          <div>
            <label className="label-soft">Телефон</label>
            <input className="input-glass" value={form.phone} onChange={onChange('phone')} placeholder="+7 ___" />
          </div>
          <div className="md:col-span-2">
            <label className="label-soft">Email</label>
            <input type="email" required className="input-glass" value={form.email} onChange={onChange('email')} placeholder="you@company.com" />
          </div>
          {role === 'CLIENT' && (
            <>
              <div>
                <label className="label-soft">Название бизнеса</label>
                <input required className="input-glass" value={form.businessName} onChange={onChange('businessName')} placeholder="Acme Inc." />
              </div>
              <div>
                <label className="label-soft">Ниша</label>
                <input className="input-glass" value={form.niche} onChange={onChange('niche')} placeholder="Недвижимость" />
              </div>
            </>
          )}
          <div>
            <label className="label-soft">Пароль</label>
            <input type="password" required minLength={6} className="input-glass" value={form.password} onChange={onChange('password')} placeholder="••••••••" />
          </div>
          <div>
            <label className="label-soft">Подтверждение</label>
            <input type="password" required minLength={6} className="input-glass" value={form.confirm} onChange={onChange('confirm')} placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading} className="btn-gold mt-2 w-full disabled:opacity-60 md:col-span-2">
            {loading ? 'Создаём аккаунт...' : 'Создать аккаунт'}
          </button>
        </form>
        <div className="mt-6 flex items-center justify-between text-xs text-muted">
          <Link href="/" className="transition hover:text-gold">← На главную</Link>
          <Link href="/auth/login" className="transition hover:text-gold">Уже есть аккаунт</Link>
        </div>
      </motion.div>
    </main>
  );
}
