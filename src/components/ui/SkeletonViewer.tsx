/**
 * SkeletonViewer — animated placeholder for the 3D canvas area while the
 * .glb model is loading via Suspense. Uses Tailwind CSS `animate-pulse`.
 *
 * Rendered as the `fallback` prop of the <Suspense> wrapper in CandleViewer.
 * Requirements: 11.5
 */
export function SkeletonViewer() {
  return (
    <div
      className="w-full h-full flex items-center justify-center bg-surface rounded-lg animate-pulse"
      aria-hidden="true"
      role="presentation"
    >
      <div className="flex flex-col items-center gap-4 w-full h-full p-8">
        {/* Simulated candle silhouette */}
        <div className="flex-1 w-full max-w-[200px] flex flex-col items-center gap-2">
          {/* Flame */}
          <div className="w-8 h-12 bg-surface-muted rounded-full" />
          {/* Wick */}
          <div className="w-1 h-4 bg-surface-muted rounded-full" />
          {/* Body */}
          <div className="w-20 h-40 bg-surface-muted rounded-lg" />
        </div>

        {/* Loading label */}
        <div className="h-4 bg-surface-muted rounded-md w-32" />
      </div>
    </div>
  );
}
