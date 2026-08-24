/**
 * Collection page — Server Component.
 *
 * Fetches all active products with their variants from the database and
 * passes them to the CollectionClient island for client-side filtering.
 *
 * This pattern avoids round-trips on every filter change: all products are
 * fetched once at request time and filtering happens entirely in the browser.
 *
 * Requirements: 4.1
 */

import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { CollectionClient } from "@/components/product/CollectionClient";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

// ─── Metadata ─────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Clean | Comfortable | Luxurious. Hand-poured luxury candles crafted to transform everyday spaces into moments of comfort, warmth, and elegance.",
};

// ─── Data fetching ────────────────────────────────────────────────

async function getAllProducts() {
  try {
    return await prisma.product.findMany({
      where: { isActive: true },
      include: {
        variants: true,
        images: { select: { id: true, url: true }, orderBy: { sortOrder: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    // Gracefully handle DB errors during build or when DB is unavailable
    return [];
  }
}

// ─── Page ─────────────────────────────────────────────────────────

export default async function CollectionPage() {
  const products = await getAllProducts();

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] transition-colors duration-700">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-16 py-16">
        {/* Breadcrumb navigation */}
        <Breadcrumbs
          items={[{ label: "Home", href: "/" }, { label: "Shop" }]}
        />

        {/* Page header */}
        <header className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-[var(--theme-accent)] leading-tight">
            Clean | Comfortable | Luxurious.
          </h1>
          <p className="mt-3 text-lg text-[var(--theme-accent)]/70 max-w-xl space-y-4">
            <span>
              Hand-poured luxury candles crafted to transform everyday spaces
              into moments of comfort, warmth, and elegance.
            </span>
            <span>
              Made with premium soy and beeswax blends, Lusso Candles are
              designed to bring beautiful fragrance, timeless style, and
              intentional living into every room.
            </span>
          </p>
        </header>

        {/* Client island: filter panel + product grid + quick view modal */}
        <CollectionClient allProducts={products} />
      </div>
    </div>
  );
}
