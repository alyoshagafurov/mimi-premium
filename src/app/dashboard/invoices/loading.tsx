import { PageSkeleton } from '@/components/admin/PageSkeleton';

export default function Loading() {
  return (
    <main className="mx-auto max-w-7xl px-5 pb-20 pt-6">
      <PageSkeleton rows={4} />
    </main>
  );
}
