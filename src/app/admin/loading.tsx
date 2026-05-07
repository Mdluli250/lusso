/**
 * Loading skeleton for the admin analytics page.
 * Displays pulse-animated placeholders matching the analytics layout.
 *
 * Requirements: 10.4
 */
export default function AdminLoading() {
  return (
    <div className="space-y-6">
      {/* Title skeleton */}
      <div className="h-8 w-32 rounded bg-surface-muted animate-pulse" />

      {/* Metric cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-surface p-5 space-y-3"
          >
            <div className="h-4 w-24 rounded bg-surface-muted animate-pulse" />
            <div className="h-7 w-32 rounded bg-surface-muted animate-pulse" />
            <div className="h-3 w-20 rounded bg-surface-muted animate-pulse" />
          </div>
        ))}
      </div>

      {/* Chart + Table skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders by status chart skeleton */}
        <div className="rounded-lg border border-border bg-surface p-5 space-y-4">
          <div className="h-4 w-28 rounded bg-surface-muted animate-pulse" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-4 w-16 rounded bg-surface-muted animate-pulse" />
              <div className="flex-1 h-6 rounded bg-surface-muted animate-pulse" />
              <div className="h-4 w-8 rounded bg-surface-muted animate-pulse" />
            </div>
          ))}
        </div>

        {/* Top sellers table skeleton */}
        <div className="rounded-lg border border-border bg-surface p-5 space-y-4">
          <div className="h-4 w-24 rounded bg-surface-muted animate-pulse" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-4 w-6 rounded bg-surface-muted animate-pulse" />
              <div className="h-4 flex-1 rounded bg-surface-muted animate-pulse" />
              <div className="h-4 w-10 rounded bg-surface-muted animate-pulse" />
              <div className="h-4 w-16 rounded bg-surface-muted animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
