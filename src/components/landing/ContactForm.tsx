'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useCopy } from '@/i18n/LanguageProvider';
import type { Lang } from '@/i18n/config';

const ru = {
  validationError: 'Заполните имя, телефон и email',
  successToast: 'Заявка получена. Свяжемся в течение часа.',
  errorToast: 'Что-то пошло не так. Попробуйте ещё раз.',
  doneTitle: 'Заявка',
  doneTitleAccent: 'отправлена.',
  doneText: 'Хотите видеть результат в личном кабинете? Регистрация бесплатная.',
  register: 'Зарегистрироваться',
  sendAnother: 'Отправить ещё одну',
  eyebrow: 'Запрос на стратегию',
  heading: 'Аудит за',
  headingAccent: '48 часов',
  labelName: 'Имя',
  placeholderName: 'Как к вам обращаться',
  labelPhone: 'Телефон',
  labelEmail: 'Email',
  labelProject: 'О проекте',
  placeholderProject: 'Ниша, продукт, текущие цифры',
  consent: 'Отправляя форму, вы соглашаетесь на обработку данных.',
  submitLoading: 'Отправляем...',
  submit: 'Получить аудит',
};
const en: typeof ru = {
  validationError: 'Please fill in name, phone and email',
  successToast: 'Request received. We will get back within an hour.',
  errorToast: 'Something went wrong. Please try again.',
  doneTitle: 'Request',
  doneTitleAccent: 'sent.',
  doneText: 'Want to see results in your dashboard? Registration is free.',
  register: 'Sign up',
  sendAnother: 'Send another one',
  eyebrow: 'Strategy request',
  heading: 'Audit in',
  headingAccent: '48 hours',
  labelName: 'Name',
  placeholderName: 'How should we address you',
  labelPhone: 'Phone',
  labelEmail: 'Email',
  labelProject: 'About the project',
  placeholderProject: 'Niche, product, current numbers',
  consent: 'By submitting this form you agree to data processing.',
  submitLoading: 'Sending...',
  submit: 'Get an audit',
};
const tg: typeof ru = {
  validationError: 'Ном, телефон ва email-ро пур кунед',
  successToast: 'Дархост қабул шуд. Дар давоми як соат занг мезанем.',
  errorToast: 'Чизе нодуруст шуд. Боз кӯшиш кунед.',
  doneTitle: 'Дархост',
  doneTitleAccent: 'фиристода шуд.',
  doneText: 'Мехоҳед натиҷаро дар кабинети шахсӣ бинед? Бақайдгирӣ ройгон аст.',
  register: 'Бақайдгирӣ',
  sendAnother: 'Боз яке фиристодан',
  eyebrow: 'Дархост барои стратегия',
  heading: 'Аудит дар',
  headingAccent: '48 соат',
  labelName: 'Ном',
  placeholderName: 'Чӣ тавр ба шумо муроҷиат кунем',
  labelPhone: 'Телефон',
  labelEmail: 'Email',
  labelProject: 'Дар бораи лоиҳа',
  placeholderProject: 'Ниша, маҳсулот, рақамҳои ҳозира',
  consent: 'Бо фиристодани форма шумо ба коркарди маълумот розӣ мешавед.',
  submitLoading: 'Мефиристем...',
  submit: 'Гирифтани аудит',
};
const COPY: Record<Lang, typeof ru> = { ru, en, tg };

export function ContactForm() {
  const t = useCopy(COPY);
  const router = useRouter();
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const onChange = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.email) {
      toast.error(t.validationError);
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
      toast.success(t.successToast);
    } catch {
      toast.error(t.errorToast);
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
          {t.doneTitle} <span className="text-lime-grad">{t.doneTitleAccent}</span>
        </h3>
        <p className="mt-4 text-sm text-light/55">{t.doneText}</p>
        <div className="mt-8 flex flex-wrap gap-4">
          <button onClick={() => router.push('/auth/register')} className="btn-lime">
            {t.register}
          </button>
          <button onClick={() => setDone(false)} className="btn-ghost">
            {t.sendAnother}
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
        {t.eyebrow}
      </p>
      <h3 className="mt-4 font-display text-3xl font-extrabold leading-tight tracking-tight">
        {t.heading} <span className="text-lime-grad">{t.headingAccent}</span>
      </h3>
      <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label className="label-soft">{t.labelName}</label>
          <input
            className="input-glass"
            value={form.name}
            onChange={onChange('name')}
            placeholder={t.placeholderName}
          />
        </div>
        <div>
          <label className="label-soft">{t.labelPhone}</label>
          <input
            className="input-glass"
            value={form.phone}
            onChange={onChange('phone')}
            placeholder="+992 ___"
          />
        </div>
        <div className="md:col-span-2">
          <label className="label-soft">{t.labelEmail}</label>
          <input
            type="email"
            className="input-glass"
            value={form.email}
            onChange={onChange('email')}
            placeholder="you@business.com"
          />
        </div>
        <div className="md:col-span-2">
          <label className="label-soft">{t.labelProject}</label>
          <textarea
            className="input-glass min-h-[100px] resize-none"
            value={form.message}
            onChange={onChange('message')}
            placeholder={t.placeholderProject}
          />
        </div>
      </div>
      <div className="mt-10 flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
        <p className="text-[11px] text-light/40">{t.consent}</p>
        <button type="submit" disabled={loading} className="btn-lime w-full md:w-auto disabled:opacity-60">
          {loading ? t.submitLoading : t.submit}
        </button>
      </div>
    </motion.form>
  );
}
