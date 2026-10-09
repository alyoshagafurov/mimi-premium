'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/admin/PageHeader';
import { cn } from '@/lib/utils';
import { LEAD_SOURCE_LABEL, SALES_STATUS_LABEL, type LeadSource, type SalesStatus } from '@/lib/roles';

/** Список обновляется опросом — живого канала в проекте нет. */
const POLL_MS = 15_000;

type Convo = {
  id: string;
  phone: string;
  name: string;
  lastText: string;
  lastMessageAt: string | null;
  unread: number;
  clientId: string | null;
  businessName: string | null;
  salesStatus: SalesStatus | null;
  sourceType: LeadSource | null;
  sourceConfirmed: boolean;
};

type Message = {
  id: string;
  direction: 'IN' | 'OUT';
  type: string;
  body: string;
  mediaId: string | null;
  mediaMime: string | null;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  error: string | null;
  sentAt: string;
  senderName: string | null;
};

type ThreadClient = {
  id: string;
  contactName: string;
  businessName: string;
  niche: string;
  salesStatus: SalesStatus;
  packageType: string;
  sourceType: LeadSource;
  sourceCampaign: string | null;
  sourceAdName: string | null;
  sourceRefCode: string | null;
  sourceClickId: string | null;
  sourceUrl: string | null;
  sourceNote: string | null;
  sourceConfirmed: boolean;
  firstContactAt: string;
  assignees: string[];
  history: { id: string; body: string; author: string; createdAt: string }[];
};

type Thread = {
  id: string;
  phone: string;
  profileName: string | null;
  canReply: boolean;
  lastInboundAt: string | null;
  messages: Message[];
  client: ThreadClient | null;
};

type TrackLink = {
  id: string;
  code: string;
  label: string;
  source: string;
  campaign: string | null;
  adName: string | null;
  postUrl: string | null;
  clicks: number;
  leads: number;
  active: boolean;
  shortUrl: string;
  waUrl: string;
  text: string;
};

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

const fmtWhen = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay ? fmtTime(iso) : d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
};

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/** Галочки доставки — как в самом WhatsApp. */
function StatusMark({ status, error }: { status: Message['status']; error: string | null }) {
  if (status === 'FAILED') return <span title={error ?? 'Не доставлено'} className="text-rose-300">✕</span>;
  if (status === 'READ') return <span title="Прочитано" className="text-brand-lime">✓✓</span>;
  if (status === 'DELIVERED') return <span title="Доставлено">✓✓</span>;
  if (status === 'SENT') return <span title="Отправлено">✓</span>;
  return <span title="Отправляется">⏳</span>;
}

/**
 * Вложение из WhatsApp. Файл отдаётся через наш прокси, и он может не открыться:
 * токен не настроен или ссылка у Meta уже протухла. Тогда вместо битой картинки
 * показываем понятную строку.
 */
function Attachment({ mediaId, mime, type }: { mediaId: string; mime: string | null; type: string }) {
  const [failed, setFailed] = useState(false);
  const href = `/api/whatsapp/media/${mediaId}`;

  if (failed) {
    return <p className="mt-1 text-[12px] text-light/40">Вложение ({type}) не загрузилось — проверьте настройку WhatsApp.</p>;
  }
  if (mime?.startsWith('image/')) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={href}
        alt="Вложение из WhatsApp"
        onError={() => setFailed(true)}
        className="mt-2 max-h-64 rounded-xl object-cover"
      />
    );
  }
  return (
    <a href={href} target="_blank" rel="noreferrer" className="mt-1 inline-flex text-[12px] text-brand-lime hover:underline">
      Вложение ({type}) — открыть
    </a>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-white/[0.05] py-2.5 last:border-0 sm:flex-row sm:gap-3">
      <span className="w-32 shrink-0 text-[10px] uppercase tracking-[0.16em] text-light/40">{label}</span>
      <span className="min-w-0 break-words text-[13px] text-light/85">{value || '—'}</span>
    </div>
  );
}

export function WhatsAppClient({ missingEnv }: { missingEnv: string[] }) {
  const [tab, setTab] = useState<'chats' | 'links'>('chats');

  /* ── Диалоги ── */
  const [convos, setConvos] = useState<Convo[]>([]);
  const [listLoaded, setListLoaded] = useState(false);
  const [sendEnabled, setSendEnabled] = useState(false);
  const [q, setQ] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [thread, setThread] = useState<Thread | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const loadList = useCallback(async () => {
    const r = await fetch('/api/whatsapp/conversations', { cache: 'no-store' }).catch(() => null);
    if (!r?.ok) return;
    const d = await r.json();
    setConvos(d.items ?? []);
    setSendEnabled(!!d.sendEnabled);
    setListLoaded(true);
  }, []);

  const loadThread = useCallback(async (id: string) => {
    const r = await fetch(`/api/whatsapp/conversations/${id}`, { cache: 'no-store' }).catch(() => null);
    if (!r?.ok) return;
    setThread(await r.json());
  }, []);

  const openConvo = async (id: string) => {
    setActiveId(id);
    setThread(null);
    await loadThread(id);
    // Отмечаем прочитанным и сразу убираем счётчик в списке.
    fetch(`/api/whatsapp/conversations/${id}`, { method: 'PATCH' }).catch(() => {});
    setConvos((cur) => cur.map((c) => (c.id === id ? { ...c, unread: 0 } : c)));
  };

  useEffect(() => {
    loadList();
  }, [loadList]);

  // Новые сообщения подхватываются без перезагрузки страницы.
  useEffect(() => {
    const t = setInterval(() => {
      loadList();
      if (activeId) loadThread(activeId);
    }, POLL_MS);
    return () => clearInterval(t);
  }, [activeId, loadList, loadThread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [thread?.messages.length, thread?.id]);

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return convos;
    return convos.filter((c) =>
      [c.name, c.phone, c.businessName ?? '', c.lastText].join(' ').toLowerCase().includes(needle),
    );
  }, [convos, q]);

  const unreadTotal = convos.reduce((s, c) => s + c.unread, 0);

  const send = async () => {
    const text = draft.trim();
    if (!text || !activeId || sending) return;
    setSending(true);
    const r = await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: activeId, text }),
    }).catch(() => null);
    const d = await r?.json().catch(() => ({}));
    setSending(false);
    if (!r?.ok) {
      toast.error(d?.error || 'Не удалось отправить');
      return;
    }
    setDraft('');
    setThread((cur) => (cur ? { ...cur, messages: [...cur.messages, d as Message] } : cur));
    loadList();
  };

  /* ── Ссылки для публикаций ── */
  const [links, setLinks] = useState<TrackLink[]>([]);
  const [linksLoaded, setLinksLoaded] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ label: '', source: 'INSTAGRAM', campaign: '', adName: '', postUrl: '', code: '' });

  const loadLinks = useCallback(async () => {
    const r = await fetch('/api/whatsapp/links', { cache: 'no-store' }).catch(() => null);
    if (!r?.ok) return;
    const d = await r.json();
    setLinks(d.items ?? []);
    setLinksLoaded(true);
  }, []);

  useEffect(() => {
    if (tab === 'links' && !linksLoaded) loadLinks();
  }, [tab, linksLoaded, loadLinks]);

  const createLink = async () => {
    if (!form.label.trim() || creating) return;
    setCreating(true);
    const r = await fetch('/api/whatsapp/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    }).catch(() => null);
    const d = await r?.json().catch(() => ({}));
    setCreating(false);
    if (!r?.ok) return toast.error(d?.error || 'Не удалось создать ссылку');
    toast.success('Ссылка готова');
    setForm({ label: '', source: 'INSTAGRAM', campaign: '', adName: '', postUrl: '', code: '' });
    setLinks((cur) => [d as TrackLink, ...cur]);
  };

  const toggleLink = async (l: TrackLink) => {
    setLinks((cur) => cur.map((x) => (x.id === l.id ? { ...x, active: !x.active } : x)));
    const r = await fetch(`/api/whatsapp/links/${l.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !l.active }),
    }).catch(() => null);
    if (!r?.ok) {
      setLinks((cur) => cur.map((x) => (x.id === l.id ? { ...x, active: l.active } : x)));
      toast.error('Не удалось изменить');
    }
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Скопировано');
    } catch {
      toast.error('Браузер не дал скопировать — выделите вручную');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="WhatsApp"
        title={<>Переписка</>}
        subtitle="Входящие из WhatsApp, ответы из CRM и источник каждого обращения."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab('chats')}
              className={cn(
                'rounded-full border px-4 py-2 text-[11px] uppercase tracking-[0.14em] transition',
                tab === 'chats' ? 'border-brand-lime bg-brand-lime text-[#0A0712]' : 'border-white/10 text-light/55 hover:text-light',
              )}
            >
              Диалоги{unreadTotal > 0 ? ` · ${unreadTotal}` : ''}
            </button>
            <button
              onClick={() => setTab('links')}
              className={cn(
                'rounded-full border px-4 py-2 text-[11px] uppercase tracking-[0.14em] transition',
                tab === 'links' ? 'border-brand-lime bg-brand-lime text-[#0A0712]' : 'border-white/10 text-light/55 hover:text-light',
              )}
            >
              Ссылки
            </button>
          </div>
        }
      />

      {missingEnv.length > 0 && (
        <div className="rounded-3xl border border-brand-orange/30 bg-brand-orange/[0.06] p-5">
          <p className="text-[10px] uppercase tracking-[0.24em] text-brand-orange">Интеграция ещё не настроена</p>
          <p className="mt-2 text-sm text-light/75">
            Не заданы переменные: <span className="font-mono text-brand-orange">{missingEnv.join(', ')}</span>. Пока
            их нет, сообщения не приходят и не отправляются. Пошаговая настройка — в файле{' '}
            <span className="font-mono">WHATSAPP_SETUP.md</span> в репозитории.
          </p>
        </div>
      )}

      {tab === 'chats' ? (
        <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
          {/* ── Список диалогов ── */}
          <div className={cn('rounded-3xl border border-white/[0.06] bg-white/[0.02] p-3', activeId && 'hidden lg:block')}>
            <input
              placeholder="Поиск по имени, телефону, тексту…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="input-glass !py-2 !text-[13px]"
            />
            <div className="mt-3 max-h-[70vh] space-y-1.5 overflow-y-auto pr-1">
              {!listLoaded && <p className="px-2 py-4 text-[12px] text-light/35">Загружаем…</p>}
              {listLoaded && visible.length === 0 && (
                <p className="px-2 py-4 text-[12px] text-light/35">
                  {convos.length ? 'Ничего не найдено.' : 'Пока ни одного диалога.'}
                </p>
              )}
              {visible.map((c) => (
                <button
                  key={c.id}
                  onClick={() => openConvo(c.id)}
                  className={cn(
                    'block w-full rounded-2xl border p-3 text-left transition-colors',
                    activeId === c.id
                      ? 'border-brand-lime/50 bg-brand-lime/[0.06]'
                      : 'border-white/[0.06] bg-ink/40 hover:border-brand-lime/30',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-light">{c.name}</span>
                    <span className="shrink-0 text-[10px] text-light/35">{fmtWhen(c.lastMessageAt)}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="truncate text-[12px] text-light/50">{c.lastText || '—'}</span>
                    {c.unread > 0 && (
                      <span className="shrink-0 rounded-full bg-brand-lime px-1.5 py-0.5 text-[10px] font-bold text-[#0A0712]">
                        {c.unread}
                      </span>
                    )}
                  </div>
                  {c.sourceType && (
                    <span className="mt-2 inline-block rounded-full border border-white/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] text-light/45">
                      {LEAD_SOURCE_LABEL[c.sourceType] ?? c.sourceType}
                      {!c.sourceConfirmed && ' · не подтв.'}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── Переписка + карточка клиента ── */}
          <div className={cn('space-y-4', !activeId && 'hidden lg:block')}>
            {!activeId ? (
              <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-10 text-center text-[13px] text-light/40">
                Выберите диалог слева.
              </div>
            ) : !thread ? (
              <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-10 text-center text-[13px] text-light/40">
                Загружаем переписку…
              </div>
            ) : (
              <>
                <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5">
                  <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] pb-3">
                    <button
                      onClick={() => { setActiveId(null); setThread(null); }}
                      className="text-[12px] text-light/45 hover:text-brand-lime lg:hidden"
                    >
                      ← Диалоги
                    </button>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-light">
                        {thread.client?.contactName || thread.profileName || thread.phone}
                      </div>
                      <a href={`tel:${thread.phone}`} className="font-mono text-[12px] text-brand-lime">{thread.phone}</a>
                    </div>
                    {thread.client && (
                      <Link
                        href={`/admin/sales/${thread.client.id}`}
                        className="ml-auto text-[11px] uppercase tracking-[0.14em] text-light/50 hover:text-brand-lime"
                      >
                        Карточка лида →
                      </Link>
                    )}
                  </div>

                  <div className="mt-4 max-h-[52vh] space-y-2.5 overflow-y-auto pr-1">
                    {thread.messages.length === 0 && (
                      <p className="py-6 text-center text-[12px] text-light/35">Сообщений пока нет.</p>
                    )}
                    {thread.messages.map((m) => (
                      <div key={m.id} className={cn('flex', m.direction === 'OUT' ? 'justify-end' : 'justify-start')}>
                        <div
                          className={cn(
                            'max-w-[82%] rounded-2xl border px-3.5 py-2.5',
                            m.direction === 'OUT'
                              ? 'border-brand-lime/25 bg-brand-lime/[0.07]'
                              : 'border-white/[0.06] bg-white/[0.03]',
                          )}
                        >
                          {m.body && <p className="whitespace-pre-wrap break-words text-[13px] text-light/90">{m.body}</p>}
                          {m.mediaId && <Attachment mediaId={m.mediaId} mime={m.mediaMime} type={m.type} />}
                          <div className="mt-1.5 flex items-center justify-end gap-2 text-[10px] text-light/35">
                            {m.direction === 'OUT' && m.senderName && <span>{m.senderName}</span>}
                            <span>{fmtTime(m.sentAt)}</span>
                            {m.direction === 'OUT' && <StatusMark status={m.status} error={m.error} />}
                          </div>
                          {m.direction === 'OUT' && m.status === 'FAILED' && m.error && (
                            <p className="mt-1 text-[11px] text-rose-300">{m.error}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    <div ref={bottomRef} />
                  </div>

                  <div className="mt-4 border-t border-white/[0.06] pt-4">
                    {!sendEnabled ? (
                      <p className="text-[12px] text-brand-orange">
                        Отправка выключена: не заданы WHATSAPP_ACCESS_TOKEN и WHATSAPP_PHONE_NUMBER_ID.
                      </p>
                    ) : !thread.canReply ? (
                      <p className="text-[12px] text-brand-orange">
                        С последнего сообщения клиента прошло больше 24 часов. Meta разрешает писать первым только
                        одобренным шаблоном — обычный текст будет отклонён.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <textarea
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              send();
                            }
                          }}
                          rows={2}
                          placeholder="Ответ клиенту… (Enter — отправить, Shift+Enter — перенос строки)"
                          className="input-glass min-h-[52px] flex-1 !text-[13px]"
                        />
                        <button
                          onClick={send}
                          disabled={sending || !draft.trim()}
                          className="btn-lime !px-5 !text-[12px] disabled:opacity-50 sm:self-end"
                        >
                          {sending ? 'Отправляем…' : 'Отправить'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {thread.client && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
                      <p className="mb-3 text-[10px] uppercase tracking-[0.24em] text-brand-orange">Клиент</p>
                      <Row label="Имя" value={thread.client.contactName} />
                      <Row
                        label="Бизнес"
                        value={thread.client.businessName !== thread.client.contactName ? thread.client.businessName : ''}
                      />
                      <Row label="Статус" value={SALES_STATUS_LABEL[thread.client.salesStatus]} />
                      <Row label="Ответственные" value={thread.client.assignees.join(', ') || 'не назначены'} />
                      <Row label="Первое обращение" value={fmtDateTime(thread.client.firstContactAt)} />
                    </div>

                    <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
                      <p className="mb-3 text-[10px] uppercase tracking-[0.24em] text-brand-orange">Источник обращения</p>
                      <Row
                        label="Источник"
                        value={
                          <span className="flex flex-wrap items-center gap-2">
                            {LEAD_SOURCE_LABEL[thread.client.sourceType] ?? thread.client.sourceType}
                            <span
                              className={cn(
                                'rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.12em]',
                                thread.client.sourceConfirmed
                                  ? 'border-brand-lime/40 text-brand-lime'
                                  : 'border-white/15 text-light/45',
                              )}
                            >
                              {thread.client.sourceConfirmed ? 'подтверждено' : 'не подтверждено'}
                            </span>
                          </span>
                        }
                      />
                      <Row label="Кампания" value={thread.client.sourceCampaign} />
                      <Row label="Объявление / видео" value={thread.client.sourceAdName} />
                      <Row label="Метка ссылки" value={thread.client.sourceRefCode} />
                      <Row
                        label="ID клика Meta"
                        value={
                          thread.client.sourceClickId ? (
                            <span className="font-mono text-[11px]">{thread.client.sourceClickId}</span>
                          ) : (
                            ''
                          )
                        }
                      />
                      <Row
                        label="Ссылка"
                        value={
                          thread.client.sourceUrl ? (
                            <a href={thread.client.sourceUrl} target="_blank" rel="noreferrer" className="text-brand-lime hover:underline">
                              открыть источник →
                            </a>
                          ) : (
                            ''
                          )
                        }
                      />
                      <Row label="Заметка" value={thread.client.sourceNote} />
                    </div>

                    <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5 sm:col-span-2">
                      <p className="mb-3 text-[10px] uppercase tracking-[0.24em] text-brand-orange">История взаимодействий</p>
                      {thread.client.history.length === 0 ? (
                        <p className="text-[13px] text-light/40">Записей пока нет.</p>
                      ) : (
                        <div className="max-h-[260px] space-y-2 overflow-y-auto pr-1">
                          {thread.client.history.map((h) => (
                            <div key={h.id} className="rounded-2xl border border-white/[0.05] bg-white/[0.02] px-4 py-2.5">
                              <div className="mb-1 flex items-center gap-2 text-[11px] text-light/40">
                                <span className="text-light/70">{h.author}</span>
                                <span>·</span>
                                <span>{fmtDateTime(h.createdAt)}</span>
                              </div>
                              <p className="whitespace-pre-wrap text-[13px] text-light/85">{h.body}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        /* ── Ссылки с метками источника ── */
        <div className="space-y-4">
          <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
            <p className="text-[10px] uppercase tracking-[0.24em] text-brand-orange">Новая ссылка под публикацию</p>
            <p className="mt-2 max-w-3xl text-[12px] text-light/55">
              Для каждого Reels или Stories создайте свою ссылку. В предзаполненном тексте будет короткая метка — по
              ней CRM узнает, с какой публикации пришёл человек. Meta источник органических Reels не передаёт, поэтому
              это единственный достоверный способ. Клиент может стереть текст перед отправкой — тогда источник
              останется неизвестным, и мы его не угадываем.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="label-soft">Название публикации</label>
                <input
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="Reels про таргет, июль"
                  className="input-glass !text-[13px]"
                />
              </div>
              <div>
                <label className="label-soft">Источник</label>
                <select
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                  className="input-glass !text-[13px]"
                >
                  <option value="INSTAGRAM">Instagram</option>
                  <option value="INSTAGRAM_ADS">Реклама Instagram</option>
                  <option value="WEBSITE">Сайт</option>
                  <option value="TELEGRAM">Telegram</option>
                  <option value="REFERRAL">Рекомендация</option>
                  <option value="OTHER">Другое</option>
                </select>
              </div>
              <div>
                <label className="label-soft">Кампания — необязательно</label>
                <input
                  value={form.campaign}
                  onChange={(e) => setForm({ ...form, campaign: e.target.value })}
                  className="input-glass !text-[13px]"
                />
              </div>
              <div>
                <label className="label-soft">Название видео — необязательно</label>
                <input
                  value={form.adName}
                  onChange={(e) => setForm({ ...form, adName: e.target.value })}
                  className="input-glass !text-[13px]"
                />
              </div>
              <div>
                <label className="label-soft">Ссылка на публикацию — необязательно</label>
                <input
                  value={form.postUrl}
                  onChange={(e) => setForm({ ...form, postUrl: e.target.value })}
                  placeholder="https://instagram.com/reel/…"
                  className="input-glass !text-[13px]"
                />
              </div>
              <div>
                <label className="label-soft">Своя метка — необязательно</label>
                <input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="reels07"
                  className="input-glass !text-[13px]"
                />
              </div>
            </div>
            <button
              onClick={createLink}
              disabled={creating || !form.label.trim()}
              className="btn-lime mt-4 !text-[12px] disabled:opacity-50"
            >
              {creating ? 'Создаём…' : 'Создать ссылку'}
            </button>
          </div>

          <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
            <p className="mb-4 text-[10px] uppercase tracking-[0.24em] text-brand-orange">Ссылки</p>
            {!linksLoaded && <p className="text-[12px] text-light/35">Загружаем…</p>}
            {linksLoaded && links.length === 0 && <p className="text-[13px] text-light/40">Ссылок пока нет.</p>}
            <div className="space-y-3">
              {links.map((l) => (
                <div key={l.id} className={cn('rounded-2xl border border-white/[0.06] bg-ink/40 p-4', !l.active && 'opacity-55')}>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm font-medium text-light">{l.label}</span>
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] text-light/45">
                      {LEAD_SOURCE_LABEL[l.source as LeadSource] ?? l.source}
                    </span>
                    <span className="font-mono text-[11px] text-light/40">#m-{l.code}</span>
                    <div className="ml-auto flex items-center gap-3 text-[11px] text-light/50">
                      <span>переходов: <span className="font-mono text-brand-lime">{l.clicks}</span></span>
                      <span>обращений: <span className="font-mono text-brand-lime">{l.leads}</span></span>
                      <button onClick={() => toggleLink(l)} className="uppercase tracking-[0.14em] hover:text-brand-lime">
                        {l.active ? 'Выключить' : 'Включить'}
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <code className="min-w-0 flex-1 truncate rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[12px] text-light/70">
                      {l.shortUrl}
                    </code>
                    <button onClick={() => copy(l.shortUrl)} className="btn-ghost !px-3 !py-2 !text-[11px]">
                      Копировать
                    </button>
                    <a href={l.waUrl} target="_blank" rel="noreferrer" className="btn-ghost !px-3 !py-2 !text-[11px]">
                      Проверить
                    </a>
                  </div>
                  <p className="mt-2 text-[11px] text-light/35">Текст, который подставится клиенту: «{l.text}»</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
