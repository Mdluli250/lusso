/**
 * Loading skeleton for the admin reviews moderation page.
 */
export default function ReviewsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 rounded bg-surface-muted animate-pulse" />
        <div className="h-5 w-32 rounded bg-surface-muted animate-pulse" />
      </div>
      {/* Tab bar skeleton */}
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 w-24 rounded-md bg-surface-muted animate-pulse" />
        ))}
      </div>
      {/* Review card skeletons */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="p-4 rounded-xl border border-border bg-surface space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-4 w-32 rounded bg-surface-muted animate-pulse" />
            <div className="h-4 w-24 rounded bg-surface-muted animate-pulse" />
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="h-4 w-4 rounded bg-surface-muted animate-pulse" />
            ))}
          </div>
          <div className="h-4 w-full rounded bg-surface-muted animate-pulse" />
          <div className="h-4 w-3/4 rounded bg-surface-muted animate-pulse" />
        </div>
      ))}
    </div>
  );
}
