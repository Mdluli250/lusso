'use client';

/**
 * LazyCandleViewer — wraps CandleViewer with an IntersectionObserver
 * so the WebGL canvas only mounts when the element is in the viewport.
 * Unmounts when scrolled out of view to free WebGL contexts.
 */

import { useRef, useState, useEffect } from 'react';
import { CandleViewer, type CandleViewerProps } from './CandleViewer';

interface LazyCandleViewerProps extends CandleViewerProps {
  rootMargin?: string;
}

export function LazyCandleViewer({
  rootMargin = '100px',
  ...viewerProps
}: LazyCandleViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div ref={containerRef} className="w-full h-full">
      {isVisible ? (
        <CandleViewer {...viewerProps} />
      ) : (
        <div className="w-full h-full animate-pulse bg-[var(--theme-accent)]/10 rounded-lg" />
      )}
    </div>
  );
}
