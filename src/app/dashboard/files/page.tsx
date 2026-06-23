import { FilesPanel } from '@/components/dashboard/FilesPanel';

export default function DashboardFilesPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-6 lg:px-6">
      <div className="mb-6">
        <p className="text-[10px] uppercase tracking-[0.32em] text-brand-orange">Файлы</p>
        <h1 className="mt-2 font-display text-2xl font-extrabold text-light sm:text-3xl">Хранилище проекта</h1>
        <p className="mt-2 text-sm text-light/55">Бриф, креативы, брендбук — всё в одном месте.</p>
      </div>
      <FilesPanel />
    </main>
  );
}
