'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export function ContactForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const onChange = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.email) {
      toast.error('Заполните имя, телефон и email');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('failed');
      setDone(true);
      toast.success('Заявка получена. Свяжемся в течение часа.');
    } catch {
      toast.error('Что-то пошло не так. Попробуйте ещё раз.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-3xl border border-brand-lime/30 bg-brand-lime/[0.03] p-12"
      >
        <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full border border-brand-lime/40 text-xl text-brand-lime">
          ✓
        </div>
        <h3 className="font-display text-3xl font-extrabold leading-tight tracking-tight">
          Заявка <span className="text-lime-grad">отправлена.</span>
        </h3>
        <p className="mt-4 text-sm text-light/55">
          Хотите видеть результат в личном кабинете? Регистрация бесплатная.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <button onClick={() => router.push('/auth/register')} className="btn-lime">
            Зарегистрироваться
          </button>
          <button onClick={() => setDone(false)} className="btn-ghost">
            Отправить ещё одну
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.form
      onSubmit={submit}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7 }}
      className="rounded-3xl border border-white/[0.06] bg-ink2/30 p-10"
    >
      <p className="text-[10px] uppercase tracking-[0.4em] text-brand-orange">
        Запрос на стратегию
      </p>
      <h3 className="mt-4 font-display text-3xl font-extrabold leading-tight tracking-tight">
        Аудит за <span className="text-lime-grad">48 часов</span>
      </h3>
      <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label className="label-soft">Имя</label>
          <input
            className="input-glass"
            value={form.name}
            onChange={onChange('name')}
            placeholder="Как к вам обращаться"
          />
        </div>
        <div>
          <label className="label-soft">Телефон</label>
          <input
            className="input-glass"
            value={form.phone}
            onChange={onChange('phone')}
            placeholder="+992 ___"
          />
        </div>
        <div className="md:col-span-2">
          <label className="label-soft">Email</label>
          <input
            type="email"
            className="input-glass"
            value={form.email}
            onChange={onChange('email')}
            placeholder="you@business.com"
          />
        </div>
        <div className="md:col-span-2">
          <label className="label-soft">О проекте</label>
          <textarea
            className="input-glass min-h-[100px] resize-none"
            value={form.message}
            onChange={onChange('message')}
            placeholder="Ниша, продукт, текущие цифры"
          />
        </div>
      </div>
      <div className="mt-10 flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
        <p className="text-[11px] text-light/40">
          Отправляя форму, вы соглашаетесь на обработку данных.
        </p>
        <button type="submit" disabled={loading} className="btn-lime w-full md:w-auto disabled:opacity-60">
          {loading ? 'Отправляем...' : 'Получить стратегию'}
        </button>
      </div>
    </motion.form>
  );
}
