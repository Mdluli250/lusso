import Link from 'next/link';

/**
 * Custom 404 Not Found page — matches the Lusso brand aesthetic.
 */
export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
      <p className="text-6xl font-serif text-[var(--theme-accent)]/20 mb-4">404</p>
      <h1 className="text-2xl font-bold text-[var(--theme-accent)] mb-3">
        Page not found
      </h1>
      <p className="text-[var(--theme-accent)]/60 max-w-md mb-8">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>
      <div className="flex gap-3">
        <Link
          href="/collection"
          className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-[var(--theme-accent)] text-cream font-medium text-sm hover:opacity-90 transition-opacity"
        >
          Browse Collection
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-[var(--theme-accent)]/30 text-[var(--theme-accent)] font-medium text-sm hover:bg-[var(--theme-accent)]/5 transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
