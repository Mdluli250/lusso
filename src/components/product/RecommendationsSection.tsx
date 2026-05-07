import Link from 'next/link';
import { getRecommendations } from '@/lib/recommendations';
import { formatZAR } from '@/lib/formatCurrency';

interface RecommendationsSectionProps {
  productId: string;
}

/**
 * RecommendationsSection — Server component that displays "Customers Also Bought" products.
 * Hides entirely when no recommendations are available.
 * Should be wrapped in Suspense by the parent.
 */
export async function RecommendationsSection({ productId }: RecommendationsSectionProps) {
  const recommendations = await getRecommendations(productId);

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="recommendations-heading">
      <h2
        id="recommendations-heading"
        className="text-2xl font-bold text-[var(--theme-accent)] mb-6"
      >
        Customers Also Bought
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {recommendations.map((rec) => (
          <Link
            key={rec.productId}
            href={`/products/${rec.slug}`}
            className="group border border-[var(--theme-accent)]/20 rounded-xl p-4 hover:border-[var(--theme-accent)]/40 transition-all"
          >
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-[var(--theme-accent)] line-clamp-2 group-hover:opacity-80">
                {rec.name}
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--theme-accent)]/15 text-[var(--theme-accent)]/70 capitalize inline-block">
                {rec.scentProfile}
              </span>
              <p className="text-sm font-bold text-[var(--theme-accent)]">
                {formatZAR(rec.price)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
