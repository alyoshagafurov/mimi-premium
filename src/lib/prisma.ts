import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

/**
 * Neon is reached over a single (often direct) endpoint, so cap the per-instance
 * connection pool and give connections more time to be acquired. This prevents
 * "Timed out fetching a new connection from the connection pool" both in dev
 * (hot-reload spawns extra clients) and on serverless (many lambdas).
 */
function buildUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) return url;
  try {
    const u = new URL(url);
    if (!u.searchParams.has('connection_limit')) u.searchParams.set('connection_limit', '5');
    if (!u.searchParams.has('pool_timeout')) u.searchParams.set('pool_timeout', '20');
    return u.toString();
  } catch {
    return url;
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: { db: { url: buildUrl() } },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
