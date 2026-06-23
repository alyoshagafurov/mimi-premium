/**
 * Lightweight in-memory rate limiter (fixed window).
 *
 * Best-effort only: on serverless each instance has its own memory, so this
 * throttles per-lambda rather than globally. It still meaningfully blunts
 * naive floods and abusive retries. For hard guarantees swap in a shared
 * store (Upstash/Redis) behind the same interface.
 */
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; remaining: number } {
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

// Opportunistic cleanup so the map can't grow unbounded.
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of buckets) if (now > v.resetAt) buckets.delete(k);
  }, 5 * 60 * 1000).unref?.();
}
