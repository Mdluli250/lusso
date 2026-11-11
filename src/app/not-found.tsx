import Link from 'next/link';

/**
 * Custom 404 Not Found page — matches the Lusso brand aesthetic.
 */
export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
      <p className="text-7xl sm:text-8xl font-serif text-[var(--theme-accent)]/10 mb-4 leading-none select-none" aria-hidden="true">404</p>
      <h1 className="text-2xl sm:text-3xl font-bold text-[var(--theme-accent)] mb-3">
        Page not found
      </h1>
      <p className="text-[var(--theme-accent)]/60 max-w-md mb-8 text-base">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/collection"
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[var(--theme-accent)] text-cream font-medium text-sm hover:opacity-90 transition-opacity"
        >
          Browse Collection
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl border border-[var(--theme-accent)]/30 text-[var(--theme-accent)] font-medium text-sm hover:bg-[var(--theme-accent)]/5 transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
