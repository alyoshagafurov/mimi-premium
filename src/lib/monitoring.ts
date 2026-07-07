/**
 * Centralised error capture.
 *
 * Emits a structured JSON line that Vercel Observability / log drains pick up
 * with zero configuration. If SENTRY_DSN is set, it additionally forwards the
 * event to Sentry's ingest endpoint (no SDK needed, so the build stays light).
 */
const SENTRY_DSN = process.env.SENTRY_DSN;

function parseDsn(dsn: string) {
  try {
    const u = new URL(dsn);
    const projectId = u.pathname.replace('/', '');
    const host = u.host;
    const key = u.username;
    return { url: `https://${host}/api/${projectId}/store/`, key };
  } catch {
    return null;
  }
}

export function captureError(error: unknown, context?: Record<string, unknown>) {
  const err = error instanceof Error ? error : new Error(String(error));
  // Structured log — always on.
  console.error(
    JSON.stringify({ level: 'error', message: err.message, stack: err.stack, ...context }),
  );

  const parsed = SENTRY_DSN ? parseDsn(SENTRY_DSN) : null;
  if (parsed) {
    // Fire-and-forget; never block the request path on telemetry.
    fetch(parsed.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${parsed.key}, sentry_client=mimi/1.0`,
      },
      body: JSON.stringify({
        message: err.message,
        level: 'error',
        platform: 'node',
        exception: { values: [{ type: err.name, value: err.message }] },
        extra: context,
        timestamp: Date.now() / 1000,
      }),
    }).catch(() => {});
  }
}
