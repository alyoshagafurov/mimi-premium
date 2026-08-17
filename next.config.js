/** @type {import('next').NextConfig} */

// Pragmatic Content-Security-Policy.
// Next.js App Router, framer-motion and recharts inject inline styles, and
// hydration relies on inline scripts, so style-src/script-src allow 'unsafe-inline'.
// data: is permitted for img-src because uploaded files are served as data: URLs.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https:",
  // The CRM embeds the source video of a lead straight from its link.
  // Without this, frame-src falls back to default-src 'self' and the embed is blocked.
  "frame-src 'self' https://www.instagram.com https://instagram.com https://www.youtube.com https://www.youtube-nocookie.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  'upgrade-insecure-requests',
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
];

// Long-lived immutable cache for static media in /public (webp/svg/png/…).
// These filenames are stable; bump the file name if content ever changes.
const longCache = [
  { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  experimental: {
    /**
     * Кэш клиентской навигации. Функции живут в Вашингтоне, а пользователи в
     * Душанбе — каждый поход на сервер стоит ~800 мс только на дорогу. С этим
     * возврат в уже открытый раздел рендерится из памяти браузера, без запроса.
     * 60 с для динамических страниц: свежесть данных не страдает (мутации всё
     * равно вызывают router.refresh()), а переходы становятся мгновенными.
     */
    staleTimes: { dynamic: 60, static: 300 },
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      {
        source: '/:file(.*\\.(?:webp|png|jpg|jpeg|gif|svg|ico|woff2))',
        headers: longCache,
      },
    ];
  },
};

module.exports = nextConfig;
