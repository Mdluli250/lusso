/**
 * SkeletonCard — animated placeholder for product cards while data is loading.
 * Uses Tailwind CSS `animate-pulse` to prevent layout shift.
 *
 * Requirements: 11.5
 */
export function SkeletonCard() {
  return (
    <div
      className="rounded-xl overflow-hidden bg-surface animate-pulse"
      aria-hidden="true"
      role="presentation"
    >
      {/* Image / 3D viewer area */}
      <div className="w-full aspect-square bg-surface-muted" />

      {/* Content area */}
      <div className="p-4 space-y-3">
        {/* Product name */}
        <div className="h-5 bg-surface-muted rounded-md w-3/4" />

        {/* Scent profile tag */}
        <div className="h-4 bg-surface-muted rounded-md w-1/3" />

        {/* Price + CTA row */}
        <div className="flex items-center justify-between pt-1">
          <div className="h-5 bg-surface-muted rounded-md w-1/4" />
          <div className="h-8 bg-surface-muted rounded-lg w-24" />
        </div>
      </div>
    </div>
  );
}
