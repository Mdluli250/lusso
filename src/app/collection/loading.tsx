import { ProductGridSkeleton } from '@/components/ui/Skeleton';

export default function CollectionLoading() {
  return (
    <div className="min-h-screen bg-[var(--theme-bg)]">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-16 py-16">
        <div className="mb-12 space-y-3">
          <div className="h-10 w-64 animate-pulse rounded-lg bg-[var(--theme-accent)]/10" />
          <div className="h-5 w-96 animate-pulse rounded-lg bg-[var(--theme-accent)]/10" />
        </div>
        <ProductGridSkeleton count={6} />
      </div>
    </div>
  );
}
