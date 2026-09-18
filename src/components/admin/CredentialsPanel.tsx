'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ADMIN_PASSWORD_MIN } from '@/lib/validation';

/** Заглушка, с которой заводится лид: войти с таким адресом нельзя. */
const PLACEHOLDER_DOMAIN = '@lead.mimitj.agency';

/** Пароль, который легко продиктовать: без похожих символов вроде 0/O и 1/l. */
function generatePassword(length = 12): string {
  const alphabet = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

/**
 * «Вход в кабинет» — админ выдаёт клиенту, лиду или сотруднику рабочий
 * логин и пароль. Один блок на все карточки: меняется только endpoint.
 */
export function CredentialsPanel({
  endpoint,
  email: initialEmail,
  canEdit = true,
  who = 'Клиент',
}: {
  /** PATCH-эндпоинт: /api/clients/[id], /api/sales/[id] или /api/admin/team/[id]. */
  endpoint: string;
  email: string;
  canEdit?: boolean;
  /** Кому выдаём доступ — подставляется в подсказке. */
  who?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const placeholder = initialEmail.endsWith(PLACEHOLDER_DOMAIN);
  const emailChanged = email.trim().toLowerCase() !== initialEmail.trim().toLowerCase();
  const canSave = (emailChanged && email.trim().length > 0) || password.trim().length > 0;

  const save = async () => {
    setBusy(true);
    try {
      const body: Record<string, string> = {};
      if (emailChanged) body.email = email.trim();
      if (password.trim()) body.password = password.trim();
      const r = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'Не удалось сохранить доступ');
      toast.success(password.trim() ? 'Логин и пароль сохранены' : 'Логин сохранён');
      setPassword('');
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${what} скопирован`);
    } catch {
      toast.error('Браузер не дал скопировать — выделите и скопируйте вручную');
    }
  };

  if (!canEdit) {
    return (
      <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6">
        <p className="mb-3 text-[10px] uppercase tracking-[0.24em] text-brand-orange">Вход в кабинет</p>
        <p className="text-sm text-light/70">
          Логин: <span className="font-mono text-light">{placeholder ? 'не выдан' : initialEmail}</span>
        </p>
        <p className="mt-2 text-[12px] text-light/45">Логин и пароль меняет админ или операционный директор.</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-brand-orange">Вход в кабинет</p>
          <h2 className="mt-2 font-display text-xl font-extrabold tracking-tight text-light">Логин и пароль</h2>
        </div>
        {placeholder && (
          <span className="rounded-full border border-brand-orange/40 bg-brand-orange/10 px-3 py-1 text-[11px] text-brand-orange">
            доступа ещё нет
          </span>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${endpoint}-email`} className="label-soft">Email — это и есть логин</label>
          <div className="flex gap-2">
            <input
              id={`${endpoint}-email`}
              type="email"
              autoComplete="off"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-glass"
            />
            <button
              type="button"
              onClick={() => copy(email.trim(), 'Логин')}
              disabled={!email.trim()}
              className="btn-ghost shrink-0 !px-4 !py-2 !text-[11px] disabled:opacity-40"
            >
              Копировать
            </button>
          </div>
        </div>

        <div>
          <label htmlFor={`${endpoint}-password`} className="label-soft">Новый пароль — пустое поле ничего не меняет</label>
          <div className="flex gap-2">
            <input
              id={`${endpoint}-password`}
              type="text"
              autoComplete="off"
              spellCheck={false}
              placeholder={`минимум ${ADMIN_PASSWORD_MIN} символов`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-glass font-mono"
            />
            <button
              type="button"
              onClick={() => setPassword(generatePassword())}
              className="btn-ghost shrink-0 !px-4 !py-2 !text-[11px]"
            >
              Придумать
            </button>
          </div>
          {password && (
            <button
              type="button"
              onClick={() => copy(password, 'Пароль')}
              className="mt-2 text-[11px] uppercase tracking-[0.14em] text-light/55 hover:text-brand-lime"
            >
              Копировать пароль
            </button>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-[52ch] text-[12px] leading-relaxed text-light/45">
          {who} входит на сайте в разделе «Вход». Пароль хранится зашифрованным — посмотреть старый нельзя, можно только
          задать новый и продиктовать его.
        </p>
        <button onClick={save} disabled={busy || !canSave} className="btn-lime !px-5 !py-2 !text-[12px] disabled:opacity-40">
          {busy ? 'Сохраняем…' : 'Сохранить доступ'}
        </button>
      </div>
    </div>
  );
}
