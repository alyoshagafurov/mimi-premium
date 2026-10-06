'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/admin/PageHeader';
import { ROLE_LABEL, ASSIGNABLE_ROLES } from '@/lib/roles';
import { ADMIN_PASSWORD_MIN } from '@/lib/validation';
import { cn } from '@/lib/utils';
import { CredentialsPanel } from '@/components/admin/CredentialsPanel';
import { UserAvatar } from '@/components/ui/UserAvatar';
import type { Role } from '@prisma/client';

type Staff = {
  id: string; name: string; email: string; phone: string | null; role: Role;
  /** Все специальности сотрудника; первая — основная. */
  roles: Role[];
  approved: boolean; avatar: string | null; jobTitle: string; bio: string;
  /** Выданный пароль — видят только админ и опер. директор. */
  password: string | null;
};

const EMPTY = { name: '', email: '', phone: '', password: '', roles: ['VIDEOGRAPHER'] as Role[] };

/** Специальности, которые можно совмещать: админ стоит особняком и всегда один. */
const CRAFT_ROLES = ASSIGNABLE_ROLES.filter((r) => r !== 'ADMIN');

/** Кнопки выбора специальностей — одна и та же для создания и для правки. */
function RolePicker({
  value, onChange, disabled = false, allowAdmin = false,
}: {
  value: Role[];
  onChange: (roles: Role[]) => void;
  disabled?: boolean;
  allowAdmin?: boolean;
}) {
  const isAdmin = value.includes('ADMIN');
  const toggle = (r: Role) => {
    // Администратор не совмещается: выбрали его — остальное снимается.
    if (r === 'ADMIN') return onChange(isAdmin ? [] : ['ADMIN']);
    const next = isAdmin ? [] : value;
    onChange(next.includes(r) ? next.filter((x) => x !== r) : [...next, r]);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {(allowAdmin ? ASSIGNABLE_ROLES : CRAFT_ROLES).map((r) => {
        const picked = value.includes(r);
        return (
          <button
            key={r}
            type="button"
            disabled={disabled}
            onClick={() => toggle(r)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-[12px] transition disabled:opacity-40',
              picked ? 'border-brand-lime bg-brand-lime text-[#0A0712]' : 'border-white/10 text-light/55 hover:text-light',
            )}
          >
            {picked ? '✓ ' : ''}{ROLE_LABEL[r]}
          </button>
        );
      })}
    </div>
  );
}

export function PeopleClient({ meId, canManage, people }: { meId: string; canManage: boolean; people: Staff[] }) {
  const staff = people;
  const router = useRouter();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [pwFor, setPwFor] = useState<Staff | null>(null);
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((p) => ({ ...p, [k]: v }));

  const create = async () => {
    if (!form.name || !form.email || !form.password) return toast.error('Имя, email и пароль обязательны');
    if (!form.roles.length) return toast.error('Выберите хотя бы одну специальность');
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

  const changeRoles = async (id: string, roles: Role[]) => {
    if (!roles.length) return toast.error('Оставьте хотя бы одну специальность');
    const r = await fetch(`/api/admin/team/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roles }),
    });
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      return toast.error(d.error || 'Не удалось изменить специальности');
    }
    toast.success('Специальности обновлены');
    router.refresh();
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
            <p className="mt-1.5 text-[11px] text-light/40">Минимум {ADMIN_PASSWORD_MIN} символов — его вы продиктуете сотруднику.</p>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="label-soft">Специальности — можно выбрать несколько</label>
            <RolePicker value={form.roles} onChange={(roles) => set('roles', roles)} />
          </div>
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
                    {s.jobTitle || s.roles.map((r) => ROLE_LABEL[r]).join(' · ')}
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
                  <div className="w-full">
                    <label className="label-soft">Специальности</label>
                    {/* Свою роль не меняем: иначе админ может случайно снять с себя доступ. */}
                    <RolePicker
                      value={s.roles}
                      disabled={s.id === meId}
                      allowAdmin={s.role === 'ADMIN'}
                      onChange={(roles) => changeRoles(s.id, roles)}
                    />
                  </div>
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
                  <button onClick={() => setPwFor(s)} className="text-[11px] uppercase tracking-[0.14em] text-light/50 hover:text-brand-lime">
                    Логин и пароль
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

      {/* Логин и пароль сотрудника */}
      {pwFor && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/80 p-4 pt-16" onClick={() => setPwFor(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[12px] text-light/60">{pwFor.name} · {ROLE_LABEL[pwFor.role]}</p>
              <button onClick={() => setPwFor(null)} className="btn-ghost !px-4 !py-1.5 !text-[11px]">Закрыть</button>
            </div>
            <div className="bg-ink2">
              <CredentialsPanel
                endpoint={`/api/admin/team/${pwFor.id}`}
                email={pwFor.email}
                password={pwFor.password}
                who="Сотрудник"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
