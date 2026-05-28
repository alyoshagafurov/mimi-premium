'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { formatInt, formatPct, formatRub } from '@/lib/utils';

type Row = {
  id: string;
  clientId: string;
  clientName: string;
  date: string;
  clicks: number;
  leads: number;
  qualified: number;
  sales: number;
  spent: number;
  revenue: number;
  romi: number;
};

export function MetricsClient({
  metrics,
  clients,
}: {
  metrics: Row[];
  clients: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    clientId: clients[0]?.id ?? '',
    date: new Date().toISOString().slice(0, 10),
    clicks: '',
    leads: '',
    qualified: '',
    sales: '',
    spent: '',
    revenue: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const onChange = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const spent = Number(form.spent) || 0;
  const revenue = Number(form.revenue) || 0;
  const previewRomi = spent > 0 ? Math.round(((revenue - spent) / spent) * 100) : 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientId || !form.date) {
      toast.error('Выберите клиента и дату');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: form.clientId,
          date: form.date,
          clicks: Number(form.clicks) || 0,
          leads: Number(form.leads) || 0,
          qualified: Number(form.qualified) || 0,
          sales: Number(form.sales) || 0,
          spent,
          revenue,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success('Метрика добавлена');
      setForm({ ...form, clicks: '', leads: '', qualified: '', sales: '', spent: '', revenue: '' });
      router.refresh();
    } catch {
      toast.error('Ошибка');
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Удалить запись?')) return;
    const res = await fetch(`/api/metrics/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Удалено');
      router.refresh();
    } else toast.error('Не удалось');
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <p className="text-xs uppercase tracking-[0.3em] text-muted">Раздел</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold">Метрики</h1>
        <p className="mt-1 text-sm text-muted">Заполняйте показатели — клиент увидит цифры в своём кабинете.</p>
      </motion.div>

      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="glass-gold rounded-2xl p-6"
      >
        <h2 className="font-display text-lg font-bold">Новая запись</h2>
        <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="col-span-2 md:col-span-2">
            <label className="label-soft">Клиент</label>
            <select required value={form.clientId} onChange={onChange('clientId')} className="input-glass">
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2 md:col-span-2">
            <label className="label-soft">Дата</label>
            <input type="date" required value={form.date} onChange={onChange('date')} className="input-glass" />
          </div>
          <div>
            <label className="label-soft">Клики</label>
            <input type="number" min={0} value={form.clicks} onChange={onChange('clicks')} className="input-glass" />
          </div>
          <div>
            <label className="label-soft">Лиды</label>
            <input type="number" min={0} value={form.leads} onChange={onChange('leads')} className="input-glass" />
          </div>
          <div>
            <label className="label-soft">Квалифиц.</label>
            <input type="number" min={0} value={form.qualified} onChange={onChange('qualified')} className="input-glass" />
          </div>
          <div>
            <label className="label-soft">Продажи</label>
            <input type="number" min={0} value={form.sales} onChange={onChange('sales')} className="input-glass" />
          </div>
          <div>
            <label className="label-soft">Затраты, ₽</label>
            <input type="number" min={0} value={form.spent} onChange={onChange('spent')} className="input-glass" />
          </div>
          <div>
            <label className="label-soft">Доход, ₽</label>
            <input type="number" min={0} value={form.revenue} onChange={onChange('revenue')} className="input-glass" />
          </div>
          <div className="col-span-2 md:col-span-2 flex items-end">
            <div className="flex w-full items-center justify-between rounded-xl border border-gold/30 bg-gold/5 px-4 py-3">
              <span className="text-[11px] uppercase tracking-[0.18em] text-muted">ROMI</span>
              <span className="font-display text-xl font-bold text-gold-grad">{formatPct(previewRomi, true)}</span>
            </div>
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <button type="submit" disabled={submitting} className="btn-gold disabled:opacity-60">
            {submitting ? 'Добавляем...' : 'Добавить запись'}
          </button>
        </div>
      </motion.form>

      <div className="glass overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-sm">
            <thead className="bg-white/[0.02] text-[10px] uppercase tracking-[0.16em] text-muted">
              <tr>
                <th className="px-4 py-3 text-left">Дата</th>
                <th className="px-4 py-3 text-left">Клиент</th>
                <th className="px-4 py-3 text-right">Клики</th>
                <th className="px-4 py-3 text-right">Лиды</th>
                <th className="px-4 py-3 text-right">Квалифиц.</th>
                <th className="px-4 py-3 text-right">Продажи</th>
                <th className="px-4 py-3 text-right">Затраты</th>
                <th className="px-4 py-3 text-right">Доход</th>
                <th className="px-4 py-3 text-right">ROMI</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => (
                <tr key={m.id} className="border-t border-white/5 transition hover:bg-white/[0.02]">
                  <td className="px-4 py-2.5 text-muted">{format(new Date(m.date), 'd MMM yyyy', { locale: ru })}</td>
                  <td className="px-4 py-2.5 text-light">{m.clientName}</td>
                  <td className="px-4 py-2.5 text-right text-light">{formatInt(m.clicks)}</td>
                  <td className="px-4 py-2.5 text-right text-light">{formatInt(m.leads)}</td>
                  <td className="px-4 py-2.5 text-right text-light">{formatInt(m.qualified)}</td>
                  <td className="px-4 py-2.5 text-right text-light">{formatInt(m.sales)}</td>
                  <td className="px-4 py-2.5 text-right text-muted">{formatRub(m.spent)}</td>
                  <td className="px-4 py-2.5 text-right text-light">{formatRub(m.revenue)}</td>
                  <td className="px-4 py-2.5 text-right text-gold">{formatPct(m.romi, true)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => remove(m.id)}
                      className="rounded-md border border-white/10 px-2 py-1 text-[10px] text-muted transition hover:border-red-500/50 hover:text-red-400"
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
              {!metrics.length && (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-sm text-muted">Метрик пока нет</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
