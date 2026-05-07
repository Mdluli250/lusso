import Link from 'next/link';

interface BreadcrumbProps {
  segments: { label: string; href?: string }[];
}

/**
 * Breadcrumb — renders a navigation trail for the admin dashboard.
 * Last segment is plain text (current page), others are links.
 *
 * Requirements: 2.6
 */
export function Breadcrumb({ segments }: BreadcrumbProps) {
  if (segments.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted">
      <ol className="flex items-center gap-1.5 flex-wrap">
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;

          return (
            <li key={index} className="flex items-center gap-1.5">
              {index > 0 && (
                <span aria-hidden="true" className="text-border">
                  /
                </span>
              )}
              {isLast || !segment.href ? (
                <span className="text-foreground font-medium" aria-current="page">
                  {segment.label}
                </span>
              ) : (
                <Link
                  href={segment.href}
                  className="hover:text-foreground transition-colors"
                >
                  {segment.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
