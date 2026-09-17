'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useCopy } from '@/i18n/LanguageProvider';
import type { Lang } from '@/i18n/config';
import { cn } from '@/lib/utils';

const ru = {
  words: ['Плохо', 'Слабо', 'Нормально', 'Хорошо', 'Отлично'],
  pick: 'Нажмите на звезду',
  starLabel: (n: number) => `${n} из 5`,
  group: 'Ваша оценка',
  name: 'Ваше имя',
  company: 'Компания или проект',
  optional: 'необязательно',
  text: 'Отзыв',
  textPh: 'Что было до работы с нами, что изменилось, что понравилось или нет',
  send: 'Отправить отзыв',
  sending: 'Отправляем…',
  errName: 'Укажите имя',
  errText: 'Напишите хотя бы пару предложений',
  errNet: 'Не получилось отправить. Проверьте интернет и попробуйте ещё раз.',
  thanks: (name: string) => `Спасибо, ${name}!`,
  pending: 'на проверке',
  thanksText: 'Отзыв получен. Он появится на этой странице, как только мы его проверим.',
};
const en: typeof ru = {
  words: ['Poor', 'Weak', 'Okay', 'Good', 'Excellent'],
  pick: 'Tap a star',
  starLabel: (n) => `${n} of 5`,
  group: 'Your rating',
  name: 'Your name',
  company: 'Company or project',
  optional: 'optional',
  text: 'Review',
  textPh: 'What it was like before, what changed, what you liked or didn’t',
  send: 'Send review',
  sending: 'Sending…',
  errName: 'Please enter your name',
  errText: 'Please write at least a couple of sentences',
  errNet: 'Could not send. Check your connection and try again.',
  thanks: (name) => `Thank you, ${name}!`,
  pending: 'in review',
  thanksText: 'We got your review. It will appear on this page once we have checked it.',
};
const tg: typeof ru = {
  words: ['Бад', 'Суст', 'Миёна', 'Хуб', 'Аъло'],
  pick: 'Ситораро пахш кунед',
  starLabel: (n) => `${n} аз 5`,
  group: 'Баҳои шумо',
  name: 'Номи шумо',
  company: 'Ширкат ё лоиҳа',
  optional: 'ихтиёрӣ',
  text: 'Фикру мулоҳиза',
  textPh: 'Пеш аз кор бо мо чӣ буд, чӣ тағйир ёфт, чӣ писанд омад ё не',
  send: 'Фиристодан',
  sending: 'Мефиристем…',
  errName: 'Номатонро нависед',
  errText: 'Ақаллан ду ҷумла нависед',
  errNet: 'Фиристода нашуд. Интернетро санҷед ва боз кӯшиш кунед.',
  thanks: (name) => `Ташаккур, ${name}!`,
  pending: 'дар санҷиш',
  thanksText: 'Фикри шумо қабул шуд. Пас аз санҷиш дар ҳамин саҳифа пайдо мешавад.',
};
const COPY: Record<Lang, typeof ru> = { ru, en, tg };

const STAR = 'M12 2.8l2.76 5.6 6.18.9-4.47 4.36 1.05 6.15L12 16.9l-5.52 2.9 1.05-6.15L3.06 9.3l6.18-.9L12 2.8z';

export function StarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path d={STAR} fill="currentColor" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

export function RateForm() {
  const t = useCopy(COPY);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [form, setForm] = useState({ name: '', company: '', text: '', website: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState('');
  const stars = useRef<(HTMLButtonElement | null)[]>([]);
  const shown = hover || rating;
  const done = status === 'done';

  const choose = (n: number, focus = false) => {
    if (done) return;
    setRating(n);
    if (focus) stars.current[n - 1]?.focus();
  };

  const onKey = (e: React.KeyboardEvent) => {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    choose(Math.min(5, Math.max(1, (rating || 0) + step)), true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.name.trim().length < 2) return setError(t.errName);
    if (form.text.trim().length < 10) return setError(t.errText);
    setError('');
    setStatus('sending');
    try {
      const r = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, rating }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setStatus('idle');
        return setError(d.error || t.errNet);
      }
      setStatus('done');
    } catch {
      setStatus('idle');
      setError(t.errNet);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div
        role="radiogroup"
        aria-label={t.group}
        onKeyDown={onKey}
        onMouseLeave={() => setHover(0)}
        className="flex items-center gap-1 sm:gap-2"
      >
        {[1, 2, 3, 4, 5].map((n) => {
          const on = n <= shown;
          return (
            <button
              key={n}
              ref={(el) => { stars.current[n - 1] = el; }}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={t.starLabel(n)}
              tabIndex={rating ? (rating === n ? 0 : -1) : n === 1 ? 0 : -1}
              disabled={done}
              onMouseEnter={() => !done && setHover(n)}
              onClick={() => choose(n)}
              style={{ transitionDelay: on ? `${(n - 1) * 35}ms` : '0ms' }}
              className={cn(
                'rounded-full p-1 outline-none transition-[color,transform] duration-300 ease-out focus-visible:ring-2 focus-visible:ring-brand-lime/70 disabled:cursor-default',
                on ? 'scale-100 text-brand-lime' : 'scale-90 text-light/15 hover:text-light/30',
              )}
            >
              <StarIcon className="h-11 w-11 sm:h-16 sm:w-16" />
            </button>
          );
        })}
      </div>
      <p aria-live="polite" className={cn('mt-3 h-7 font-serif text-xl italic', shown ? 'text-brand-lime' : 'text-light/55')}>
        {shown ? t.words[shown - 1] : t.pick}
      </p>

      {rating > 0 && !done && (
        <motion.form
          onSubmit={submit}
          noValidate
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="relative mt-8 w-full max-w-xl space-y-4 text-left"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="rv-name" className="label-soft">{t.name}</label>
              <input
                id="rv-name"
                autoComplete="name"
                maxLength={80}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="input-glass"
              />
            </div>
            <div>
              <label htmlFor="rv-company" className="label-soft">
                {t.company} <span className="normal-case tracking-normal opacity-70">· {t.optional}</span>
              </label>
              <input
                id="rv-company"
                autoComplete="organization"
                maxLength={80}
                value={form.company}
                onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                className="input-glass"
              />
            </div>
          </div>
          <div>
            <label htmlFor="rv-text" className="label-soft">{t.text}</label>
            <textarea
              id="rv-text"
              rows={5}
              maxLength={1500}
              placeholder={t.textPh}
              value={form.text}
              onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
              className="input-glass min-h-[132px] resize-y"
            />
          </div>
          {/* honeypot: скрыт от людей, ботов отсекает сервер */}
          <input
            tabIndex={-1}
            autoComplete="off"
            aria-hidden
            value={form.website}
            onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
            className="absolute -left-[9999px] h-0 w-0 opacity-0"
          />
          <div className="flex flex-col-reverse items-stretch gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
            <p role="alert" className="min-h-[1.25rem] text-sm text-brand-orange">{error}</p>
            <button type="submit" disabled={status === 'sending'} className="btn-lime disabled:opacity-60">
              {status === 'sending' ? t.sending : t.send}
            </button>
          </div>
        </motion.form>
      )}

      {done && (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 w-full max-w-xl rounded-3xl border border-white/[0.08] bg-ink2/70 p-7 text-center"
        >
          <span className="inline-flex items-center rounded-full border border-brand-orange/40 bg-brand-orange/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-brand-orange">
            {t.pending}
          </span>
          <p className="mt-4 font-display text-2xl font-extrabold tracking-tight text-light">{t.thanks(form.name.trim())}</p>
          <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-light/65">{t.thanksText}</p>
        </motion.div>
      )}
    </div>
  );
}
