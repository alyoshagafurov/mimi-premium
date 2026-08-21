'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { StatusPill } from '@/components/ui/StatusPill';
import { PageHeader } from '@/components/admin/PageHeader';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { cn, tariffLabel } from '@/lib/utils';

type Row = {
  id: string;
  businessName: string;
  niche: string;
  logo: string | null;
  status: string;
  salesStatus: string;
  createdAt: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  ownerAvatar: string | null;
  tariff: string;
  reports: number;
};

/** Small logo/initial for a project. */
function ProjectLogo({ name, logo, size = 40 }: { name: string; logo: string | null; size?: number }) {
  if (logo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logo} alt={name} width={size} height={size} className="shrink-0 rounded-2xl object-cover" style={{ width: size, height: size }} />;
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-2xl bg-lime-gradient font-display font-extrabold text-[#0A0712]"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

const TARIFFS = ['NONE', 'START', 'GROWTH', 'PREMIUM'] as const;

const emptyNew = {
  name: '',
  email: '',
  password: '',
  phone: '',
  businessName: '',
  niche: '',
  tariff: 'NONE' as string,
};

export function ClientsClient({ clients }: { clients: Row[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Row | null>(null);
  const [pw, setPw] = useState(''); // new password for the client being edited (blank = keep)
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyNew);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState('');
  const [view, setView] = useState<'tiles' | 'list'>('tiles');

  const openEdit = (row: Row) => { setPw(''); setEditing(row); };

  // Remember the chosen view between visits.
  useEffect(() => {
    const saved = localStorage.getItem('clients-view');
    if (saved === 'list' || saved === 'tiles') setView(saved);
  }, []);
  const changeView = (v: 'tiles' | 'list') => { setView(v); localStorage.setItem('clients-view', v); };

  const filtered = clients.filter((c) =>
    [c.businessName, c.niche, c.ownerName, c.ownerEmail].join(' ').toLowerCase().includes(filter.toLowerCase()),
  );

  const updateStatus = async (id: string, status: 'ACTIVE' | 'ARCHIVED') => {
    const res = await fetch(`/api/clients/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      toast.success(status === 'ACTIVE' ? 'Клиент активирован' : 'Клиент в архиве');
      router.refresh();
    } else toast.error('Не удалось обновить');
  };

  const save = async (row: Row) => {
    if (pw && pw.length < 6) {
      toast.error('Пароль минимум 6 символов');
      return;
    }
    setBusy(true);
    const res = await fetch(`/api/clients/${row.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessName: row.businessName,
        niche: row.niche,
        tariff: row.tariff,
        logo: row.logo,
        name: row.ownerName,
        email: row.ownerEmail,
        phone: row.ownerPhone,
        avatar: row.ownerAvatar,
        ...(pw ? { password: pw } : {}),
      }),
    });
    setBusy(false);
    if (res.ok) {
      toast.success('Изменения сохранены');
      setEditing(null);
      setPw('');
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? 'Не удалось сохранить');
    }
  };

  const create = async () => {
    if (!form.name || !form.email || form.password.length < 6 || !form.businessName) {
      toast.error('Заполните имя, email, пароль (6+) и название бизнеса');
      return;
    }
    setBusy(true);
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // A client added here is a converted partner (leads are added on Продажи).
      body: JSON.stringify({ ...form, salesStatus: 'PARTNER' }),
    });
    setBusy(false);
    if (res.ok) {
      toast.success('Клиент создан');
      setCreating(false);
      setForm(emptyNew);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? 'Не удалось создать клиента');
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Projects"
        title={<>Наши <span className="text-lime-grad">проекты</span></>}
        subtitle="Проекты, с которыми мы работаем: бизнесы, ниши и тарифы."
        action={
          <button onClick={() => setCreating(true)} className="btn-gold !px-5 !py-3 !text-[11px]">
            + Добавить проект
          </button>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          placeholder="Поиск по бизнесу, нише, имени…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="input-glass max-w-sm"
        />
        <div className="flex items-center gap-3">
          {/* List / tiles toggle */}
          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
            <button
              onClick={() => changeView('tiles')}
              aria-label="Плитки"
              className={cn('rounded-full p-1.5 transition-colors', view === 'tiles' ? 'bg-brand-lime text-[#0A0712]' : 'text-light/50 hover:text-light')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/></svg>
            </button>
            <button
              onClick={() => changeView('list')}
              aria-label="Список"
              className={cn('rounded-full p-1.5 transition-colors', view === 'list' ? 'bg-brand-lime text-[#0A0712]' : 'text-light/50 hover:text-light')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="4" width="18" height="3" rx="1.5"/><rect x="3" y="10.5" width="18" height="3" rx="1.5"/><rect x="3" y="17" width="18" height="3" rx="1.5"/></svg>
            </button>
          </div>
          <span className="chip-lime">{filtered.length} клиентов</span>
        </div>
      </div>

      {/* ─── TILES ─── */}
      {view === 'tiles' && (
        filtered.length ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((c) => (
              <Link
                key={c.id}
                href={`/admin/clients/${c.id}`}
                className="group relative flex flex-col items-center rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5 text-center transition-colors hover:border-brand-lime/30"
              >
                <button
                  onClick={(e) => { e.preventDefault(); openEdit(c); }}
                  aria-label="Редактировать"
                  className="absolute right-2 top-2 rounded-full border border-white/10 bg-ink/40 p-1.5 text-light/40 opacity-0 transition hover:text-brand-lime group-hover:opacity-100"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                </button>
                <ProjectLogo name={c.businessName} logo={c.logo} size={64} />
                <div className="mt-3 line-clamp-1 font-medium text-light group-hover:text-brand-lime">{c.businessName}</div>
                <div className="mt-1 line-clamp-1 text-[11px] text-muted">{c.niche}</div>
                <div className="mt-3"><StatusPill status={c.status} /></div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-12 text-center text-muted">Ничего не найдено</p>
        )
      )}

      {/* ─── LIST ─── */}
      {view === 'list' && (
      <div className="glass overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-white/[0.02] text-[10px] uppercase tracking-[0.16em] text-muted">
              <tr>
                <th className="px-4 py-3 text-left">Клиент</th>
                <th className="px-4 py-3 text-left">Ниша</th>
                <th className="px-4 py-3 text-left">Тариф</th>
                <th className="px-4 py-3 text-left">Отчётов</th>
                <th className="px-4 py-3 text-left">Статус</th>
                <th className="px-4 py-3 text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-t border-white/5 transition hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <Link href={`/admin/clients/${c.id}`} className="group flex items-center gap-3">
                      <ProjectLogo name={c.businessName} logo={c.logo} size={36} />
                      <div>
                        <div className="font-medium text-light group-hover:text-brand-lime">{c.businessName}</div>
                        <div className="text-[11px] text-muted">{c.ownerName} · {c.ownerEmail}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{c.niche}</td>
                  <td className="px-4 py-3">
                    <span className="chip text-gold/90">{tariffLabel(c.tariff)}</span>
                  </td>
                  <td className="px-4 py-3 text-muted">{c.reports}</td>
                  <td className="px-4 py-3"><StatusPill status={c.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(c)}
                        className="rounded-lg border border-white/10 px-3 py-1.5 text-[11px] text-muted transition hover:border-gold/40 hover:text-gold"
                      >
                        Редактировать
                      </button>
                      <button
                        onClick={() => updateStatus(c.id, c.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE')}
                        className="rounded-lg border border-white/10 px-3 py-1.5 text-[11px] text-muted transition hover:border-gold/40 hover:text-gold"
                      >
                        {c.status === 'ACTIVE' ? 'Архивировать' : 'Восстановить'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted">Ничего не найдено</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Edit modal */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setEditing(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-gold w-full max-w-md rounded-3xl p-8"
            >
              <h2 className="font-display text-xl font-bold">Редактировать клиента</h2>
              <p className="text-xs text-muted">Логотип проекта, данные и вход клиента.</p>
              <div className="mt-6 max-h-[65vh] space-y-4 overflow-y-auto pr-1">
                <div className="flex items-center gap-4">
                  <ProjectLogo name={editing.businessName} logo={editing.logo} size={56} />
                  <div className="flex-1">
                    <ImageUpload label="Логотип проекта" value={editing.logo} onChange={(url) => setEditing({ ...editing, logo: url })} />
                  </div>
                </div>
                <div>
                  <label className="label-soft">Название бизнеса</label>
                  <input
                    className="input-glass"
                    value={editing.businessName}
                    onChange={(e) => setEditing({ ...editing, businessName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label-soft">Ниша</label>
                  <input
                    className="input-glass"
                    value={editing.niche}
                    onChange={(e) => setEditing({ ...editing, niche: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label-soft">Тариф</label>
                  <select
                    className="input-glass"
                    value={editing.tariff}
                    onChange={(e) => setEditing({ ...editing, tariff: e.target.value })}
                  >
                    {TARIFFS.map((t) => (
                      <option key={t} value={t}>{tariffLabel(t)}</option>
                    ))}
                  </select>
                </div>

                {/* ─── Login & profile ─── */}
                <div className="border-t border-white/10 pt-4">
                  <p className="mb-3 text-[10px] uppercase tracking-[0.16em] text-muted">Вход и профиль клиента</p>
                  <ImageUpload label="Аватар клиента" value={editing.ownerAvatar} onChange={(url) => setEditing({ ...editing, ownerAvatar: url })} />
                </div>
                <div>
                  <label className="label-soft">Имя контактного лица</label>
                  <input
                    className="input-glass"
                    value={editing.ownerName}
                    onChange={(e) => setEditing({ ...editing, ownerName: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-soft">Email (логин)</label>
                    <input
                      className="input-glass"
                      type="email"
                      value={editing.ownerEmail}
                      onChange={(e) => setEditing({ ...editing, ownerEmail: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label-soft">Телефон</label>
                    <input
                      className="input-glass"
                      value={editing.ownerPhone}
                      onChange={(e) => setEditing({ ...editing, ownerPhone: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="label-soft">Новый пароль</label>
                  <input
                    className="input-glass"
                    type="text"
                    placeholder="Оставьте пустым, чтобы не менять"
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                  />
                </div>

                <div className="text-[11px] text-muted">
                  Создан: {format(new Date(editing.createdAt), 'd MMMM yyyy', { locale: ru })}
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setEditing(null)} className="btn-ghost">Отмена</button>
                <button onClick={() => save(editing)} disabled={busy} className="btn-gold disabled:opacity-60">
                  {busy ? 'Сохраняем…' : 'Сохранить'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create modal */}
      <AnimatePresence>
        {creating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCreating(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-gold w-full max-w-md rounded-3xl p-8"
            >
              <h2 className="font-display text-xl font-bold">Новый клиент</h2>
              <p className="text-xs text-muted">Создаст учётную запись и бизнес-аккаунт.</p>
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-soft">Имя контактного лица</label>
                    <input className="input-glass" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="label-soft">Телефон</label>
                    <input className="input-glass" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-soft">Email (логин)</label>
                    <input className="input-glass" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div>
                    <label className="label-soft">Пароль</label>
                    <input className="input-glass" type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="label-soft">Название бизнеса</label>
                  <input className="input-glass" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-soft">Ниша</label>
                    <input className="input-glass" value={form.niche} onChange={(e) => setForm({ ...form, niche: e.target.value })} />
                  </div>
                  <div>
                    <label className="label-soft">Тариф</label>
                    <select className="input-glass" value={form.tariff} onChange={(e) => setForm({ ...form, tariff: e.target.value })}>
                      {TARIFFS.map((t) => (
                        <option key={t} value={t}>{tariffLabel(t)}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setCreating(false)} className="btn-ghost">Отмена</button>
                <button onClick={create} disabled={busy} className="btn-gold disabled:opacity-60">
                  {busy ? 'Создаём…' : 'Создать'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
