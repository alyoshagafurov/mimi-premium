'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const STEPS = [
  { key: 'goals', label: 'Цели', q: 'Какие у вас цели на ближайшие 3 месяца?', placeholder: 'Например: вырастить продажи в 2 раза, выйти в новый регион...' },
  { key: 'targetAudience', label: 'ЦА', q: 'Кто ваша целевая аудитория?', placeholder: 'Возраст, пол, география, доход, поведение...' },
  { key: 'budget', label: 'Бюджет', q: 'Какой ежемесячный рекламный бюджет?', placeholder: 'В сомони', type: 'number' as const },
  { key: 'competitors', label: 'Конкуренты', q: 'Назовите 2-3 ключевых конкурентов', placeholder: 'Бренды, аккаунты, сайты...' },
  { key: 'usp', label: 'УТП', q: 'В чём ваше уникальное торговое предложение?', placeholder: 'Что отличает вас от конкурентов...' },
];

export function OnboardingWizard({ businessName }: { businessName: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const current = STEPS[step];

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else submit();
  };
  const back = () => setStep(Math.max(0, step - 1));

  const submit = async () => {
    setSaving(true);
    try {
      const r = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error('fail');
      toast.success('Спасибо! Мы свяжемся в течение дня.');
      router.push('/dashboard');
      router.refresh();
    } catch {
      toast.error('Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

  const value = data[current.key] ?? '';

  return (
    <main className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-2xl items-center justify-center px-4 py-10">
      <div className="w-full">
        <div className="mb-6 text-center">
          <p className="text-[10px] uppercase tracking-[0.32em] text-brand-orange">Бриф</p>
          <h1 className="mt-2 font-display text-2xl font-extrabold text-light sm:text-3xl">
            Добро пожаловать, <span className="text-lime-grad">{businessName}</span>
          </h1>
          <p className="mt-2 text-sm text-light/55">5 коротких вопросов — и команда сразу начнёт работу.</p>
        </div>

        <div className="mb-6 flex items-center gap-1">
          {STEPS.map((s, i) => (
            <div
              key={s.key}
              className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? 'bg-brand-lime' : 'bg-white/[0.08]'}`}
            />
          ))}
        </div>

        <div className="rounded-3xl border border-white/[0.06] bg-ink2/30 p-6 sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.key}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-[11px] uppercase tracking-[0.18em] text-brand-orange">
                Шаг {step + 1} / {STEPS.length} · {current.label}
              </p>
              <h2 className="mt-3 font-display text-xl font-bold leading-tight text-light sm:text-2xl">{current.q}</h2>
              {current.type === 'number' ? (
                <input
                  type="number"
                  className="input-glass mt-6"
                  placeholder={current.placeholder}
                  value={value}
                  onChange={(e) => setData({ ...data, [current.key]: e.target.value })}
                />
              ) : (
                <textarea
                  className="input-glass mt-6 min-h-[120px]"
                  placeholder={current.placeholder}
                  value={value}
                  onChange={(e) => setData({ ...data, [current.key]: e.target.value })}
                />
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={back}
              disabled={step === 0}
              className="text-[12px] uppercase tracking-[0.18em] text-light/55 hover:text-brand-lime disabled:opacity-30"
            >
              ← Назад
            </button>
            <button onClick={next} disabled={saving} className="btn-lime disabled:opacity-60">
              {step === STEPS.length - 1 ? (saving ? 'Отправляем...' : 'Завершить') : 'Дальше →'}
            </button>
          </div>
        </div>

        <button
          onClick={submit}
          className="mx-auto mt-4 block text-[11px] uppercase tracking-[0.18em] text-light/40 hover:text-brand-lime"
        >
          Пропустить и заполнить позже
        </button>
      </div>
    </main>
  );
}
