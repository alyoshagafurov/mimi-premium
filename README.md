# mimi — minimise marketing agency 2026

> Minimise the noise. Maximise the impact.

Платформа маркетингового агентства **mimi** (Таджикистан): продающий лендинг,
личный кабинет клиента с помесячной аналитикой и **внутренний CRM** для команды
агентства — воронка сделок, задачи, история взаимодействий и финансы.

Прод: https://mimi-agency-v2.vercel.app

---

## Стек

- **Next.js 14** (App Router, TypeScript, Server Components)
- **Tailwind CSS** + кастомная brand-система (purple `#3C1975` / lime `#D4EC4C` / orange `#FC9603`)
- **Prisma + PostgreSQL** (Neon)
- **NextAuth.js** (Credentials + JWT, роли ADMIN / CLIENT) + **bcryptjs**
- **Framer Motion**, **GSAP + ScrollTrigger**, **Recharts**
- **react-hot-toast**, **zod**, **date-fns**

---

## Возможности

### Лендинг (`/`)
Сторителлинг-скролл с принципами агентства, блоки услуг, каналов, цифр, тарифов,
FAQ и форма захвата. Заявка с формы **создаёт сделку** в CRM (этап «Новая заявка»).
Переключатель языков Tj / Ru / En (UI; локализация — в планах).

### Кабинет клиента (`/dashboard`)
Помесячные отчёты, которые агентство заполняет вручную:
- 4 метрики с дельтой к прошлому месяцу: потрачено (сомони), охват, клики, заявки;
- динамика охвата (график), прогресс-бар бюджета;
- разбивка по платформам (Instagram / Facebook) + ROAS;
- список кампаний со статусами и разбивка аудитории по возрасту.

### CRM для агентства (`/admin`)
- **Дашборд** — KPI (клиенты, активные сделки, выручка за месяц, долг),
  мини-воронка, график выручки, задачи на сегодня/просроченные, напоминания о продлении тарифов.
- **Воронка сделок** (`/admin/leads`) — kanban: Новая заявка → Переговоры →
  Коммерческое → Клиент → Отказ. Drag-and-drop между этапами (смена этапа логируется
  в историю), сумма, ответственный, карточка сделки с задачами и таймлайном.
- **Клиенты** (`/admin/clients`) — список + создание клиента + управление:
  - помесячные отчёты (метрики, платформы, кампании, аудитория);
  - **оплаты** (оплачено / ожидается / долг, история по месяцам);
  - **задачи** (дедлайны, приоритет);
  - **история** (заметки, звонки, встречи, письма).

Доступ к роутам разграничен `middleware.ts`: `/admin/*` — только ADMIN,
`/dashboard/*` — авторизованный клиент.

---

## Модель данных (Prisma)

`User` · `Client` · `MonthlyReport` (→ `Platform`, `Campaign`, `AudienceBreakdown`)
· `Deal` (воронка) · `Task` · `Activity` (заметки/история) · `Payment`.

---

## Установка

**Требования**: Node.js 18+, PostgreSQL 13+ (рекомендуется Neon).

```bash
npm install
cp .env.example .env        # DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL
npm run db:push             # применить схему к БД
npm run db:seed             # демо-данные (команда, клиенты, сделки, оплаты)
npm run dev                 # http://localhost:3000
```

### Переменные окружения

| Переменная | Описание |
|---|---|
| `DATABASE_URL` | строка PostgreSQL. **Для Vercel используйте пулерный endpoint Neon** (хост `-pooler`, `?pgbouncer=true`) — иначе возможны ошибки connection pool |
| `NEXTAUTH_SECRET` | секрет JWT (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | базовый URL приложения |
| `NEXT_PUBLIC_APP_URL` | публичный URL |
| `NEXT_PUBLIC_BRAND_PHONE` / `_INSTAGRAM` / `_WEB` / `_EMAIL` | контакты бренда |

---

## Демо-аккаунты (из seed)

| Роль | Email | Пароль |
|---|---|---|
| Админ | `admin@mimi.agency` | `mimi2024` |
| Админ (команда) | `sabina@mimi.agency` | `mimi2024` |
| Клиент | `aesthetic@mimi.dev` | `client2024` |
| Клиент | `fitness@mimi.dev` | `client2024` |

---

## Маршруты

| Маршрут | Описание |
|---|---|
| `/` | Лендинг (сторителлинг, услуги, тарифы, форма → сделка) |
| `/auth/login` · `/auth/register` | Авторизация / регистрация |
| `/pricing` · `/checkout` | Тарифы и имитация оплаты в сомони |
| `/dashboard` | Кабинет клиента — помесячные отчёты |
| `/admin` | CRM-дашборд (воронка, задачи, финансы) |
| `/admin/clients` · `/admin/clients/[id]` | Клиенты и управление (отчёты, оплаты, задачи, история) |
| `/admin/leads` | Воронка сделок (kanban) |
| `/admin/settings` | Профиль администратора |
| `/contacts` | Бренд-визитка |

---

## Команды

```bash
npm run dev          # dev-сервер
npm run build        # prod-сборка (prisma generate + next build)
npm run start        # запуск prod-сборки
npm run db:push      # применить schema.prisma к БД
npm run db:seed      # демо-данные
npm run db:studio    # Prisma Studio
```

---

© mimi · minimise marketing agency
