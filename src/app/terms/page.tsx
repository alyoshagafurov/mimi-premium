'use client';

import { TopNav } from '@/components/ui/TopNav';
import { Footer } from '@/components/ui/Footer';
import { useCopy } from '@/i18n/LanguageProvider';
import type { Lang } from '@/i18n/config';

type Section = { h: string; p: string[] };
type Copy = { updated: string; title: string; intro: string; sections: Section[] };

const CONTACT_EMAIL = process.env.NEXT_PUBLIC_BRAND_EMAIL ?? 'hello@mimi.agency.tj';

const ru: Copy = {
  updated: 'Обновлено: июль 2026',
  title: 'Публичная оферта',
  intro: 'Настоящая оферта определяет условия оказания маркетинговых услуг агентством mimi и использования сайта и личного кабинета.',
  sections: [
    { h: '1. Предмет', p: ['Агентство оказывает маркетинговые услуги (реклама, стратегия, брендинг, дизайн, разработка и др.) на основании выбранного тарифа или отдельного соглашения.'] },
    { h: '2. Тарифы и оплата', p: ['Стоимость услуг определяется тарифом на странице «Тарифы» или индивидуальным предложением. Оплата производится ежемесячно, если иное не согласовано.'] },
    { h: '3. Обязанности сторон', p: ['Агентство обязуется оказывать услуги качественно и прозрачно, предоставлять отчётность в личном кабинете. Клиент обязуется предоставлять необходимые материалы и доступы, а также своевременно оплачивать услуги.'] },
    { h: '4. Результаты и гарантии', p: ['Мы гарантируем прозрачность и системную работу, но не гарантируем конкретных финансовых показателей, так как результат зависит от многих факторов, включая продукт и рынок клиента.'] },
    { h: '5. Конфиденциальность', p: ['Стороны обязуются не разглашать конфиденциальную информацию, полученную в ходе сотрудничества. Обработка персональных данных регулируется Политикой конфиденциальности.'] },
    { h: '6. Контакты', p: ['По вопросам сотрудничества: ' + CONTACT_EMAIL + '.'] },
  ],
};
const en: Copy = {
  updated: 'Updated: July 2026',
  title: 'Terms of Service',
  intro: 'These terms define the conditions for marketing services provided by the mimi agency and the use of the website and dashboard.',
  sections: [
    { h: '1. Subject', p: ['The agency provides marketing services (advertising, strategy, branding, design, development, etc.) based on the selected plan or a separate agreement.'] },
    { h: '2. Plans & payment', p: ['Service cost is defined by the plan on the “Pricing” page or an individual offer. Payment is monthly unless agreed otherwise.'] },
    { h: '3. Obligations', p: ['The agency undertakes to provide services professionally and transparently, with reporting in the dashboard. The client undertakes to provide the necessary materials and access and to pay on time.'] },
    { h: '4. Results & guarantees', p: ['We guarantee transparency and systematic work, but do not guarantee specific financial figures, as results depend on many factors including the client’s product and market.'] },
    { h: '5. Confidentiality', p: ['The parties agree not to disclose confidential information obtained during cooperation. Processing of personal data is governed by the Privacy Policy.'] },
    { h: '6. Contact', p: ['For cooperation questions: ' + CONTACT_EMAIL + '.'] },
  ],
};
const tg: Copy = {
  updated: 'Навсозӣ: июли 2026',
  title: 'Оферти оммавӣ',
  intro: 'Ин оферта шартҳои расонидани хидматҳои маркетингии агентии mimi ва истифодаи сомона ва кабинети шахсиро муайян мекунад.',
  sections: [
    { h: '1. Мавзӯъ', p: ['Агентӣ хидматҳои маркетингӣ (реклама, стратегия, брендинг, дизайн, таҳия ва ғ.)-ро дар асоси тарифи интихобшуда ё созишномаи алоҳида мерасонад.'] },
    { h: '2. Тарифҳо ва пардохт', p: ['Арзиши хидматҳо тавассути тариф дар саҳифаи «Тарифҳо» ё пешниҳоди инфиродӣ муайян мешавад. Пардохт ҳармоҳа аст, агар тартиби дигар мувофиқа нашуда бошад.'] },
    { h: '3. Уҳдадориҳо', p: ['Агентӣ уҳдадор аст, ки хидматҳоро босифат ва шаффоф расонад ва ҳисоботро дар кабинет пешниҳод кунад. Муштарӣ уҳдадор аст, ки маводу дастрасии зарурӣ диҳад ва саривақт пардохт кунад.'] },
    { h: '4. Натиҷаҳо ва кафолатҳо', p: ['Мо шаффофият ва кори системавиро кафолат медиҳем, аммо нишондиҳандаҳои мушаххаси молиявиро кафолат намедиҳем, зеро натиҷа ба омилҳои зиёд, аз ҷумла маҳсулот ва бозори муштарӣ вобаста аст.'] },
    { h: '5. Махфият', p: ['Тарафҳо уҳдадоранд, ки маълумоти махфиро ошкор накунанд. Коркарди маълумоти шахсӣ тавассути Сиёсати махфият танзим мешавад.'] },
    { h: '6. Тамос', p: ['Оид ба ҳамкорӣ: ' + CONTACT_EMAIL + '.'] },
  ],
};
const COPY: Record<Lang, Copy> = { ru, en, tg };

export default function TermsPage() {
  const t = useCopy(COPY);
  return (
    <div className="relative min-h-screen">
      <TopNav />
      <main className="relative z-10 mx-auto max-w-3xl px-5 pb-24 pt-32">
        <p className="text-[10px] uppercase tracking-[0.32em] text-brand-orange">{t.updated}</p>
        <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight md:text-5xl">{t.title}</h1>
        <p className="mt-6 text-base leading-relaxed text-light/70">{t.intro}</p>
        <div className="mt-10 space-y-8">
          {t.sections.map((s) => (
            <section key={s.h}>
              <h2 className="font-display text-lg font-bold text-brand-lime">{s.h}</h2>
              <div className="mt-3 space-y-2">
                {s.p.map((para, i) => (
                  <p key={i} className="text-sm leading-relaxed text-light/60">{para}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
