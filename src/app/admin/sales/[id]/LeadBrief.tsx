import { BRIEF_QUESTIONS, cn, type BriefKey } from '@/lib/utils';

export type Brief = {
  done: boolean;
  /** Лид пришёл не через регистрацию (завёл продажник или заявка с сайта) — анкеты нет. */
  manual: boolean;
  answers: Record<BriefKey, string | number | null>;
};

const hasValue = (v: string | number | null) => (typeof v === 'number' ? v > 0 : !!v?.trim());

/**
 * «Анкета клиента» — пять ответов, которые клиент дал сразу после регистрации.
 * Цели идут первыми и во всю ширину: с них начинается любой разговор о продаже.
 */
export function LeadBrief({ brief }: { brief: Brief }) {
  const answered = BRIEF_QUESTIONS.filter((q) => hasValue(brief.answers[q.key])).length;

  if (!brief.done || answered === 0) {
    const text = brief.manual
      ? 'Лид пришёл не через регистрацию, поэтому анкеты нет. Её заполняет клиент, когда сам регистрируется на сайте.'
      : brief.done
        ? 'Клиент пропустил анкету при регистрации. Задайте эти 5 вопросов на первом звонке.'
        : 'Клиент зарегистрировался, но ещё не ответил на 5 вопросов. Ответы появятся здесь сами.';
    return (
      <section className="flex flex-col gap-2 rounded-3xl border border-dashed border-white/10 px-6 py-5 sm:flex-row sm:items-center sm:gap-5">
        <p className="shrink-0 text-[10px] uppercase tracking-[0.24em] text-brand-orange">Анкета клиента</p>
        <p className="text-sm text-light/55">{text}</p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-brand-lime/15 bg-brand-lime/[0.025] p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-brand-orange">Анкета клиента</p>
          <h2 className="mt-2 font-display text-xl font-extrabold tracking-tight text-light sm:text-2xl">
            Что клиент рассказал о себе
          </h2>
        </div>
        <span className="rounded-full border border-brand-lime/30 px-3 py-1 font-mono text-[11px] text-brand-lime">
          {answered} из {BRIEF_QUESTIONS.length} ответов
        </span>
      </div>

      <ol className="grid gap-3 md:grid-cols-2">
        {BRIEF_QUESTIONS.map((q, i) => {
          const value = brief.answers[q.key];
          const filled = hasValue(value);
          return (
            <li
              key={q.key}
              className={cn(
                'rounded-2xl border border-white/[0.06] bg-ink/40 p-4 sm:p-5',
                q.key === 'goals' && 'md:col-span-2',
              )}
            >
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-[11px] text-brand-lime">{String(i + 1).padStart(2, '0')}</span>
                <span className="text-[12px] leading-snug text-light/50">{q.q}</span>
              </div>
              {!filled ? (
                <p className="mt-2 pl-8 text-sm italic text-light/30">Без ответа</p>
              ) : q.key === 'budget' ? (
                <p className="mt-2 pl-8">
                  <span className="font-display text-2xl font-extrabold tabular-nums text-brand-lime">
                    {Number(value).toLocaleString('ru-RU')}
                  </span>
                  <span className="ml-2 text-sm text-light/60">сомони в месяц на рекламу</span>
                </p>
              ) : (
                <p className={cn('mt-2 whitespace-pre-wrap pl-8 leading-relaxed text-light', q.key === 'goals' ? 'text-base' : 'text-[15px]')}>
                  {String(value)}
                </p>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
