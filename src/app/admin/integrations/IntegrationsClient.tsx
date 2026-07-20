'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/admin/PageHeader';

type Account = {
  id: string;
  clientId: string;
  clientName: string;
  pageId: string;
  pageName: string;
  adAccountId: string;
  hasToken: boolean;
  connectedAt: string | null;
};

export function IntegrationsClient({
  clients,
  accounts,
  webhookUrl,
  verifyToken,
}: {
  clients: { id: string; businessName: string }[];
  accounts: Account[];
  webhookUrl: string;
  verifyToken: string;
}) {
  const router = useRouter();
  const [clientId, setClientId] = useState('');
  const [pageId, setPageId] = useState('');
  const [pageName, setPageName] = useState('');
  const [adAccountId, setAdAccountId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const syncNow = async () => {
    setSyncing(true);
    try {
      const r = await fetch('/api/facebook/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const d = await r.json();
      if (!r.ok) throw new Error();
      toast.success(`Синхронизировано: ${d.accounts} аккаунтов, ${d.daysSynced} дней`);
      router.refresh();
    } catch {
      toast.error('Не удалось синхронизировать');
    } finally {
      setSyncing(false);
    }
  };

  const save = async () => {
    if (!clientId) {
      toast.error('Выберите клиента');
      return;
    }
    setSaving(true);
    try {
      const r = await fetch('/api/facebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, pageId, pageName, adAccountId, accessToken: accessToken || undefined }),
      });
      if (!r.ok) throw new Error('save');
      toast.success('Интеграция сохранена');
      setPageId('');
      setPageName('');
      setAdAccountId('');
      setAccessToken('');
      router.refresh();
    } catch {
      toast.error('Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Integrations"
        title={<>Интеграции</>}
        subtitle="Facebook Lead Ads — автоматический импорт лидов и метрик в кабинет клиента."
      />

      <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5 lg:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500/15 text-sky-300">f</span>
            <h2 className="font-display text-lg font-bold text-light">Facebook / Instagram</h2>
          </div>
          <button onClick={syncNow} disabled={syncing} className="btn-ghost !py-2 !text-[11px] disabled:opacity-50">
            {syncing ? 'Синхронизация…' : 'Синхронизировать метрики'}
          </button>
        </div>
        <p className="mt-2 text-sm text-light/55">
          Всё уже настроено на стороне сайта. Осталось создать токен в Meta и вставить его ниже — лиды и метрики начнут приходить автоматически.
        </p>

        <ol className="mt-5 space-y-4 text-sm">
          <li>
            <span className="text-[10px] uppercase tracking-[0.18em] text-brand-orange">Шаг 1 · Webhook в Meta App</span>
            <p className="mt-1 text-light/60">Webhooks → Page → Callback URL:</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <code className="block break-all rounded-xl border border-white/[0.06] bg-ink2/40 px-3 py-2 font-mono text-[12px] text-brand-lime">
                {webhookUrl}
              </code>
              <button
                onClick={() => { navigator.clipboard.writeText(webhookUrl); toast.success('Скопировано'); }}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] text-light/55 hover:text-brand-lime"
              >
                Копировать
              </button>
            </div>
          </li>

          <li>
            <span className="text-[10px] uppercase tracking-[0.18em] text-brand-orange">Шаг 2 · Verify Token</span>
            {verifyToken ? (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <code className="rounded-xl border border-white/[0.06] bg-ink2/40 px-3 py-2 font-mono text-[12px] text-brand-lime">{verifyToken}</code>
                <button
                  onClick={() => { navigator.clipboard.writeText(verifyToken); toast.success('Скопировано'); }}
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] text-light/55 hover:text-brand-lime"
                >
                  Копировать
                </button>
                <span className="text-[11px] text-light/45">вставьте это в поле «Verify Token» в Meta</span>
              </div>
            ) : (
              <p className="mt-2 rounded-xl border border-brand-orange/30 bg-brand-orange/[0.06] px-3 py-2 text-[12px] text-brand-orange">
                Не задан. Добавьте переменную <code className="font-mono">FB_VERIFY_TOKEN</code> в Vercel (любая строка, например <code className="font-mono">mimi_fb_2026</code>) и нажмите Redeploy.
              </p>
            )}
            <p className="mt-2 text-[11px] text-light/45">Подписаться на поле: <code className="font-mono text-light/70">leadgen</code></p>
          </li>

          <li>
            <span className="text-[10px] uppercase tracking-[0.18em] text-brand-orange">Шаг 3 · Права для токена</span>
            <p className="mt-1 font-mono text-[11px] leading-relaxed text-light/60">
              leads_retrieval · pages_show_list · pages_read_engagement · pages_manage_metadata · ads_read
            </p>
          </li>

          <li>
            <span className="text-[10px] uppercase tracking-[0.18em] text-brand-orange">Шаг 4 · Вставить сюда</span>
            <p className="mt-1 text-light/60">Ниже выберите клиента и вставьте Page ID, Ad Account ID и Access Token.</p>
          </li>
        </ol>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6">
          <h3 className="font-display text-lg font-bold text-light">Подключить аккаунт</h3>
          <div className="mt-4 space-y-3">
            <select className="input-glass" value={clientId} onChange={(e) => setClientId(e.target.value)}>
              <option value="">Выберите клиента</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.businessName}
                </option>
              ))}
            </select>
            <input className="input-glass" placeholder="Page ID" value={pageId} onChange={(e) => setPageId(e.target.value)} />
            <input className="input-glass" placeholder="Page name" value={pageName} onChange={(e) => setPageName(e.target.value)} />
            <input className="input-glass" placeholder="Ad Account ID (act_…)" value={adAccountId} onChange={(e) => setAdAccountId(e.target.value)} />
            <input
              type="password"
              className="input-glass"
              placeholder="Access Token (Page-level, long-lived)"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
            />
          </div>
          <button onClick={save} disabled={saving} className="btn-lime mt-5 w-full disabled:opacity-60">
            {saving ? 'Сохраняем...' : 'Подключить'}
          </button>
        </div>

        <div className="space-y-3">
          <p className="text-[10px] uppercase tracking-[0.18em] text-light/45">Подключённые аккаунты</p>
          {accounts.length === 0 && (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 text-center text-sm text-light/45">
              Пока нет подключений.
            </div>
          )}
          {accounts.map((a) => (
            <div key={a.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-display text-base font-bold text-light">{a.clientName}</div>
                  <div className="mt-1 text-[12px] text-light/55">{a.pageName || a.pageId || '—'}</div>
                  {a.adAccountId && <div className="text-[11px] text-light/45">Ad: {a.adAccountId}</div>}
                </div>
                <span
                  className={`rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${
                    a.hasToken ? 'border-brand-lime/30 bg-brand-lime/[0.06] text-brand-lime' : 'border-white/10 bg-white/[0.03] text-light/40'
                  }`}
                >
                  {a.hasToken ? 'активно' : 'без токена'}
                </span>
              </div>
              {a.connectedAt && (
                <div className="mt-2 text-[11px] text-light/40">Подключено: {new Date(a.connectedAt).toLocaleDateString('ru-RU')}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
