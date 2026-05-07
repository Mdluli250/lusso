/**
 * Loading skeleton for the admin inventory page.
 * Displays pulse-animated placeholders matching the inventory layout
 * with summary badges and table.
 *
 * Requirements: 10.4
 */
export default function InventoryLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="h-8 w-28 rounded bg-surface-muted animate-pulse" />

      {/* Summary badges skeleton */}
      <div className="flex flex-wrap gap-3">
        <div className="h-8 w-36 rounded-full bg-surface-muted animate-pulse" />
        <div className="h-8 w-32 rounded-full bg-surface-muted animate-pulse" />
      </div>

      {/* Filter buttons skeleton */}
      <div className="flex gap-2">
        <div className="h-8 w-16 rounded-md bg-surface-muted animate-pulse" />
        <div className="h-8 w-28 rounded-md bg-surface-muted animate-pulse" />
        <div className="h-8 w-24 rounded-md bg-surface-muted animate-pulse" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-lg border border-border overflow-hidden">
        {/* Table header */}
        <div className="flex items-center gap-4 px-4 py-3 bg-surface border-b border-border">
          <div className="h-4 w-[20%] rounded bg-surface-muted animate-pulse" />
          <div className="h-4 w-[15%] rounded bg-surface-muted animate-pulse" />
          <div className="h-4 w-[15%] rounded bg-surface-muted animate-pulse" />
          <div className="h-4 w-[12%] rounded bg-surface-muted animate-pulse" />
          <div className="h-4 w-[12%] rounded bg-surface-muted animate-pulse" />
        </div>

        {/* Table rows */}
        {Array.from({ length: 8 }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-b-0"
          >
            <div className="h-4 w-[20%] rounded bg-surface-muted animate-pulse" />
            <div className="h-4 w-[15%] rounded bg-surface-muted animate-pulse" />
            <div className="h-4 w-[15%] rounded bg-surface-muted animate-pulse" />
            <div className="h-4 w-[12%] rounded bg-surface-muted animate-pulse" />
            <div className="h-5 w-[10%] rounded-full bg-surface-muted animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
