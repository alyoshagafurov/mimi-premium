'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { AvatarUploader } from '@/components/ui/AvatarUploader';
import { ImageUpload } from '@/components/admin/ImageUpload';

export function SettingsClient({
  user,
}: {
  user: { id: string; name: string; email: string; phone: string; avatar: string | null; jobTitle: string; bio: string; banner: string | null };
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone,
    jobTitle: user.jobTitle,
    bio: user.bio,
    password: '',
    confirm: '',
  });
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<string | null>(user.banner);

  /** Обложка сохраняется сразу — отдельно от формы. */
  const saveBanner = async (url: string | null) => {
    setBanner(url);
    const res = await fetch('/api/admin/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ banner: url }),
    });
    if (!res.ok) { toast.error('Не удалось сохранить обложку'); return; }
    toast.success(url ? 'Обложка обновлена' : 'Обложка убрана');
    router.refresh();
  };

  const onChange = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password && form.password !== form.confirm) {
      toast.error('Пароли не совпадают');
      return;
    }
    if (form.password && form.password.length < 6) {
      toast.error('Пароль минимум 6 символов');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          jobTitle: form.jobTitle,
          bio: form.bio,
          password: form.password || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success('Профиль обновлён');
      setForm({ ...form, password: '', confirm: '' });
      router.refresh();
    } catch {
      toast.error('Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <p className="text-xs uppercase tracking-[0.3em] text-muted">Раздел</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold">Настройки</h1>
        <p className="mt-1 text-sm text-muted">Профиль администратора и доступ.</p>
      </motion.div>

      <motion.form
        onSubmit={save}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="glass-gold mx-auto max-w-2xl rounded-3xl p-8"
      >
        <h2 className="font-display text-xl font-bold">Профиль</h2>
        <div className="mt-5 border-b border-white/[0.06] pb-6">
          <label className="label-soft">Фото профиля</label>
          <div className="mt-2"><AvatarUploader name={user.name} avatar={user.avatar} /></div>

          <div className="mt-6">
            <label className="label-soft">Обложка профиля</label>
            {banner && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={banner} alt="" className="mt-2 h-28 w-full rounded-2xl object-cover" />
            )}
            <div className="mt-2 flex items-center gap-3">
              <ImageUpload label="" value={banner} onChange={saveBanner} />
              {banner && (
                <button type="button" onClick={() => saveBanner(null)} className="text-[11px] uppercase tracking-[0.14em] text-light/40 hover:text-rose-400">
                  Убрать
                </button>
              )}
            </div>
            <p className="mt-2 text-[11px] text-light/40">
              Необязательно. Широкая картинка — она встанет фоном сверху профиля.
            </p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="label-soft">Имя</label>
            <input required className="input-glass" value={form.name} onChange={onChange('name')} />
          </div>
          <div>
            <label className="label-soft">Email</label>
            <input type="email" required className="input-glass" value={form.email} onChange={onChange('email')} />
          </div>
          <div className="md:col-span-2">
            <label className="label-soft">Телефон</label>
            <input className="input-glass" value={form.phone} onChange={onChange('phone')} />
          </div>
          <div>
            <label className="label-soft">Должность</label>
            <input className="input-glass" value={form.jobTitle} onChange={onChange('jobTitle')} placeholder="Например: старший видеограф" />
          </div>
          <div className="sm:col-span-2">
            <label className="label-soft">О себе</label>
            <textarea
              className="input-glass min-h-[90px]"
              value={form.bio}
              onChange={onChange('bio')}
              placeholder="Пара слов о себе — это увидят коллеги в профиле."
            />
          </div>
        </div>

        <h2 className="mt-8 font-display text-xl font-bold">Новый пароль</h2>
        <p className="text-xs text-muted">Оставьте пустым, если не хотите менять.</p>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="label-soft">Пароль</label>
            <input type="password" className="input-glass" value={form.password} onChange={onChange('password')} placeholder="••••••••" />
          </div>
          <div>
            <label className="label-soft">Подтверждение</label>
            <input type="password" className="input-glass" value={form.confirm} onChange={onChange('confirm')} placeholder="••••••••" />
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button type="submit" disabled={saving} className="btn-gold disabled:opacity-60">
            {saving ? 'Сохраняем...' : 'Сохранить'}
          </button>
        </div>
      </motion.form>
    </div>
  );
}
