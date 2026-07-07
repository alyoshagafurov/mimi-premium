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
  title: 'Политика конфиденциальности',
  intro: 'Настоящая Политика описывает, как маркетинговое агентство mimi («мы») собирает, использует и защищает персональные данные пользователей сайта и личного кабинета.',
  sections: [
    { h: '1. Какие данные мы собираем', p: ['Имя, телефон, email — при отправке заявки или регистрации.', 'Название бизнеса и ниша — для клиентов агентства.', 'Технические данные: cookie, IP-адрес, тип устройства — для работы сайта и аналитики.'] },
    { h: '2. Как мы используем данные', p: ['Для связи по вашей заявке и оказания услуг.', 'Для доступа в личный кабинет и отображения отчётов.', 'Для улучшения работы сайта. Мы не продаём и не передаём данные третьим лицам, кроме случаев, предусмотренных законом.'] },
    { h: '3. Хранение и защита', p: ['Данные хранятся на защищённых серверах. Пароли хранятся в зашифрованном виде. Доступ к данным имеют только уполномоченные сотрудники.'] },
    { h: '4. Cookie', p: ['Мы используем cookie для сохранения языка интерфейса, авторизации и базовой аналитики. Вы можете отключить cookie в настройках браузера.'] },
    { h: '5. Ваши права', p: ['Вы можете запросить доступ к своим данным, их исправление или удаление, написав нам на ' + CONTACT_EMAIL + '.'] },
    { h: '6. Контакты', p: ['По вопросам обработки данных: ' + CONTACT_EMAIL + '.'] },
  ],
};
const en: Copy = {
  updated: 'Updated: July 2026',
  title: 'Privacy Policy',
  intro: 'This Policy describes how the mimi marketing agency («we») collects, uses and protects the personal data of website and dashboard users.',
  sections: [
    { h: '1. Data we collect', p: ['Name, phone, email — when you submit a request or register.', 'Business name and niche — for agency clients.', 'Technical data: cookies, IP address, device type — for site operation and analytics.'] },
    { h: '2. How we use data', p: ['To contact you regarding your request and to provide services.', 'To grant dashboard access and display reports.', 'To improve the website. We do not sell or share your data with third parties except as required by law.'] },
    { h: '3. Storage & protection', p: ['Data is stored on secure servers. Passwords are stored encrypted. Only authorised staff can access the data.'] },
    { h: '4. Cookies', p: ['We use cookies to store interface language, authentication and basic analytics. You can disable cookies in your browser settings.'] },
    { h: '5. Your rights', p: ['You can request access to, correction or deletion of your data by emailing ' + CONTACT_EMAIL + '.'] },
    { h: '6. Contact', p: ['For data-processing questions: ' + CONTACT_EMAIL + '.'] },
  ],
};
const tg: Copy = {
  updated: 'Навсозӣ: июли 2026',
  title: 'Сиёсати махфият',
  intro: 'Ин Сиёсат тавсиф мекунад, ки чӣ тавр агентии маркетингии mimi («мо») маълумоти шахсии корбарони сомона ва кабинети шахсиро ҷамъ, истифода ва ҳифз мекунад.',
  sections: [
    { h: '1. Кадом маълумотро ҷамъ мекунем', p: ['Ном, телефон, email — ҳангоми фиристодани дархост ё бақайдгирӣ.', 'Номи бизнес ва ниша — барои муштариёни агентӣ.', 'Маълумоти техникӣ: cookie, суроғаи IP, навъи дастгоҳ — барои кори сомона ва аналитика.'] },
    { h: '2. Чӣ тавр маълумотро истифода мебарем', p: ['Барои тамос оид ба дархости шумо ва расонидани хидматҳо.', 'Барои дастрасӣ ба кабинет ва намоиши ҳисоботҳо.', 'Барои беҳтар кардани сомона. Мо маълумотро намефурӯшем ва ба шахсони сеюм намедиҳем, ба ғайр аз ҳолатҳои пешбининамудаи қонун.'] },
    { h: '3. Нигоҳдорӣ ва ҳифз', p: ['Маълумот дар серверҳои ҳифзшуда нигоҳ дошта мешавад. Паролҳо рамзгузорӣ мешаванд. Танҳо кормандони ваколатдор дастрасӣ доранд.'] },
    { h: '4. Cookie', p: ['Мо cookie-ро барои нигоҳдории забон, авторизатсия ва аналитикаи асосӣ истифода мебарем. Шумо метавонед cookie-ро дар танзимоти браузер хомӯш кунед.'] },
    { h: '5. Ҳуқуқҳои шумо', p: ['Шумо метавонед дастрасӣ, ислоҳ ё нест кардани маълумоти худро тавассути ' + CONTACT_EMAIL + ' дархост кунед.'] },
    { h: '6. Тамос', p: ['Оид ба коркарди маълумот: ' + CONTACT_EMAIL + '.'] },
  ],
};
const COPY: Record<Lang, Copy> = { ru, en, tg };

export default function PrivacyPage() {
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
