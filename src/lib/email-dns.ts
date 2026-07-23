/* Server-only: relies on node:dns, never import this from a client component. */
import { promises as dns } from 'dns';

/**
 * Checks that the email domain can actually receive mail (has MX or at least A
 * records). This is what stops "vasya@qwerty123.com" from getting through —
 * without sending a single message.
 *
 * Fails CLOSED only when DNS definitively says the domain doesn't exist
 * (NXDOMAIN / no records). Any other hiccup (timeout, network, rate limit)
 * fails OPEN so a DNS blip never blocks a real customer.
 */
export async function domainCanReceiveMail(domain: string): Promise<{ ok: boolean; reason?: string }> {
  if (!domain) return { ok: false, reason: 'Неверный формат email' };

  const withTimeout = <T>(p: Promise<T>, ms = 4000) =>
    Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error('ETIMEOUT')), ms))]);

  try {
    const mx = await withTimeout(dns.resolveMx(domain));
    if (Array.isArray(mx) && mx.some((r) => r.exchange)) return { ok: true };
    // Domain resolves but has no MX — fall through to the A-record check.
  } catch (e: any) {
    const code = e?.code;
    if (code !== 'ENOTFOUND' && code !== 'ENODATA' && code !== 'NXDOMAIN') {
      return { ok: true }; // transient/unknown → don't punish the user
    }
  }

  // Some small domains accept mail with only an A record.
  try {
    const a = await withTimeout(dns.resolve4(domain));
    if (Array.isArray(a) && a.length > 0) return { ok: true };
  } catch (e: any) {
    const code = e?.code;
    if (code !== 'ENOTFOUND' && code !== 'ENODATA' && code !== 'NXDOMAIN') return { ok: true };
  }

  return { ok: false, reason: 'Такой почтовый домен не существует — проверьте адрес' };
}
