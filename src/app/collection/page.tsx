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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-12">
        {/* Breadcrumb navigation */}
        <Breadcrumbs
          items={[{ label: "Home", href: "/" }, { label: "Shop" }]}
        />

        {/* Page header */}
        <header className="mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--theme-accent)] leading-tight">
            Clean · Comfortable · Luxurious
          </h1>
          <p className="mt-3 text-base text-[var(--theme-accent)]/70 max-w-xl leading-relaxed">
            Hand-poured luxury candles crafted to transform everyday spaces
            into moments of comfort, warmth, and elegance.
          </p>
        </header>

        {/* Client island: filter panel + product grid + quick view modal */}
        <CollectionClient allProducts={products} />
      </div>
    </div>
  );
}
