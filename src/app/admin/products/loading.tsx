/**
 * Loading skeleton for the admin products listing page.
 * Displays pulse-animated placeholders matching the product table layout.
 *
 * Requirements: 10.4
 */
export default function ProductsLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 rounded bg-surface-muted animate-pulse" />
        <div className="h-9 w-28 rounded bg-surface-muted animate-pulse" />
      </div>

      {/* Search input skeleton */}
      <div className="h-10 w-full rounded-md bg-surface-muted animate-pulse" />

      {/* Table skeleton */}
      <div className="rounded-lg border border-border overflow-hidden">
        {/* Table header */}
        <div className="flex items-center gap-4 px-4 py-3 bg-surface border-b border-border">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="h-4 rounded bg-surface-muted animate-pulse"
              style={{ width: `${i === 0 ? 20 : i === 7 ? 15 : 10}%` }}
            />
          ))}
        </div>

        {/* Table rows */}
        {Array.from({ length: 8 }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-b-0"
          >
            <div className="h-4 w-[20%] rounded bg-surface-muted animate-pulse" />
            <div className="h-4 w-[10%] rounded bg-surface-muted animate-pulse" />
            <div className="h-4 w-[10%] rounded bg-surface-muted animate-pulse" />
            <div className="h-4 w-[10%] rounded bg-surface-muted animate-pulse" />
            <div className="h-5 w-[8%] rounded-full bg-surface-muted animate-pulse" />
            <div className="h-4 w-[6%] rounded bg-surface-muted animate-pulse" />
            <div className="h-4 w-[10%] rounded bg-surface-muted animate-pulse" />
            <div className="h-4 w-[15%] rounded bg-surface-muted animate-pulse" />
          </div>
        ))}
      </div>

      {/* Pagination skeleton */}
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-8 rounded bg-surface-muted animate-pulse" />
        ))}
      </div>
    </div>
  );
}
