import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatZAR } from '@/lib/formatCurrency';
import { WishlistRemoveButton } from './WishlistRemoveButton';

/**
 * Wishlist dashboard page — displays user's wishlisted products.
 *
 * Server component that fetches wishlist items with product details.
 * Includes remove button for each item.
 *
 * Requirements: 2.2, 2.3, 2.4
 */
export default async function WishlistPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const wishlistItems = await prisma.wishlistItem.findMany({
    where: { userId: session.user.id },
    include: {
      product: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-[var(--theme-accent)] mb-6">
        My Wishlist
      </h1>

      {wishlistItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[var(--theme-accent)]/60 mb-4">
            Your wishlist is empty.
          </p>
          <Link
            href="/collection"
            className="text-[var(--theme-accent)] underline hover:opacity-80"
          >
            Browse our collection
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {wishlistItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 p-4 rounded-xl border border-[var(--theme-accent)]/20 bg-[var(--theme-accent)]/5"
            >
              <div className="flex-1 min-w-0">
                <Link
                  href={`/products/${item.product.slug}`}
                  className="font-semibold text-[var(--theme-accent)] hover:opacity-80 transition-opacity line-clamp-1"
                >
                  {item.product.name}
                </Link>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm text-[var(--theme-accent)]/60 capitalize">
                    {item.product.scentProfile}
                  </span>
                  <span className="text-sm font-medium text-[var(--theme-accent)]">
                    {formatZAR(item.product.price)}
                  </span>
                </div>
              </div>

              <Link
                href={`/products/${item.product.slug}`}
                className="text-sm px-3 py-1.5 rounded-md border border-[var(--theme-accent)]/20 text-[var(--theme-accent)] hover:bg-[var(--theme-accent)]/10 transition-colors"
              >
                View
              </Link>

              <WishlistRemoveButton productId={item.productId} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
