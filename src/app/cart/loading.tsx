/**
 * Cart loading skeleton — shown while the Zustand store rehydrates from localStorage.
 * Prevents layout shift (flash of empty cart state) on initial load.
 */
export default function CartLoading() {
  return (
    <main className="min-h-screen bg-[var(--theme-bg)]">
      <div className="w-full max-w-4xl mx-auto px-4 py-8">
        {/* Title skeleton */}
        <div className="h-8 w-48 rounded-lg bg-[var(--theme-accent)]/10 animate-pulse mb-6" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items skeleton */}
          <div className="lg:col-span-2 space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-4 py-4 border-b border-[var(--theme-accent)]/10 animate-pulse"
              >
                <div className="w-16 h-16 rounded-lg bg-[var(--theme-accent)]/10 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-2/3 rounded bg-[var(--theme-accent)]/10" />
                  <div className="h-3 w-1/3 rounded bg-[var(--theme-accent)]/10" />
                </div>
                <div className="h-4 w-16 rounded bg-[var(--theme-accent)]/10" />
              </div>
            ))}
          </div>

          {/* Summary skeleton */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-xl border border-[var(--theme-accent)]/10 p-6 space-y-4 animate-pulse">
              <div className="h-5 w-32 rounded bg-[var(--theme-accent)]/10" />
              <div className="space-y-2">
                <div className="h-4 w-full rounded bg-[var(--theme-accent)]/10" />
                <div className="h-4 w-3/4 rounded bg-[var(--theme-accent)]/10" />
                <div className="h-4 w-full rounded bg-[var(--theme-accent)]/10" />
              </div>
              <div className="h-11 w-full rounded-lg bg-[var(--theme-accent)]/10 mt-2" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
