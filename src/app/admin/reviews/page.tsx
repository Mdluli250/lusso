import { prisma } from '@/lib/prisma';
import { ReviewModerationActions } from './ReviewModerationActions';
import Link from 'next/link';

/**
 * Review Moderation admin page — lists reviews by status with tab navigation.
 * Supports pending/approved/rejected tabs via searchParams.
 *
 * Requirements: 5.1, 5.2, 5.3
 */

type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

type ReviewRow = {
  id: string;
  rating: number;
  text: string | null;
  createdAt: Date;
  product: { name: string; slug: string };
  user: { name: string | null; email: string };
};

interface AdminReviewsPageProps {
  searchParams: Promise<{ status?: string }>;
}

const STATUS_TABS: { value: ReviewStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

export default async function AdminReviewsPage({ searchParams }: AdminReviewsPageProps) {
  const params = await searchParams;
  const rawStatus = params.status?.toUpperCase();
  const activeStatus: ReviewStatus =
    rawStatus === 'APPROVED' || rawStatus === 'REJECTED' ? rawStatus : 'PENDING';

  let reviews: ReviewRow[] = [];

  try {
    reviews = await prisma.review.findMany({
      where: { status: activeStatus },
      include: {
        product: { select: { name: true, slug: true } },
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch {
    // DB unavailable — render empty state
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--theme-accent)]">Review Moderation</h1>
        <span className="text-sm text-[var(--theme-accent)]/60">
          {reviews.length} {activeStatus.toLowerCase()} review{reviews.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Status tabs */}
      <nav className="flex gap-2" aria-label="Review status filter">
        {STATUS_TABS.map(({ value, label }) => (
          <Link
            key={value}
            href={`/admin/reviews?status=${value.toLowerCase()}`}
            className={[
              'px-4 py-2 rounded-md text-sm font-medium transition-colors',
              activeStatus === value
                ? 'bg-[var(--theme-accent)] text-cream'
                : 'border border-border text-muted hover:text-foreground hover:border-foreground/30',
            ].join(' ')}
            aria-current={activeStatus === value ? 'page' : undefined}
          >
            {label}
          </Link>
        ))}
      </nav>

      {/* Review list */}
      {reviews.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[var(--theme-accent)]/60">
            No {activeStatus.toLowerCase()} reviews.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="p-4 rounded-xl border border-[var(--theme-accent)]/20 bg-[var(--theme-accent)]/5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link
                      href={`/products/${review.product.slug}`}
                      target="_blank"
                      className="font-medium text-[var(--theme-accent)] hover:underline"
                    >
                      {review.product.name}
                    </Link>
                    <span className="text-xs text-[var(--theme-accent)]/50">
                      by {review.user.name ?? review.user.email}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`text-sm ${star <= review.rating ? 'text-amber-400' : 'text-[var(--theme-accent)]/20'}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  {review.text && (
                    <p className="text-sm text-[var(--theme-accent)]/70 line-clamp-3">{review.text}</p>
                  )}
                  <p className="text-xs text-[var(--theme-accent)]/40 mt-2">
                    Submitted {new Date(review.createdAt).toLocaleDateString('en-ZA')}
                  </p>
                </div>
                {activeStatus === 'PENDING' && (
                  <ReviewModerationActions reviewId={review.id} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
