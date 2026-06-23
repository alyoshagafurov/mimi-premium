'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/admin/PageHeader';

type Item = { title: string; offsetDays: number; priority: 'LOW' | 'MEDIUM' | 'HIGH' };
type Template = {
  id: string;
  name: string;
  description: string;
  items: { id: string; title: string; offsetDays: number; priority: string }[];
};

export function TemplatesClient({ templates }: { templates: Template[] }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<Item[]>([{ title: '', offsetDays: 0, priority: 'MEDIUM' }]);

  const addItem = () => setItems([...items, { title: '', offsetDays: 0, priority: 'MEDIUM' }]);
  const updateItem = (i: number, patch: Partial<Item>) =>
    setItems(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));

  const save = async () => {
    if (!name) {
      toast.error('Введите название шаблона');
      return;
    }
    const cleaned = items.filter((it) => it.title.trim());
    if (cleaned.length === 0) {
      toast.error('Добавьте хотя бы одну задачу');
      return;
    }
    const r = await fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, items: cleaned }),
    });
    if (!r.ok) {
      toast.error('Не удалось сохранить');
      return;
    }
    toast.success('Шаблон создан');
    setName('');
    setDescription('');
    setItems([{ title: '', offsetDays: 0, priority: 'MEDIUM' }]);
    router.refresh();
  };

  const remove = async (id: string) => {
    if (!confirm('Удалить шаблон?')) return;
    await fetch(`/api/templates/${id}`, { method: 'DELETE' });
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Templates"
        title={<>Шаблоны задач</>}
        subtitle="Готовые чек-листы для новых клиентов. Один клик — десятки задач созданы."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6">
          <h3 className="font-display text-lg font-bold text-light">Новый шаблон</h3>
          <div className="mt-4 space-y-3">
            <input className="input-glass" placeholder="Название (Новый PRO клиент)" value={name} onChange={(e) => setName(e.target.value)} />
            <textarea className="input-glass min-h-[60px]" placeholder="Описание" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="mt-5">
            <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-light/45">Задачи</p>
            <div className="space-y-2">
              {items.map((it, i) => (
                <div key={i} className="grid grid-cols-[1fr_70px_90px_30px] gap-2">
                  <input className="input-glass !py-2" placeholder="Задача" value={it.title} onChange={(e) => updateItem(i, { title: e.target.value })} />
                  <input className="input-glass !py-2" type="number" placeholder="дней" value={it.offsetDays} onChange={(e) => updateItem(i, { offsetDays: parseInt(e.target.value || '0') })} />
                  <select className="input-glass !py-2" value={it.priority} onChange={(e) => updateItem(i, { priority: e.target.value as Item['priority'] })}>
                    <option value="LOW">Низкий</option>
                    <option value="MEDIUM">Средний</option>
                    <option value="HIGH">Высокий</option>
                  </select>
                  <button onClick={() => removeItem(i)} className="text-light/40 hover:text-rose-400">×</button>
                </div>
              ))}
            </div>
            <button onClick={addItem} className="mt-2 text-[11px] uppercase tracking-[0.15em] text-brand-lime hover:text-brand-limeSoft">
              + Задача
            </button>
          </div>

          <button onClick={save} className="btn-lime mt-5 w-full">Сохранить шаблон</button>
        </div>

        <div className="space-y-3">
          <p className="text-[10px] uppercase tracking-[0.18em] text-light/45">Существующие</p>
          {templates.length === 0 && (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 text-center text-sm text-light/45">
              Пока нет шаблонов.
            </div>
          )}
          {templates.map((t) => (
            <div key={t.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-display text-base font-bold text-light">{t.name}</div>
                  {t.description && <div className="mt-1 text-[12px] text-light/55">{t.description}</div>}
                  <div className="mt-2 text-[11px] text-brand-orange">{t.items.length} задач</div>
                </div>
                <button onClick={() => remove(t.id)} className="text-[11px] uppercase text-light/40 hover:text-rose-400">
                  удалить
                </button>
              </div>
              <ul className="mt-3 space-y-1">
                {t.items.slice(0, 5).map((it) => (
                  <li key={it.id} className="text-[12px] text-light/65">
                    · {it.title} <span className="text-light/35">(+{it.offsetDays} д.)</span>
                  </li>
                ))}
                {t.items.length > 5 && (
                  <li className="text-[11px] text-light/40">+ ещё {t.items.length - 5}</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
