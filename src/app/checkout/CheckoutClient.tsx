'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { TopNav } from '@/components/ui/TopNav';
import { formatMoney, tariffLabel, tariffPrice, tariffRecurring } from '@/lib/utils';
import { useCopy } from '@/i18n/LanguageProvider';
import type { Lang } from '@/i18n/config';

const PLAN_DESC_RU: Record<string, string> = {
  START: 'Таргет + аналитика, отчёты в Excel, до 8 креативов, 4 продающих Reels',
  GROWTH: 'Стратегия + анализ конкурентов, до 10 креативов, 5 Reels, брендинг + мерч, воронка, консультации продаж',
  PREMIUM: 'Стратегия + рост-план, брендинг, глубокая аналитика, до 15 креативов, 8–10 Reels, сайт в подарок, сопровождение',
};
const PLAN_DESC_EN: Record<string, string> = {
  START: 'Targeting + analytics, Excel reports, up to 8 creatives, 4 selling Reels',
  GROWTH: 'Strategy + competitor analysis, up to 10 creatives, 5 Reels, branding + merch, funnel, sales consulting',
  PREMIUM: 'Strategy + growth plan, branding, deep analytics, up to 15 creatives, 8–10 Reels, website gift, ongoing support',
};
const PLAN_DESC_TG: Record<string, string> = {
  START: 'Таргет + аналитика, ҳисобот дар Excel, то 8 креатив, 4 Reels-и фурӯшанда',
  GROWTH: 'Стратегия + таҳлили рақибон, то 10 креатив, 5 Reels, брендинг + мерч, воронка, маслиҳати фурӯш',
  PREMIUM: 'Стратегия + рост-план, брендинг, аналитикаи амиқ, то 15 креатив, 8–10 Reels, сайт тӯҳфа, ҳамроҳӣ',
};

const ru = {
  chip: 'Оформление',
  tariff: 'Тариф',
  firstMonth: 'Первый месяц',
  fromSecond: 'Со второго месяца',
  activation: 'Активация',
  free: 'Бесплатно',
  totalToday: 'К оплате сегодня',
  demoNote: 'Это демо-оплата. Реальное списание не происходит — мы просто активируем тариф и пускаем вас в кабинет.',
  changePlan: '← Сменить тариф',
  payTitle: 'Платёжные реквизиты',
  paySubtitle: 'Все поля защищены TLS (демо)',
  labelCardNumber: 'Номер карты',
  labelCardHolder: 'Имя владельца',
  labelExpiry: 'Срок',
  labelCvc: 'CVC',
  submitLoading: 'Активируем...',
  submitPay: 'Оплатить',
  errFields: 'Заполните все поля карты',
  successTpl: 'Тариф активирован',
  errActivate: 'Не удалось активировать тариф',
  descs: PLAN_DESC_RU,
};
const en: typeof ru = {
  chip: 'Checkout',
  tariff: 'Plan',
  firstMonth: 'First month',
  fromSecond: 'From second month',
  activation: 'Activation',
  free: 'Free',
  totalToday: 'Due today',
  demoNote: 'This is a demo payment. No real charge — we just activate the plan and give you dashboard access.',
  changePlan: '← Change plan',
  payTitle: 'Payment details',
  paySubtitle: 'All fields are TLS-protected (demo)',
  labelCardNumber: 'Card number',
  labelCardHolder: 'Cardholder name',
  labelExpiry: 'Expiry',
  labelCvc: 'CVC',
  submitLoading: 'Activating...',
  submitPay: 'Pay',
  errFields: 'Please fill in all card fields',
  successTpl: 'Plan activated',
  errActivate: 'Failed to activate plan',
  descs: PLAN_DESC_EN,
};
const tg: typeof ru = {
  chip: 'Расмиятсозӣ',
  tariff: 'Тариф',
  firstMonth: 'Моҳи аввал',
  fromSecond: 'Аз моҳи дуюм',
  activation: 'Фаъолсозӣ',
  free: 'Ройгон',
  totalToday: 'Барои пардохт имрӯз',
  demoNote: 'Ин пардохти демо аст. Пул гирифта намешавад — мо танҳо тарифро фаъол мекунем ва шуморо ба кабинет роҳ медиҳем.',
  changePlan: '← Иваз кардани тариф',
  payTitle: 'Реквизитҳои пардохт',
  paySubtitle: 'Ҳамаи майдонҳо бо TLS ҳифз шудаанд (демо)',
  labelCardNumber: 'Рақами корт',
  labelCardHolder: 'Номи соҳиб',
  labelExpiry: 'Мӯҳлат',
  labelCvc: 'CVC',
  submitLoading: 'Фаъол мекунем...',
  submitPay: 'Пардохт кардан',
  errFields: 'Ҳамаи майдонҳои кортро пур кунед',
  successTpl: 'Тариф фаъол шуд',
  errActivate: 'Фаъолсозии тариф нашуд',
  descs: PLAN_DESC_TG,
};
const COPY: Record<Lang, typeof ru> = { ru, en, tg };

export function CheckoutClient({ plan }: { plan: string }) {
  const t = useCopy(COPY);
  const router = useRouter();
  const [card, setCard] = useState({ number: '', name: '', exp: '', cvc: '' });
  const [loading, setLoading] = useState(false);

  const price = tariffPrice(plan);
  const recurring = tariffRecurring(plan);
  const label = tariffLabel(plan);

  const pay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!card.number || !card.name || !card.exp || !card.cvc) {
      toast.error(t.errFields);
      return;
    }
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1500));
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      if (!res.ok) throw new Error('failed');
      toast.success(`${t.successTpl} «${label}»`);
      router.push('/dashboard');
      router.refresh();
    } catch {
      toast.error(t.errActivate);
    } finally {
      setLoading(false);
    }
  };

  const fmtCard = (v: string) =>
    v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const fmtExp = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 4);
    return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  };

  return (
    <div className="relative min-h-screen">
      <TopNav />
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[60vh] w-[80vw] -translate-x-1/2 rounded-full bg-brand-purple/15 blur-3xl" />
      </div>
      <main className="relative z-10 mx-auto grid max-w-5xl gap-8 px-5 pb-16 pt-32 lg:grid-cols-[1.1fr_1fr]">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="glass-lime rounded-3xl p-8"
        >
          <span className="chip text-brand-lime/80">{t.chip}</span>
          <h1 className="mt-3 font-display text-3xl font-extrabold md:text-4xl">
            {t.tariff} «<span className="text-lime-grad">{label}</span>»
          </h1>
          <p className="mt-3 text-sm text-muted">{t.descs[plan] ?? '—'}</p>

          <div className="mt-8 space-y-3 border-t border-white/10 pt-6">
            <div className="flex justify-between text-sm">
              <span className="text-muted">{t.firstMonth}</span>
              <span className="font-medium text-light">{formatMoney(price)}</span>
            </div>
            {recurring !== price && (
              <div className="flex justify-between text-sm">
                <span className="text-muted">{t.fromSecond}</span>
                <span className="font-medium text-light">{formatMoney(recurring)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted">{t.activation}</span>
              <span className="text-brand-lime">{t.free}</span>
            </div>
            <div className="flex items-end justify-between border-t border-white/10 pt-4">
              <span className="text-xs uppercase tracking-[0.2em] text-muted">{t.totalToday}</span>
              <span className="font-display text-3xl font-extrabold text-lime-grad">{formatMoney(price)}</span>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-xs text-muted">
            {t.demoNote}
          </div>

          <Link href="/pricing" className="mt-6 inline-block text-xs uppercase tracking-[0.2em] text-muted transition hover:text-brand-lime">
            {t.changePlan}
          </Link>
        </motion.div>

        <motion.form
          onSubmit={pay}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="glass rounded-3xl p-8"
        >
          <h2 className="font-display text-xl font-bold">{t.payTitle}</h2>
          <p className="mt-1 text-xs text-muted">{t.paySubtitle}</p>

          <div className="relative mt-6 overflow-hidden rounded-2xl bg-purple-gradient p-6 shadow-purple">
            <div className="absolute inset-0 bg-brand-lime/5 backdrop-blur-sm" />
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.3em] text-brand-lime/80">mimi.card</span>
                <span className="font-display text-lg font-bold text-lime-grad">VISA</span>
              </div>
              <div className="mt-8 font-mono text-lg tracking-[0.18em] text-light">
                {card.number || '•••• •••• •••• ••••'}
              </div>
              <div className="mt-4 flex justify-between text-[11px] uppercase text-muted">
                <div>
                  <div className="opacity-60">Cardholder</div>
                  <div className="text-light">{card.name || 'YOUR NAME'}</div>
                </div>
                <div>
                  <div className="opacity-60">Exp</div>
                  <div className="text-light">{card.exp || 'MM/YY'}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label className="label-soft">{t.labelCardNumber}</label>
              <input
                className="input-glass tracking-[0.18em]"
                value={card.number}
                onChange={(e) => setCard({ ...card, number: fmtCard(e.target.value) })}
                placeholder="1234 5678 9012 3456"
                inputMode="numeric"
              />
            </div>
            <div>
              <label className="label-soft">{t.labelCardHolder}</label>
              <input
                className="input-glass uppercase"
                value={card.name}
                onChange={(e) => setCard({ ...card, name: e.target.value.toUpperCase().slice(0, 30) })}
                placeholder="IVAN IVANOV"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-soft">{t.labelExpiry}</label>
                <input
                  className="input-glass"
                  value={card.exp}
                  onChange={(e) => setCard({ ...card, exp: fmtExp(e.target.value) })}
                  placeholder="MM/YY"
                  inputMode="numeric"
                />
              </div>
              <div>
                <label className="label-soft">{t.labelCvc}</label>
                <input
                  type="password"
                  className="input-glass"
                  value={card.cvc}
                  onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                  placeholder="•••"
                  inputMode="numeric"
                />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-lime mt-3 w-full disabled:opacity-60">
              {loading ? t.submitLoading : `${t.submitPay} ${formatMoney(price)}`}
            </button>
          </div>
        </motion.form>
      </main>
    </div>
  );
}
