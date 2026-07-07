import { Redis } from '@upstash/redis';

/**
 * Rate limiter with two backends:
 *   • Upstash Redis (shared, correct across all serverless instances) when
 *     UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are configured.
 *   • In-memory fixed window fallback otherwise (per-lambda, best-effort).
 *
 * Always async so callers have one interface regardless of backend.
 */
type Result = { ok: boolean; remaining: number };

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

export const rateLimitBackend = redis ? 'redis' : 'memory';

// ── in-memory fallback ──────────────────────────────────────────────
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function memoryLimit(key: string, limit: number, windowMs: number): Result {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now > b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }
  if (b.count >= limit) return { ok: false, remaining: 0 };
  b.count += 1;
  return { ok: true, remaining: limit - b.count };
}

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of buckets) if (now > v.resetAt) buckets.delete(k);
  }, 5 * 60 * 1000).unref?.();
}

// ── public API ──────────────────────────────────────────────────────
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<Result> {
  if (!redis) return memoryLimit(key, limit, windowMs);
  try {
    const rlKey = `rl:${key}`;
    const count = await redis.incr(rlKey);
    if (count === 1) await redis.pexpire(rlKey, windowMs);
    if (count > limit) return { ok: false, remaining: 0 };
    return { ok: true, remaining: limit - count };
  } catch {
    // Never let the limiter take down the request path.
    return memoryLimit(key, limit, windowMs);
  }
}
