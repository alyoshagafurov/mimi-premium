'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { StatusPill } from '@/components/ui/StatusPill';
import { PageHeader } from '@/components/admin/PageHeader';
import { formatInt, formatPct, formatRub } from '@/lib/utils';

type Row = {
  id: string;
  name: string;
  platform: string;
  budget: number;
  spent: number;
  leads: number;
  sales: number;
  romi: number;
  status: string;
  clientId: string;
  clientName: string;
};

export function CampaignsClient({
  campaigns,
  clients,
}: {
  campaigns: Row[];
  clients: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [clientFilter, setClientFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const filtered = useMemo(() => {
    return campaigns.filter(
      (c) =>
        (!clientFilter || c.clientId === clientFilter) &&
        (!statusFilter || c.status === statusFilter),
    );
  }, [campaigns, clientFilter, statusFilter]);

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/campaigns/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      toast.success('Статус обновлён');
      router.refresh();
    } else toast.error('Не удалось обновить');
  };

  const scale = async (id: string, current: number) => {
    const res = await fetch(`/api/campaigns/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ budget: Math.round(current * 1.5), status: 'SCALING' }),
    });
    if (res.ok) {
      toast.success('Бюджет ×1.5, кампания в режиме масштабирования');
      router.refresh();
    } else toast.error('Ошибка');
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Campaigns"
        title={<>Все <span className="text-lime-grad">кампании.</span></>}
        subtitle="Управление платными каналами клиентов в одном представлении."
      />

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          className="input-glass max-w-xs"
        >
          <option value="">Все клиенты</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id} className="bg-surface">{c.name}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-glass max-w-xs"
        >
          <option value="">Все статусы</option>
          <option value="ACTIVE" className="bg-surface">Активна</option>
          <option value="PAUSED" className="bg-surface">Пауза</option>
          <option value="SCALING" className="bg-surface">Масштабируем</option>
          <option value="ARCHIVED" className="bg-surface">Архив</option>
        </select>
        <span className="chip-lime ml-auto">{filtered.length} кампаний</span>
      </div>

      <div className="glass overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-white/[0.02] text-[10px] uppercase tracking-[0.16em] text-muted">
              <tr>
                <th className="px-4 py-3 text-left">Кампания</th>
                <th className="px-4 py-3 text-left">Клиент</th>
                <th className="px-4 py-3 text-right">Бюджет</th>
                <th className="px-4 py-3 text-right">Потрачено</th>
                <th className="px-4 py-3 text-right">Лиды</th>
                <th className="px-4 py-3 text-right">Продажи</th>
                <th className="px-4 py-3 text-right">ROMI</th>
                <th className="px-4 py-3 text-left">Статус</th>
                <th className="px-4 py-3 text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const pct = c.budget > 0 ? Math.min(100, (c.spent / c.budget) * 100) : 0;
                return (
                  <tr key={c.id} className="border-t border-white/5 transition hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <div className="font-medium text-light">{c.name}</div>
                      <div className="text-[11px] text-muted">{c.platform}</div>
                    </td>
                    <td className="px-4 py-3 text-muted">{c.clientName}</td>
                    <td className="px-4 py-3 text-right text-light">{formatRub(c.budget)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="text-light">{formatRub(c.spent)}</div>
                      <div className="mt-1 h-1 w-20 overflow-hidden rounded-full bg-white/5">
                        <div className="h-full bg-gold-gradient" style={{ width: `${pct}%` }} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-light">{formatInt(c.leads)}</td>
                    <td className="px-4 py-3 text-right text-light">{formatInt(c.sales)}</td>
                    <td className="px-4 py-3 text-right text-gold">{formatPct(c.romi, true)}</td>
                    <td className="px-4 py-3"><StatusPill status={c.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {c.status !== 'PAUSED' && (
                          <button
                            onClick={() => updateStatus(c.id, 'PAUSED')}
                            className="rounded-md border border-white/10 px-2 py-1 text-[10px] text-muted transition hover:border-yellow-500/50 hover:text-yellow-300"
                          >
                            Пауза
                          </button>
                        )}
                        {c.status !== 'ACTIVE' && (
                          <button
                            onClick={() => updateStatus(c.id, 'ACTIVE')}
                            className="rounded-md border border-white/10 px-2 py-1 text-[10px] text-muted transition hover:border-emerald-500/50 hover:text-emerald-300"
                          >
                            Запустить
                          </button>
                        )}
                        <button
                          onClick={() => scale(c.id, c.budget)}
                          className="rounded-md border border-white/10 px-2 py-1 text-[10px] text-muted transition hover:border-gold/50 hover:text-gold"
                        >
                          Масштаб ×1.5
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!filtered.length && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-sm text-muted">Кампаний по фильтру нет</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
