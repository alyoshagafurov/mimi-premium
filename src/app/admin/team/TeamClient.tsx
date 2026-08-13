'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/admin/PageHeader';
import { ROLE_LABEL, ASSIGNABLE_ROLES } from '@/lib/roles';
import { passwordRules } from '@/lib/validation';
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

type Staff = { id: string; name: string; email: string; phone: string | null; role: Role };

const EMPTY = { name: '', email: '', phone: '', password: '', role: 'VIDEOGRAPHER' as Role };

export function TeamClient({ meId, staff }: { meId: string; staff: Staff[] }) {
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

  const remove = async (id: string) => {
    if (!confirm('Удалить сотрудника?')) return;
    const r = await fetch(`/api/admin/team/${id}`, { method: 'DELETE' });
    if (!r.ok) { const d = await r.json().catch(() => ({})); return toast.error(d.error || 'Ошибка'); }
    toast.success('Удалён');
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Team" title={<>Сотрудники</>} subtitle="Учётные записи команды и их роли в системе." />

      {/* Create */}
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

      {/* List */}
      <div className="overflow-hidden rounded-3xl border border-white/[0.06]">
        {staff.length === 0 ? (
          <p className="p-8 text-center text-light/50">Пока нет сотрудников.</p>
        ) : (
          <div className="divide-y divide-white/[0.05]">
            {staff.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lime-gradient font-display text-base font-extrabold text-[#0A0712]">
                  {s.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-light">{s.name}</div>
                  <div className="truncate text-[12px] text-light/45">{s.email}{s.phone ? ` · ${s.phone}` : ''}</div>
                </div>
                <select
                  className="input-glass !w-auto !py-2 text-[13px]"
                  value={s.role}
                  disabled={s.id === meId}
                  onChange={(e) => changeRole(s.id, e.target.value as Role)}
                >
                  {ASSIGNABLE_ROLES.map((r) => (
                    <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                  ))}
                </select>
                <button onClick={() => { setPwFor(s); setPw(''); }} className="text-[11px] uppercase tracking-[0.14em] text-light/50 hover:text-brand-lime">
                  Пароль
                </button>
                {s.id !== meId && (
                  <button onClick={() => remove(s.id)} className="text-[11px] uppercase tracking-[0.14em] text-light/40 hover:text-rose-400">
                    Удалить
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

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
