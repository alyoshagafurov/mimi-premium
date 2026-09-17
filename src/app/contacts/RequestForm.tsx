'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useCopy } from '@/i18n/LanguageProvider';
import type { Lang } from '@/i18n/config';
import { BRAND } from '@/lib/seo';
import { ChatIcon } from './icons';

const ru = {
  name: 'Как к вам обращаться',
  phone: 'Телефон',
  task: 'Что нужно сделать',
  optional: 'необязательно',
  taskPh: 'Например: запустить рекламу для клиники или снять контент на месяц',
  send: 'Отправить заявку',
  sending: 'Отправляем…',
  consent: 'Нажимая кнопку, вы соглашаетесь на обработку данных.',
  errName: 'Напишите, как к вам обращаться',
  errPhone: 'Укажите телефон, чтобы мы могли перезвонить',
  errNet: 'Не получилось отправить. Проверьте интернет или напишите нам в WhatsApp.',
  doneTitle: 'Заявка у нас.',
  doneText: (phone: string) => `Перезвоним по номеру ${phone}. Если удобнее переписка — напишите в WhatsApp, не дожидаясь звонка.`,
  doneWa: 'Написать в WhatsApp',
  again: 'Отправить ещё одну',
};
const en: typeof ru = {
  name: 'Your name',
  phone: 'Phone',
  task: 'What do you need',
  optional: 'optional',
  taskPh: 'For example: launch ads for a clinic or shoot a month of content',
  send: 'Send request',
  sending: 'Sending…',
  consent: 'By sending, you agree to the processing of your data.',
  errName: 'Please tell us your name',
  errPhone: 'Please add a phone number so we can call back',
  errNet: 'Could not send. Check your connection or message us on WhatsApp.',
  doneTitle: 'Request received.',
  doneText: (phone) => `We will call ${phone}. Prefer chatting? Message us on WhatsApp right away.`,
  doneWa: 'Message on WhatsApp',
  again: 'Send another',
};
const tg: typeof ru = {
  name: 'Ба шумо чӣ тавр муроҷиат кунем',
  phone: 'Телефон',
  task: 'Чӣ бояд кард',
  optional: 'ихтиёрӣ',
  taskPh: 'Масалан: оғози реклама барои клиника ё контент барои як моҳ',
  send: 'Фиристодани дархост',
  sending: 'Мефиристем…',
  consent: 'Бо пахш кардани тугма шумо ба коркарди маълумот розӣ мешавед.',
  errName: 'Номатонро нависед',
  errPhone: 'Телефонро нависед, то мо занг занем',
  errNet: 'Фиристода нашуд. Интернетро санҷед ё ба WhatsApp нависед.',
  doneTitle: 'Дархост қабул шуд.',
  doneText: (phone) => `Ба рақами ${phone} занг мезанем. Агар навиштан қулайтар бошад — ба WhatsApp нависед.`,
  doneWa: 'Навиштан дар WhatsApp',
  again: 'Боз як дархост',
};
const COPY: Record<Lang, typeof ru> = { ru, en, tg };

const EMPTY = { name: '', phone: '', message: '', website: '' };

export function RequestForm() {
  const t = useCopy(COPY);
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState('');

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.name.trim().length < 2) return setError(t.errName);
    if (form.phone.replace(/\D/g, '').length < 5) return setError(t.errPhone);
    setError('');
    setStatus('sending');
    try {
      const r = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, source: 'contacts' }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setStatus('idle');
        return setError(r.status === 429 && d.error ? d.error : t.errNet);
      }
      setStatus('done');
    } catch {
      setStatus('idle');
      setError(t.errNet);
    }
  };

  if (status === 'done') {
    return (
      <motion.div
        role="status"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-[28px] border border-brand-orange/30 bg-ink2/70 p-8 sm:p-10"
      >
        <p className="font-display text-4xl font-extrabold tracking-tight text-light">{t.doneTitle}</p>
        <p className="mt-4 max-w-[46ch] text-[15px] leading-relaxed text-light/70">{t.doneText(form.phone.trim())}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href={BRAND.whatsapp} target="_blank" rel="noreferrer" className="btn-lime">
            <ChatIcon className="h-4 w-4" /> {t.doneWa}
          </a>
          <button type="button" onClick={() => { setForm(EMPTY); setStatus('idle'); }} className="btn-ghost">
            {t.again}
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="relative rounded-[28px] border border-white/[0.07] bg-ink2/60 p-6 sm:p-9">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="rq-name" className="label-soft">{t.name}</label>
          <input id="rq-name" autoComplete="name" maxLength={120} value={form.name} onChange={set('name')} className="input-glass" />
        </div>
        <div>
          <label htmlFor="rq-phone" className="label-soft">{t.phone}</label>
          <input
            id="rq-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={40}
            placeholder="+992"
            value={form.phone}
            onChange={set('phone')}
            className="input-glass tabular-nums"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="rq-task" className="label-soft">
            {t.task} <span className="normal-case tracking-normal opacity-70">· {t.optional}</span>
          </label>
          <textarea id="rq-task" rows={4} maxLength={2000} placeholder={t.taskPh} value={form.message} onChange={set('message')} className="input-glass min-h-[112px] resize-y" />
        </div>
      </div>
      {/* honeypot: скрыт от людей, ботов отсекает сервер */}
      <input
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        value={form.website}
        onChange={set('website')}
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />
      <p role="alert" className="mt-4 min-h-[1.25rem] text-sm text-brand-orange">{error}</p>
      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-[34ch] text-[12px] leading-relaxed text-light/55">{t.consent}</p>
        <button
          type="submit"
          disabled={status === 'sending'}
          className="inline-flex items-center justify-center rounded-full bg-brand-orange px-8 py-3.5 font-display text-[13px] font-bold uppercase tracking-[0.16em] text-[#0A0712] shadow-[0_12px_30px_-12px_rgba(252,150,3,0.7)] transition-transform duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink disabled:opacity-60"
        >
          {status === 'sending' ? t.sending : t.send}
        </button>
      </div>
    </form>
  );
}
