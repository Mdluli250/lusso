'use client';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/**
 * Pagination — page navigation with current/total pages display.
 * Provides previous/next buttons and page number indicators.
 *
 * Requirements: 4.4, 10.5
 */
export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(currentPage, totalPages);

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1 mt-4">
      {/* Previous button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="px-3 py-1.5 text-sm rounded-md border border-border text-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-muted transition-colors"
        aria-label="Previous page"
      >
        ←
      </button>

      {/* Page numbers */}
      {pages.map((page, index) =>
        page === '...' ? (
          <span key={`ellipsis-${index}`} className="px-2 py-1.5 text-sm text-muted">
            …
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page as number)}
            className={[
              'px-3 py-1.5 text-sm rounded-md transition-colors',
              page === currentPage
                ? 'bg-theme-accent text-white font-medium'
                : 'border border-border text-foreground hover:bg-surface-muted',
            ].join(' ')}
            aria-label={`Page ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </button>
        )
      )}

      {/* Next button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="px-3 py-1.5 text-sm rounded-md border border-border text-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-muted transition-colors"
        aria-label="Next page"
      >
        →
      </button>
    </nav>
  );
}

/**
 * Generate page numbers with ellipsis for large page counts.
 * Shows first, last, and pages around the current page.
 */
function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | '...')[] = [];

  // Always show first page
  pages.push(1);

  if (current > 3) {
    pages.push('...');
  }

  // Pages around current
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push('...');
  }

  // Always show last page
  pages.push(total);

  return pages;
}
