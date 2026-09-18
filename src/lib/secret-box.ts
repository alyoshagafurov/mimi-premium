import crypto from 'crypto';

/**
 * Небольшой сейф для паролей, которые админ выдаёт клиентам и сотрудникам.
 *
 * Вход в систему по-прежнему проверяется по bcrypt-хешу — его прочитать нельзя.
 * Но агентству нужно видеть выданный пароль, чтобы отправить его клиенту,
 * поэтому копию храним отдельно и в шифрованном виде: ключ берётся из
 * NEXTAUTH_SECRET, он лежит в переменных окружения, а не в базе.
 */
const ALGO = 'aes-256-gcm';

function key(): Buffer | null {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return null;
  return crypto.createHash('sha256').update(secret).digest();
}

/** Шифрует пароль для хранения. Без ключа возвращает null — тогда просто не храним. */
export function sealSecret(plain: string): string | null {
  const k = key();
  const value = (plain ?? '').trim();
  if (!k || !value) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, k, iv);
  const data = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString('base64url')}.${tag.toString('base64url')}.${data.toString('base64url')}`;
}

/**
 * Возвращает пароль обратно. null — если ключа нет, запись сделана другим
 * ключом или её испортили: тогда админка честно покажет «пароль не сохранён».
 */
export function openSecret(sealed?: string | null): string | null {
  const k = key();
  if (!k || !sealed) return null;
  const [version, iv, tag, data] = sealed.split('.');
  if (version !== 'v1' || !iv || !tag || !data) return null;
  try {
    const decipher = crypto.createDecipheriv(ALGO, k, Buffer.from(iv, 'base64url'));
    decipher.setAuthTag(Buffer.from(tag, 'base64url'));
    return Buffer.concat([decipher.update(Buffer.from(data, 'base64url')), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}
