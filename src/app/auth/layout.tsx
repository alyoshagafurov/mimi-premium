import type { Metadata } from 'next';

// Auth pages are utility flows — keep them out of the index.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
