'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/admin/PageHeader';
import { ROLE_LABEL, ASSIGNABLE_ROLES } from '@/lib/roles';
import { passwordRules } from '@/lib/validation';
import { UserAvatar } from '@/components/ui/UserAvatar';
import type { Role } from '@prisma/client';

/** Live checklist — the same rules the API enforces, so nothing is a surprise. */
function PasswordRules({ value }: { value: string }) {
  return (
    <ul className="mt-2 space-y-1">
      {passwordRules(value).map((r) => (
        <li key={r.id} className={`flex items-center gap-2 text-[11px] ${r.ok ? 'text-brand-lime' : 'text-light/40'}`}>
          <span>{r.ok ? '✓' : '○'}</span>
          {r.label}
        </li>
      ))}
    </ul>
  );
}

type Staff = {
  id: string; name: string; email: string; phone: string | null; role: Role;
  approved: boolean; avatar: string | null; jobTitle: string; bio: string;
};

const EMPTY = { name: '', email: '', phone: '', password: '', role: 'VIDEOGRAPHER' as Role };

export function PeopleClient({ meId, canManage, people }: { meId: string; canManage: boolean; people: Staff[] }) {
  const staff = people;
  const router = useRouter();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [pwFor, setPwFor] = useState<Staff | null>(null);
  const [pw, setPw] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((p) => ({ ...p, [k]: v }));

  const create = async () => {
    if (!form.name || !form.email || !form.password) return toast.error('Имя, email и пароль обязательны');
    setSaving(true);
    try {
      const r = await fetch('/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Ошибка');
      toast.success('Сотрудник создан');
      setForm(EMPTY);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const changeRole = async (id: string, role: Role) => {
    const r = await fetch(`/api/admin/team/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    if (!r.ok) return toast.error('Не удалось изменить роль');
    toast.success('Роль обновлена');
    router.refresh();
  };

  const savePassword = async () => {
    if (!pwFor) return;
    setPwSaving(true);
    const r = await fetch(`/api/admin/team/${pwFor.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    });
    setPwSaving(false);
    if (!r.ok) {
      // Surface the API's real reason (e.g. which rule failed) instead of a
      // generic failure — that's why changing a password "just didn't work".
      const d = await r.json().catch(() => ({}));
      return toast.error(d.error || 'Не удалось сменить пароль');
    }
    toast.success(`Пароль для «${pwFor.name}» обновлён`);
    setPwFor(null);
    setPw('');
  };

  const setApproved = async (s: Staff, approved: boolean) => {
    if (!approved && !confirm(`Отозвать доступ у «${s.name}»?`)) return;
    const r = await fetch(`/api/admin/team/${s.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved }),
    });
    if (!r.ok) return toast.error('Не удалось обновить доступ');
    toast.success(approved ? `${s.name} допущен(а) к работе` : 'Доступ отозван');
    router.refresh();
  };

  const remove = async (id: string) => {
    if (!confirm('Удалить сотрудника?')) return;
    const r = await fetch(`/api/admin/team/${id}`, { method: 'DELETE' });
    if (!r.ok) { const d = await r.json().catch(() => ({})); return toast.error(d.error || 'Ошибка'); }
    toast.success('Удалён');
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Team" title={<>Команда</>} subtitle="Профили коллег и управление доступом." />

      {/* Create */}
      {canManage && (
      <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6">
        <p className="mb-4 text-[10px] uppercase tracking-[0.24em] text-brand-orange">Новый сотрудник</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input className="input-glass" placeholder="Имя Фамилия" value={form.name} onChange={(e) => set('name', e.target.value)} />
          <input className="input-glass" placeholder="Email (логин)" value={form.email} onChange={(e) => set('email', e.target.value)} />
          <input className="input-glass" placeholder="Телефон (необязательно)" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          <div>
            <input className="input-glass" type="text" placeholder="Пароль" value={form.password} onChange={(e) => set('password', e.target.value)} />
            {form.password && <PasswordRules value={form.password} />}
          </div>
          <select className="input-glass" value={form.role} onChange={(e) => set('role', e.target.value as Role)}>
            {ASSIGNABLE_ROLES.map((r) => (
              <option key={r} value={r}>{ROLE_LABEL[r]}</option>
            ))}
          </select>
          <button onClick={create} disabled={saving} className="btn-lime disabled:opacity-60">
            {saving ? 'Создаём…' : '+ Создать'}
          </button>
        </div>
      </div>
      )}

      {/* Карточки коллег */}
      {staff.length === 0 ? (
        <p className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-10 text-center text-light/50">
          Пока нет сотрудников.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {staff.map((s) => (
            <div
              key={s.id}
              className="flex flex-col rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5 transition-colors hover:border-brand-lime/25"
            >
              <Link href={`/admin/people/${s.id}`} className="group flex items-center gap-4">
                <UserAvatar name={s.name} avatar={s.avatar} size={56} />
                <div className="min-w-0">
                  <div className="truncate font-display text-lg font-bold text-light group-hover:text-brand-lime">
                    {s.name}
                  </div>
                  <div className="truncate text-[11px] uppercase tracking-[0.14em] text-brand-orange">
                    {s.jobTitle || ROLE_LABEL[s.role]}
                  </div>
                  {!s.approved && (
                    <span className="mt-1.5 inline-block rounded-full border border-brand-orange/40 bg-brand-orange/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] text-brand-orange">
                      ждёт одобрения
                    </span>
                  )}
                </div>
              </Link>

              {s.bio && (
                <p className="mt-4 line-clamp-3 text-[13px] leading-relaxed text-light/60">{s.bio}</p>
              )}

              <div className="mt-4 space-y-1 border-t border-white/[0.05] pt-4 text-[12px]">
                <div className="truncate text-light/55">{s.email}</div>
                {s.phone && <a href={`tel:${s.phone}`} className="block font-mono text-brand-lime">{s.phone}</a>}
              </div>

              {/* Управление — только админ / опер. директор */}
              {canManage && (
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/[0.05] pt-4">
                  <select
                    className="input-glass !w-auto !py-1.5 !text-[12px]"
                    value={s.role}
                    disabled={s.id === meId}
                    onChange={(e) => changeRole(s.id, e.target.value as Role)}
                  >
                    {ASSIGNABLE_ROLES.map((r) => (
                      <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                    ))}
                  </select>
                  {s.approved ? (
                    s.id !== meId && (
                      <button onClick={() => setApproved(s, false)} className="text-[11px] uppercase tracking-[0.14em] text-light/40 hover:text-brand-orange">
                        Отозвать
                      </button>
                    )
                  ) : (
                    <button onClick={() => setApproved(s, true)} className="btn-lime !px-4 !py-1.5 !text-[11px]">
                      ✓ Одобрить
                    </button>
                  )}
                  <button onClick={() => { setPwFor(s); setPw(''); }} className="text-[11px] uppercase tracking-[0.14em] text-light/50 hover:text-brand-lime">
                    Пароль
                  </button>
                  {s.id !== meId && (
                    <button onClick={() => remove(s.id)} className="ml-auto text-[11px] uppercase tracking-[0.14em] text-light/40 hover:text-rose-400">
                      Удалить
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Смена пароля сотрудника */}
      {pwFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4" onClick={() => setPwFor(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl border border-white/[0.08] bg-ink2 p-6">
            <h3 className="font-display text-xl font-bold text-light">Новый пароль</h3>
            <p className="mt-1 text-[12px] text-light/45">{pwFor.name} · {pwFor.email}</p>

            <div className="mt-5">
              <label className="label-soft">Пароль</label>
              <input
                className="input-glass"
                type="text"
                autoFocus
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && savePassword()}
                placeholder="Например: Mimi2026!"
              />
              <PasswordRules value={pw} />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setPwFor(null)} className="btn-ghost">Отмена</button>
              <button onClick={savePassword} disabled={pwSaving || !pw} className="btn-lime disabled:opacity-50">
                {pwSaving ? 'Сохраняем…' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
