/**
 * Shared validation rules for sign-up / password reset / staff accounts.
 * Used by BOTH the client form and the API so the rules never drift apart.
 */

/* ─────────────── PASSWORD ─────────────── */

export const PASSWORD_MIN = 8;

export type PasswordRule = { id: string; label: string; ok: boolean };

/** Live checklist for the UI + the single source of truth for the API. */
export function passwordRules(pw: string): PasswordRule[] {
  return [
    { id: 'len', label: `Минимум ${PASSWORD_MIN} символов`, ok: pw.length >= PASSWORD_MIN },
    { id: 'upper', label: 'Заглавная буква (A–Z, А–Я)', ok: /[A-ZА-ЯЁ]/.test(pw) },
    { id: 'lower', label: 'Строчная буква (a–z, а–я)', ok: /[a-zа-яё]/.test(pw) },
    { id: 'digit', label: 'Цифра (0–9)', ok: /\d/.test(pw) },
    { id: 'special', label: 'Знак (. - _ ! @ # и т.д.)', ok: /[^A-Za-zА-Яа-яЁё0-9]/.test(pw) },
  ];
}

export function isStrongPassword(pw: string): boolean {
  return passwordRules(pw).every((r) => r.ok);
}

/** Human-readable reason the password is rejected, or null when it's fine. */
export function passwordProblem(pw: string): string | null {
  const failed = passwordRules(pw).filter((r) => !r.ok);
  if (failed.length === 0) return null;
  return `Пароль слабый — нужно: ${failed.map((f) => f.label).join('; ')}`;
}

/* ─────────────── EMAIL ─────────────── */

/** Stricter than the default: real TLD, no consecutive dots, no leading/trailing dots. */
const EMAIL_RE = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,24}$/;

/** Throwaway inboxes — we need a reachable address, not a 10-minute one. */
const DISPOSABLE = new Set([
  'mailinator.com', 'tempmail.com', 'temp-mail.org', '10minutemail.com', 'guerrillamail.com',
  'yopmail.com', 'trashmail.com', 'sharklasers.com', 'getnada.com', 'dispostable.com',
  'fakeinbox.com', 'maildrop.cc', 'throwawaymail.com', 'mohmal.com', 'emailondeck.com',
  'tempmailo.com', 'moakt.com', 'luxusmail.org', 'mailnesia.com', 'spam4.me',
]);

/** Common typos we can confidently point at. */
const TYPOS: Record<string, string> = {
  'gmail.co': 'gmail.com', 'gmai.com': 'gmail.com', 'gmial.com': 'gmail.com',
  'gmail.ru': 'gmail.com', 'gmail.con': 'gmail.com', 'gmaill.com': 'gmail.com',
  'mail.ri': 'mail.ru', 'mai.ru': 'mail.ru', 'mail.rru': 'mail.ru',
  'yandex.ri': 'yandex.ru', 'yandx.ru': 'yandex.ru',
  'hotmai.com': 'hotmail.com', 'outlok.com': 'outlook.com',
  'icloud.co': 'icloud.com', 'yaho.com': 'yahoo.com',
};

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function emailDomain(email: string): string {
  return normalizeEmail(email).split('@')[1] ?? '';
}

/** Format/disposable/typo problems. Returns null when the address looks legit. */
export function emailProblem(raw: string): string | null {
  const email = normalizeEmail(raw);
  if (!email) return 'Укажите email';
  if (email.length > 160) return 'Слишком длинный email';
  if (!EMAIL_RE.test(email)) return 'Неверный формат email — например: name@gmail.com';

  const domain = emailDomain(email);
  if (TYPOS[domain]) return `Похоже на опечатку — вы имели в виду @${TYPOS[domain]}?`;
  if (DISPOSABLE.has(domain)) return 'Временные почты не принимаются — укажите постоянный email';
  return null;
}

/* ─────────────── PHONE ─────────────── */

/** Tajik mobile prefixes (the 2 digits after +992). */
const TJ_PREFIXES = new Set([
  '90', '91', '92', '93', '94', '95', '98', '99', // Tcell / Megafon / Babilon / ZetMobile
  '50', '55', '77', '88',
]);

/** Keep a leading +, drop everything else that isn't a digit. */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  // 8XXXXXXXXX / 0XXXXXXXXX local forms → assume Tajikistan
  if (digits.length === 9 && TJ_PREFIXES.has(digits.slice(0, 2))) return `+992${digits}`;
  return `+${digits}`;
}

/** Returns null when the number is plausible, otherwise the reason. */
export function phoneProblem(raw: string): string | null {
  const value = (raw ?? '').trim();
  if (!value) return 'Укажите номер телефона';

  const normalized = normalizePhone(value);
  const digits = normalized.replace(/\D/g, '');

  if (digits.startsWith('992')) {
    const rest = digits.slice(3);
    if (rest.length !== 9) return 'Номер Таджикистана: +992 и 9 цифр — например +992 90 123 45 67';
    if (!TJ_PREFIXES.has(rest.slice(0, 2))) return 'Неверный код оператора — проверьте номер';
    if (/^(\d)\1+$/.test(rest)) return 'Такого номера не существует';
    return null;
  }

  // Other countries — general E.164 sanity check.
  if (digits.length < 8 || digits.length > 15) return 'Неверный номер телефона';
  if (/^(\d)\1+$/.test(digits)) return 'Такого номера не существует';
  return null;
}
