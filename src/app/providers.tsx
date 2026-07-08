'use client';

import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';
import { LanguageProvider } from '@/i18n/LanguageProvider';
import type { Lang } from '@/i18n/config';

export function Providers({ children, initialLang }: { children: React.ReactNode; initialLang?: Lang }) {
  return (
    <SessionProvider>
      <LanguageProvider initialLang={initialLang}>{children}</LanguageProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: 'rgba(10,7,18,0.94)',
            color: '#F5F1FA',
            border: '1px solid rgba(212,236,76,0.28)',
            backdropFilter: 'blur(20px)',
            padding: '14px 18px',
            fontSize: '13px',
            borderRadius: '14px',
            boxShadow: '0 24px 60px -20px rgba(0,0,0,0.75)',
          },
          success: { iconTheme: { primary: '#D4EC4C', secondary: '#0A0712' } },
          error: { iconTheme: { primary: '#fb7185', secondary: '#0A0712' } },
        }}
      />
    </SessionProvider>
  );
}
