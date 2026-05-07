import { prisma } from '@/lib/prisma';
import { ReviewModerationActions } from './ReviewModerationActions';

/**
 * Review Moderation admin page — lists pending reviews for approval/rejection.
 *
 * Server component that fetches pending reviews with product and user details.
 *
 * Requirements: 5.1, 5.2, 5.3
 */
export default async function AdminReviewsPage() {
  const pendingReviews = await prisma.review.findMany({
    where: { status: 'PENDING' },
    include: {
      product: { select: { name: true, slug: true } },
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--theme-accent)]">
          Review Moderation
        </h1>
        <span className="text-sm text-[var(--theme-accent)]/60">
          {pendingReviews.length} pending review{pendingReviews.length !== 1 ? 's' : ''}
        </span>
      </div>

      {pendingReviews.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[var(--theme-accent)]/60">
            No reviews pending moderation.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingReviews.map((review) => (
            <div
              key={review.id}
              className="p-4 rounded-xl border border-[var(--theme-accent)]/20 bg-[var(--theme-accent)]/5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-[var(--theme-accent)]">
                      {review.product.name}
                    </span>
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
                    <p className="text-sm text-[var(--theme-accent)]/70 line-clamp-3">
                      {review.text}
                    </p>
                  )}

                  <p className="text-xs text-[var(--theme-accent)]/40 mt-2">
                    Submitted {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <ReviewModerationActions reviewId={review.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
