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
  password: issuedPassword = null,
  canEdit = true,
  who = 'Клиент',
}: {
  /** PATCH-эндпоинт: /api/clients/[id], /api/sales/[id] или /api/admin/team/[id]. */
  endpoint: string;
  email: string;
  /** Пароль, который выдал админ. null — если его меняли не через админку. */
  password?: string | null;
  canEdit?: boolean;
  /** Кому выдаём доступ — подставляется в подсказке. */
  who?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [editing, setEditing] = useState(false);
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
      setEditing(false);
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

  // Свёрнутый вид: логин и выданный пароль, чтобы отправить их клиенту одним
  // сообщением. Пароль виден, если его задавали через админку.
  if (!editing) {
    return (
      <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6">
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
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

        <dl className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 py-4">
            <dt className="w-24 shrink-0 text-[11px] uppercase tracking-[0.16em] text-light/45">Логин</dt>
            <dd className="min-w-0 flex-1 truncate font-mono text-[15px] text-light">
              {placeholder ? <span className="font-sans text-light/45">ещё не выдан</span> : initialEmail}
            </dd>
            {!placeholder && (
              <button
                type="button"
                onClick={() => copy(initialEmail, 'Логин')}
                className="text-[11px] uppercase tracking-[0.14em] text-light/50 hover:text-brand-lime"
              >
                Копировать
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 py-4">
            <dt className="w-24 shrink-0 text-[11px] uppercase tracking-[0.16em] text-light/45">Пароль</dt>
            <dd className="min-w-0 flex-1">
              {issuedPassword ? (
                <span className="select-all break-all font-mono text-[15px] text-light">{issuedPassword}</span>
              ) : (
                <>
                  <span className="font-mono text-[15px] tracking-[0.3em] text-light/50">••••••••</span>
                  <span className="ml-3 text-[12px] text-light/45">
                    {placeholder ? 'ещё не выдан' : 'пароль меняли не через админку — задайте новый, и он будет виден'}
                  </span>
                </>
              )}
            </dd>
            {issuedPassword && (
              <button
                type="button"
                onClick={() => copy(issuedPassword, 'Пароль')}
                className="text-[11px] uppercase tracking-[0.14em] text-light/50 hover:text-brand-lime"
              >
                Копировать
              </button>
            )}
          </div>
        </dl>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-[46ch] text-[12px] leading-relaxed text-light/45">
            {who} входит на сайте в разделе «Вход».
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {issuedPassword && !placeholder && (
              <button
                type="button"
                onClick={() => copy(`Логин: ${initialEmail}\nПароль: ${issuedPassword}`, 'Логин и пароль')}
                className="btn-ghost !px-4 !py-2 !text-[11px]"
              >
                Скопировать логин и пароль
              </button>
            )}
            <button type="button" onClick={() => setEditing(true)} className="btn-lime !px-5 !py-2 !text-[12px]">
              {placeholder ? 'Выдать доступ' : 'Изменить'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-brand-lime/20 bg-white/[0.02] p-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-brand-orange">Вход в кабинет</p>
          <h2 className="mt-2 font-display text-xl font-extrabold tracking-tight text-light">
            {placeholder ? 'Выдать логин и пароль' : 'Изменить логин и пароль'}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => { setEditing(false); setEmail(initialEmail); setPassword(''); }}
          className="btn-ghost !px-4 !py-2 !text-[11px]"
        >
          Отмена
        </button>
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
              placeholder={issuedPassword ? issuedPassword : `минимум ${ADMIN_PASSWORD_MIN} символов`}
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
          Запишите новый пароль до сохранения — после него он останется только у вас и у клиента.
        </p>
        <button onClick={save} disabled={busy || !canSave} className="btn-lime !px-5 !py-2 !text-[12px] disabled:opacity-40">
          {busy ? 'Сохраняем…' : 'Сохранить доступ'}
        </button>
      </div>
    </div>
  );
}
