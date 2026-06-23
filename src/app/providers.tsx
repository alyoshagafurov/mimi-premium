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
            background: 'rgba(19,19,19,0.95)',
            color: '#f5f5f5',
            border: '1px solid rgba(201,169,110,0.3)',
            backdropFilter: 'blur(20px)',
            padding: '14px 18px',
            fontSize: '13px',
            borderRadius: '12px',
            boxShadow: '0 20px 60px -20px rgba(0,0,0,0.7)',
          },
          success: { iconTheme: { primary: '#C9A96E', secondary: '#131313' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#131313' } },
        }}
      />
    </SessionProvider>
  );
}
