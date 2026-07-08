/**
 * Home page — Server Component.
 *
 * Composes all Home page sections and fetches collection data server-side.
 * The root layout already provides <main> landmark, NavBar, and Footer.
 * Sections are wrapped in AnimatedSection for scroll-triggered GSAP animations.
 *
 * Requirements: 2.1, 3.1, 4.1, 5.1, 6.1, 7.1, 8.1, 15.3, 16.3
 */

import { prisma } from '@/lib/prisma';
import { CollectionCard } from '@/lib/constants/brand';
import { getAdminCollections, getCollectionsHeading } from '@/lib/collections';
import { HeroSection } from '@/components/home/HeroSection';
import { AboutPreview } from '@/components/home/AboutPreview';
import { CollectionsPreview } from '@/components/home/CollectionsPreview';
import { Gallery } from '@/components/home/Gallery';
import { Testimonials } from '@/components/home/Testimonials';
import { Services } from '@/components/home/Services';
import { ContactSection } from '@/components/home/ContactSection';
import { AnimatedSection } from '@/components/home/AnimatedSection';

// ─── Data fetching ────────────────────────────────────────────────

async function getCollections(): Promise<CollectionCard[]> {
  try {
    // Prefer admin-managed collections if available
    const adminCollections = await getAdminCollections();
    if (adminCollections && adminCollections.length > 0) {
      return adminCollections.map((card) => ({
        title: card.title,
        description: card.description,
        imageUrl: card.imageUrl,
        filterParam: card.filterParam,
      }));
    }

    // Fallback: auto-generate from distinct waxType values
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: { waxType: true, scentProfile: true },
      distinct: ['waxType'],
    });

    // Map distinct wax types to CollectionCard format (max 3)
    return products.slice(0, 3).map((p) => ({
      title: `${p.waxType} Collection`,
      description: `Explore our ${p.waxType.toLowerCase()} candle range — hand-poured with care using premium materials`,
      imageUrl: `/images/collections/${p.waxType.toLowerCase()}.jpg`,
      filterParam: `waxType=${p.waxType}`,
    }));
  } catch {
    // Gracefully handle unhandled errors — return empty array
    return [];
  }
}

// ─── Home Page ────────────────────────────────────────────────────

export default async function Home() {
  const [collections, heading] = await Promise.all([
    getCollections(),
    getCollectionsHeading(),
  ]);

  return (
    <>
      <HeroSection />

      <AnimatedSection type="fadeUp" duration={0.9}>
        <AboutPreview />
      </AnimatedSection>

      <AnimatedSection type="staggerUp" stagger={0.2} duration={0.8}>
        <CollectionsPreview collections={collections} heading={heading ?? undefined} />
      </AnimatedSection>

      <AnimatedSection type="staggerUp" stagger={0.1} duration={0.7}>
        <Gallery />
      </AnimatedSection>

      <AnimatedSection type="fadeScale" duration={1}>
        <Testimonials />
      </AnimatedSection>

      <AnimatedSection type="staggerUp" stagger={0.18} duration={0.8}>
        <Services />
      </AnimatedSection>

      <AnimatedSection type="fadeUp" duration={0.9}>
        <ContactSection />
      </AnimatedSection>
    </>
  );
}
