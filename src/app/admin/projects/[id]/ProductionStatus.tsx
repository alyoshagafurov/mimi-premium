'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  PRODUCTION, ROLE_LABEL, WORK_STATUSES, canEditProduction,
  type ProductionKind, type WorkStatus,
} from '@/lib/roles';
import { cn } from '@/lib/utils';

const PILL: Record<WorkStatus, string> = {
  PLANNED: 'border-white/10 text-light/50',
  IN_PROGRESS: 'border-brand-orange/40 bg-brand-orange/10 text-brand-orange',
  DONE: 'border-brand-lime/40 bg-brand-lime/10 text-brand-lime',
};

/**
 * Per-discipline production statuses on a project. A specialist can change the
 * status they own (video → съёмка+монтаж, designer → дизайн, developer →
 * разработка); admin/ops can change all. Others see them read-only.
 */
export function ProductionStatus({
  clientId,
  role,
  initial,
}: {
  clientId: string;
  role: string;
  initial: Record<ProductionKind, WorkStatus>;
}) {
  const router = useRouter();
  const [statuses, setStatuses] = useState(initial);
  const [busy, setBusy] = useState<ProductionKind | null>(null);

  const change = async (kind: ProductionKind, status: WorkStatus) => {
    if (statuses[kind] === status) return;
    const prev = statuses[kind];
    setBusy(kind);
    setStatuses((s) => ({ ...s, [kind]: status })); // optimistic
    const res = await fetch(`/api/projects/${clientId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, status }),
    });
    setBusy(null);
    if (res.ok) {
      toast.success('Статус обновлён');
      router.refresh();
    } else {
      setStatuses((s) => ({ ...s, [kind]: prev }));
      const d = await res.json().catch(() => ({}));
      toast.error(d.error || 'Не удалось обновить');
    }
  };

  return (
    <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6">
      <p className="mb-4 text-[10px] uppercase tracking-[0.24em] text-brand-orange">Производство</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {PRODUCTION.map((p) => {
          const editable = canEditProduction(role, p.kind);
          const cur = statuses[p.kind];
          return (
            <div key={p.kind} className="rounded-2xl border border-white/[0.06] p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-light">{p.title}</span>
                <span className={cn('rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-[0.1em]', PILL[cur])}>
                  {p.labels[cur]}
                </span>
              </div>
              {editable ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {WORK_STATUSES.map((s) => (
                    <button
                      key={s}
                      disabled={busy === p.kind}
                      onClick={() => change(p.kind, s)}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-[11px] transition disabled:opacity-50',
                        cur === s
                          ? 'border-brand-lime bg-brand-lime text-[#0A0712]'
                          : 'border-white/10 text-light/55 hover:border-brand-lime/40 hover:text-light',
                      )}
                    >
                      {p.labels[s]}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-[11px] text-light/40">
                  Меняет: {p.ownerRoles.map((r) => ROLE_LABEL[r]).join(' / ')}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
