'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MediaLibrary, type Asset } from './MediaLibrary';

/** Modal to pick (reuse) an existing image from the Media Library. */
export function MediaPicker({ onPick, onClose }: { onPick: (url: string) => void; onClose: () => void }) {
  const [assets, setAssets] = useState<Asset[] | null>(null);

  useEffect(() => {
    fetch('/api/admin/media', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setAssets(d.assets ?? []))
      .catch(() => setAssets([]));
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-ink/85 p-4 py-10" onClick={onClose}>
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl rounded-3xl border border-white/[0.08] bg-ink2 p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-light">Медиатека</h3>
          <button onClick={onClose} className="text-light/50 hover:text-light">✕</button>
        </div>
        {assets === null ? (
          <p className="py-12 text-center text-light/45">Загрузка…</p>
        ) : (
          <MediaLibrary initialAssets={assets} compact onPick={(url) => { onPick(url); onClose(); }} />
        )}
      </motion.div>
    </div>
  );
}
