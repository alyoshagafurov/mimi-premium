# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary (confirmed 2026-09-17):** owners of small and medium businesses and independent experts in Tajikistan — shops, clinics, beauty salons, schools and academies, visa and travel agencies, private specialists such as doctors. They are choosing a marketing agency and judge it by real, checkable results rather than promises.
- **Internal:** agency staff (admin, operations director, sales, videographer, montage, designer, developer) running projects, leads, calendar and finance in `/admin`.
- **Clients:** partners who log into `/dashboard` to see their reports, payments, tasks and PDF reports.

## Product Purpose

mimi (mimitj.agency) is a full-cycle marketing agency in Dushanbe: targeted ads (Meta/Instagram), content shooting and editing, strategy, branding, design, websites and sales-system training. The public site exists to turn a business owner into a conversation; the internal platform runs the agency and shows clients their results. Success on the public site = a qualified visitor writes on WhatsApp or leaves a request.

## Positioning

«Минимизируем шум — максимизируем узнаваемость»: systematic marketing without chaos or wasted spend, where every action has to show a measurable result (ROMI, ROAS, cost per lead). The agency positions itself as a partner, not a contractor.

## Operating Context

- Main contact channel is WhatsApp `+992 07 021 77 55`; also phone, `hello@mimitj.agency` and Instagram `@mimi.agency.tj`. City: Dushanbe; serves Dushanbe, Khujand, Bokhtar, Kulob, Istaravshan, Tursunzoda. No public street address or opening hours are recorded.
- On the contacts page, writing on WhatsApp and leaving a request form are **equal** primary actions (confirmed 2026-09-17).
- The site is trilingual: RU (default), EN, TG.
- Visitors mostly arrive from Instagram on phones (inferred from the Instagram-first lead flow).

## Capabilities and Constraints

- Stack: Next.js 14 App Router, Prisma + Neon Postgres, Tailwind, deployed on Vercel from `main`.
- Cases are managed in the admin: logo, title, description, optional Instagram link.
- Reviews: any visitor can submit one on `/reviews`; it appears **only after an admin publishes it** (confirmed 2026-09-17). Admins can also add, edit and delete reviews.
- Speed is a hard requirement: perceived lag is treated as a bug; content must be visible without waiting for animation or JS.

## Brand Commitments

- Name and logo: plain text wordmark «mimi» — never add decorative overlays to it.
- Voice: confident, calm, result-first; short sentences; «меньше шума, больше смысла».
- Principles used in copy: умная эффективность, смелость мышления, премиальное отношение, результат как репутация, партнёрство.

## Evidence on Hand

- As of 2026-09-17 the database has **0 published cases and 0 published reviews**. Case stories referenced on the landing (sports store +2459% ROMI, phlebologist −60% CPL, visa agency ×4 sales revenue) are the agency's own claims in landing copy. Do not invent reviews, client names, ratings or metrics; empty states must be designed instead.

## Product Principles

1. Proof over promise: show results and real work, never decorative claims.
2. One clear next step on every public page.
3. Fast and legible first — on a phone, from Instagram, on a slow connection.
4. Premium but calm: the brand earns trust by restraint, not noise.
