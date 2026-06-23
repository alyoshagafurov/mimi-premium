'use client';

import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type Item = {
  id: string;
  name: string;
  size: number;
  mime: string | null;
  kind: 'IMAGE' | 'DOCUMENT' | 'VIDEO' | 'CREATIVE' | 'BRANDBOOK' | 'OTHER';
  createdAt: string;
  uploader: { name: string; role: 'ADMIN' | 'CLIENT' } | null;
};

const KIND_LABEL: Record<Item['kind'], string> = {
  IMAGE: 'Фото',
  DOCUMENT: 'Документ',
  VIDEO: 'Видео',
  CREATIVE: 'Креатив',
  BRANDBOOK: 'Брендбук',
  OTHER: 'Другое',
};

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export function FilesPanel({ clientId }: { clientId?: string }) {
  const [files, setFiles] = useState<Item[]>([]);
  const [uploading, setUploading] = useState(false);
  const [kind, setKind] = useState<Item['kind']>('OTHER');
  const inputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const u = clientId ? `/api/files?clientId=${clientId}` : '/api/files';
    const r = await fetch(u, { cache: 'no-store' });
    if (!r.ok) return;
    const data = await r.json();
    setFiles(data.files ?? []);
  };

  useEffect(() => {
    load();
  }, [clientId]);

  const upload = async (file: File) => {
    if (file.size > 4 * 1024 * 1024) {
      toast.error('Файл больше 4 MB');
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('kind', kind);
      if (clientId) form.append('clientId', clientId);
      const r = await fetch('/api/files', { method: 'POST', body: form });
      if (!r.ok) throw new Error('upload');
      toast.success('Файл загружен');
      await load();
    } catch {
      toast.error('Не удалось загрузить');
    } finally {
      setUploading(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Удалить файл?')) return;
    await fetch(`/api/files/${id}`, { method: 'DELETE' });
    setFiles((xs) => xs.filter((x) => x.id !== id));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as Item['kind'])}
          className="input-glass !w-auto !py-2"
        >
          {Object.entries(KIND_LABEL).map(([k, l]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
        </select>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
            if (inputRef.current) inputRef.current.value = '';
          }}
        />
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="btn-lime disabled:opacity-60"
        >
          {uploading ? 'Загружаем...' : 'Загрузить файл'}
        </button>
        <span className="text-[11px] text-light/40">До 4 MB</span>
      </div>

      <div className="grid gap-2">
        {files.length === 0 && (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 text-center text-sm text-light/45">
            Пока пусто. Загрузите бриф, креативы или брендбук.
          </div>
        )}
        {files.map((f) => (
          <motion.div
            key={f.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <span className="rounded-md border border-brand-lime/20 bg-brand-lime/[0.06] px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-brand-lime">
                  {KIND_LABEL[f.kind]}
                </span>
                <a
                  href={`/api/files/${f.id}`}
                  className="truncate text-sm font-medium text-light hover:text-brand-lime"
                >
                  {f.name}
                </a>
              </div>
              <div className="mt-1 text-[11px] text-light/40">
                {formatBytes(f.size)} · {new Date(f.createdAt).toLocaleDateString('ru-RU')}
                {f.uploader && ` · ${f.uploader.role === 'ADMIN' ? 'агентство' : f.uploader.name}`}
              </div>
            </div>
            <button
              onClick={() => remove(f.id)}
              className="text-[11px] uppercase tracking-[0.16em] text-light/45 transition hover:text-rose-400"
            >
              удалить
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
