/**
 * ModelFallback — static image fallback for when the 3D .glb model
 * fails to load or the browser doesn't support WebGL.
 *
 * Rendered by the ErrorBoundary wrapping CandleViewer.
 * Requirements: 3.6
 */

interface ModelFallbackProps {
  /** Alt text for the fallback image. Defaults to a generic candle description. */
  alt?: string;
  /** Optional CSS class names to apply to the container. */
  className?: string;
}

export function ModelFallback({
  alt = 'Artisan candle — 3D preview unavailable',
  className = '',
}: ModelFallbackProps) {
  return (
    <div
      className={`flex items-center justify-center w-full h-full bg-surface rounded-lg overflow-hidden ${className}`}
      role="img"
      aria-label={alt}
    >
      {/* Placeholder gradient that evokes a candle flame when no image is available */}
      <div className="relative w-full h-full flex flex-col items-center justify-center gap-4 p-6">
        {/* Candle flame SVG placeholder */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 64 96"
          className="w-24 h-36 opacity-60"
          aria-hidden="true"
          focusable="false"
        >
          {/* Flame */}
          <ellipse cx="32" cy="18" rx="10" ry="16" fill="var(--theme-accent)" opacity="0.8" />
          <ellipse cx="32" cy="22" rx="6" ry="10" fill="#FFF3CD" opacity="0.9" />
          {/* Wick */}
          <rect x="31" y="30" width="2" height="8" fill="#555" rx="1" />
          {/* Candle body */}
          <rect x="18" y="38" width="28" height="50" rx="4" fill="var(--theme-accent)" opacity="0.3" />
          <rect x="20" y="40" width="24" height="46" rx="3" fill="var(--theme-accent)" opacity="0.15" />
        </svg>

        <p className="text-sm text-muted text-center max-w-[200px] leading-snug">
          3D preview unavailable
        </p>
      </div>
    </div>
  );
}
