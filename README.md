# mimi — minimise marketing agency

> Minimise the noise. Maximise the impact.

Маркетинговое агентство полного цикла из Таджикистана. Сайт — SaaS-экосистема:
иммерсивный 3D-сторителлинг на главной, регистрация и оплата тарифа,
клиентский BI-дашборд и админ-панель в едином бренде.

---

## 🎨 Бренд

| Цвет | HEX | Использование |
|---|---|---|
| Глубокий фиолетовый | `#3C1975` | Основной фон, заливки |
| Лаймовый | `#D4EC4C` | Логотип, CTA, акценты |
| Оранжевый | `#FC9603` | Точки над `i`, sub-tagline, hover |

Шрифты: **Outfit** (display) + **Manrope** (body). В брендбуке —
Moderustic + Nekst; Moderustic заменён на ближайший по силуэту Outfit, т.к.
`next/font` ещё не содержит Moderustic.

---

## Стек

- **Next.js 14** (App Router, TypeScript, Server Components)
- **Tailwind CSS** + кастомная brand-система (purple/lime/orange)
- **React Three Fiber** — единый Canvas, 4 000 частиц, морфирующих через 5 сцен
- **GSAP + ScrollTrigger** — синхронизация сцен со скроллом, fade-окна для текстовых overlays
- **Framer Motion** — микроанимации появления на остальных страницах
- **Recharts** — графики ROMI, прогнозы, бар-чарты в админке
- **NextAuth.js** (Credentials + JWT) + **bcryptjs**
- **Prisma + PostgreSQL**
- **react-hot-toast**, **qrcode.react**, **date-fns**, **zod**

---

## Главная страница — 5 сцен

Один пинованный 3D Canvas, ScrollTrigger гонит `scrollProgress` (0→1),
текстовые overlays крест-фейдятся через GSAP. Камера тилтится за курсором
(mouse-параллакс).

| # | Сцена | Что происходит |
|---|---|---|
| 1 | **CHAOS** | Тысячи частиц мечутся хаотично, поверх — глитч-плашки `"$12k wasted"`, `"no conversions"` |
| 2 | **AI FILTER** | Появляются торы-сканеры, слабые лиды краснеют и улетают вниз, ценные становятся лаймовыми |
| 3 | **FUNNEL** | Лаймовые ленты формируют коническую воронку: Traffic → Qualification → Trust → Conversion |
| 4 | **MORPH** | Камера влетает в лаймовую сферу, появляется dashboard: ROAS +327%, Revenue ×3.4, CAC ↓41% |
| 5 | **DOMINO** | Частицы рассыпаются в сетку города, столбики-узлы вырастают цепной реакцией, камера поднимается |

---

## Установка

**Требования**: Node.js 18+, PostgreSQL 13+

```bash
npm install
cp .env.example .env       # вставить DATABASE_URL и NEXTAUTH_SECRET
npm run db:push            # применить схему к БД
npm run db:seed            # создать admin-аккаунт и демо-данные
npm run dev                # http://localhost:3000
```

### Переменные окружения

| Переменная | Описание |
|---|---|
| `DATABASE_URL` | строка PostgreSQL |
| `NEXTAUTH_SECRET` | секрет JWT (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | базовый URL приложения |
| `NEXT_PUBLIC_APP_URL` | публичный URL |
| `NEXT_PUBLIC_BRAND_PHONE` | `+992 07 021 77 55` |
| `NEXT_PUBLIC_BRAND_INSTAGRAM` | `https://instagram.com/mimi.agency.tj` |
| `NEXT_PUBLIC_BRAND_WEB` | `mimi.agency.tj.com` |
| `NEXT_PUBLIC_BRAND_EMAIL` | контактный email |

---

## Демо-аккаунт

| Роль | Email | Пароль |
|---|---|---|
| Админ | `admin@mimi.agency` | `mimi2024` |

Демо-клиенты убраны из seed — клиенты регистрируются сами через сайт.

---

## Тарифы (из брендбука)

| Тариф | 1-й месяц | Со 2-го месяца |
|---|---|---|
| **PRO** | 2 500 сомони | 2 500 сомони |
| **STANDART** | 6 000 сомони | 5 000 сомони |
| **ELITE** | 10 000 сомони | 8 000 сомони |

Под капотом enum в Prisma остался `START / GROWTH / PREMIUM` для совместимости;
UI-обёртка показывает PRO / STANDART / ELITE.

---

## Структура страниц

| Маршрут | Описание |
|---|---|
| `/` | Новый 3D-storytelling: 5 сцен + CTA + форма захвата |
| `/auth/login` · `/auth/register` | Стеклянные карточки на ambient-частицах |
| `/pricing` | PRO / STANDART / ELITE с полным составом из брошюры |
| `/checkout?plan=...` | Имитация оплаты в сомони |
| `/dashboard` | Клиентский кабинет: KPI, ROMI, воронка, лиды, кампании |
| `/admin` | Прогноз прибыли, помогли клиентам, заявки |
| `/admin/clients` | Таблица + редактирование + архивация |
| `/admin/campaigns` | Фильтры, действия Пауза/Запустить/Масштабировать |
| `/admin/metrics` | Форма ввода + история |
| `/admin/leads` | Заявки с фильтром |
| `/admin/settings` | Профиль администратора |
| `/contacts` | Бренд-визитка purple/lime + QR + ценности |

---

## Команды

```bash
npm run dev          # dev-сервер
npm run build        # prod-сборка
npm run start        # запуск prod-сборки
npm run db:push      # применить schema.prisma к БД
npm run db:migrate   # создать миграцию
npm run db:seed      # admin only
npm run db:studio    # GUI для БД
```

---

## Производительность

- Единый Canvas, 4 000 точек, все анимации через рефы — никаких setState per frame
- DPR clamp `[1, 1.6]` — баланс между чёткостью и FPS
- AdditiveBlending + `depthWrite: false` — мягкое свечение без z-fighting
- На мобильных: количество частиц сохраняется, но Canvas dpr автоматически снижается ≤1
- Текстовые overlays — `position: sticky` внутри `100vh+` секций, GSAP крест-фейдит

---

© mimi · сделано с лаймовой пылью.
