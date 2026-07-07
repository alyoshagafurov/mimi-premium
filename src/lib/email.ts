import { Resend } from 'resend';

/**
 * Email delivery via Resend.
 *
 * Gracefully degrades: if RESEND_API_KEY is not set (e.g. before the client
 * has provisioned a key), sendEmail() becomes a no-op that logs and returns
 * { skipped: true } instead of throwing. This lets the whole app build & run
 * without email configured; delivery lights up the moment the key is added.
 */
const apiKey = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM ?? 'mimi <onboarding@resend.dev>';
const resend = apiKey ? new Resend(apiKey) : null;

export const emailEnabled = !!resend;

type SendArgs = { to: string | string[]; subject: string; html: string; replyTo?: string };

export async function sendEmail({ to, subject, html, replyTo }: SendArgs) {
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not set — skipping send:', subject);
    return { skipped: true as const };
  }
  try {
    const res = await resend.emails.send({ from: FROM, to, subject, html, replyTo });
    return { id: res.data?.id, skipped: false as const };
  } catch (err) {
    console.error('[email] send failed:', err);
    return { error: true as const };
  }
}

/** Minimal branded HTML wrapper — dark, on-brand, inline-styled for email clients. */
export function emailLayout(opts: { heading: string; body: string; ctaLabel?: string; ctaHref?: string }) {
  const { heading, body, ctaLabel, ctaHref } = opts;
  const cta =
    ctaLabel && ctaHref
      ? `<a href="${ctaHref}" style="display:inline-block;margin-top:24px;background:#D4EC4C;color:#0A0712;font-weight:700;text-decoration:none;padding:12px 24px;border-radius:12px;font-size:14px;">${ctaLabel}</a>`
      : '';
  return `
  <div style="background:#0A0712;padding:40px 0;font-family:Helvetica,Arial,sans-serif;">
    <div style="max-width:520px;margin:0 auto;background:#141019;border:1px solid rgba(255,255,255,0.06);border-radius:20px;padding:36px;">
      <div style="font-size:26px;font-weight:900;color:#D4EC4C;letter-spacing:-1px;">mımı</div>
      <div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#FC9603;margin-top:6px;">minimise marketing agency</div>
      <h1 style="color:#F5F1FA;font-size:22px;margin:28px 0 0;">${heading}</h1>
      <div style="color:rgba(245,241,250,0.7);font-size:15px;line-height:1.6;margin-top:12px;">${body}</div>
      ${cta}
      <div style="margin-top:32px;border-top:1px solid rgba(255,255,255,0.06);padding-top:16px;color:rgba(245,241,250,0.35);font-size:11px;">
        Minimise the noise. Maximise the impact.
      </div>
    </div>
  </div>`;
}
