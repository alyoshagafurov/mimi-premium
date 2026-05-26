'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { TopNav } from '@/components/ui/TopNav';
import { formatMoney, tariffLabel, tariffPrice, tariffRecurring } from '@/lib/utils';

const PLAN_DESC: Record<string, string> = {
  START: 'Таргет, до 8 креативов, 4 Reels, понятная отчётность',
  GROWTH: 'Аналитика, до 15 креативов, брендинг, воронка, аудит',
  PREMIUM: 'Стратегия, полный брендинг, 8–10 Reels, веб-страница, масштабирование',
};

export function CheckoutClient({ plan }: { plan: string }) {
  const router = useRouter();
  const [card, setCard] = useState({ number: '', name: '', exp: '', cvc: '' });
  const [loading, setLoading] = useState(false);

  const price = tariffPrice(plan);
  const recurring = tariffRecurring(plan);
  const label = tariffLabel(plan);

  const pay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!card.number || !card.name || !card.exp || !card.cvc) {
      toast.error('Заполните все поля карты');
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
      toast.success(`Тариф «${label}» активирован`);
      router.push('/dashboard');
      router.refresh();
    } catch {
      toast.error('Не удалось активировать тариф');
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
        {/* SUMMARY */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="glass-lime rounded-3xl p-8"
        >
          <span className="chip text-brand-lime/80">Оформление</span>
          <h1 className="mt-3 font-display text-3xl font-extrabold md:text-4xl">
            Тариф «<span className="text-lime-grad">{label}</span>»
          </h1>
          <p className="mt-3 text-sm text-muted">{PLAN_DESC[plan] ?? '—'}</p>

          <div className="mt-8 space-y-3 border-t border-white/10 pt-6">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Первый месяц</span>
              <span className="font-medium text-light">{formatMoney(price)}</span>
            </div>
            {recurring !== price && (
              <div className="flex justify-between text-sm">
                <span className="text-muted">Со второго месяца</span>
                <span className="font-medium text-light">{formatMoney(recurring)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted">Активация</span>
              <span className="text-brand-lime">Бесплатно</span>
            </div>
            <div className="flex items-end justify-between border-t border-white/10 pt-4">
              <span className="text-xs uppercase tracking-[0.2em] text-muted">К оплате сегодня</span>
              <span className="font-display text-3xl font-extrabold text-lime-grad">{formatMoney(price)}</span>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-xs text-muted">
            Это демо-оплата. Реальное списание не происходит — мы просто активируем тариф и пускаем вас в кабинет.
          </div>

          <Link href="/pricing" className="mt-6 inline-block text-xs uppercase tracking-[0.2em] text-muted transition hover:text-brand-lime">
            ← Сменить тариф
          </Link>
        </motion.div>

        {/* CARD FORM */}
        <motion.form
          onSubmit={pay}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="glass rounded-3xl p-8"
        >
          <h2 className="font-display text-xl font-bold">Платёжные реквизиты</h2>
          <p className="mt-1 text-xs text-muted">Все поля защищены TLS (демо)</p>

          {/* Fake card preview */}
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
              <label className="label-soft">Номер карты</label>
              <input
                className="input-glass tracking-[0.18em]"
                value={card.number}
                onChange={(e) => setCard({ ...card, number: fmtCard(e.target.value) })}
                placeholder="1234 5678 9012 3456"
                inputMode="numeric"
              />
            </div>
            <div>
              <label className="label-soft">Имя владельца</label>
              <input
                className="input-glass uppercase"
                value={card.name}
                onChange={(e) => setCard({ ...card, name: e.target.value.toUpperCase().slice(0, 30) })}
                placeholder="IVAN IVANOV"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-soft">Срок</label>
                <input
                  className="input-glass"
                  value={card.exp}
                  onChange={(e) => setCard({ ...card, exp: fmtExp(e.target.value) })}
                  placeholder="MM/YY"
                  inputMode="numeric"
                />
              </div>
              <div>
                <label className="label-soft">CVC</label>
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
              {loading ? 'Активируем...' : `Оплатить ${formatMoney(price)}`}
            </button>
          </div>
        </motion.form>
      </main>
    </div>
  );
}
