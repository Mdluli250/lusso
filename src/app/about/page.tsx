import type { Metadata } from "next";
import Image from "next/image";

/**
 * About Page — full brand story, philosophy, and lifestyle imagery.
 *
 * Server Component (no "use client" directive).
 * Expands on the Home page About preview with 3+ paragraphs covering
 * origin in Lusso Picnic, hand-poured process, premium materials,
 * sustainability, and South African roots.
 *
 * Requirements: 10.1, 10.2, 10.3, 10.4, 16.2, 16.3
 */

export const metadata: Metadata = {
  title: "About",
  description:
    "Discover the story behind Lusso Candles — from our origins in Lusso Picnic to hand-poured luxury candles crafted with premium soy wax, beeswax, and phthalate-free fragrance oils in Centurion, South Africa.",
};

export default function AboutPage() {
  return (
    <div className="bg-cream">
      {/* Page Header */}
      <section className="section-spacing" aria-labelledby="about-heading">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h1
            id="about-heading"
            className="font-serif text-4xl md:text-5xl text-charcoal mb-6"
          >
            Our Story
          </h1>
          <p className="text-warm-grey text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
            From curated picnics to hand-poured candles — a journey rooted in
            atmosphere, intention, and quiet luxury.
          </p>
        </div>
      </section>

      {/* Brand Story Section */}
      <section
        className="section-spacing bg-white"
        aria-labelledby="brand-story-heading"
      >
        <div className="mx-auto max-w-4xl px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2
              id="brand-story-heading"
              className="font-serif text-3xl md:text-4xl text-charcoal mb-6"
            >
              About Lusso Candles
            </h2>

            <p className="text-warm-grey text-base md:text-lg leading-relaxed mb-4">
              Born from the experiences created through Lusso Picnics, Lusso
              Candles extends our passion for beautiful spaces into the home.
            </p>

            <p className="text-warm-grey text-base md:text-lg leading-relaxed mb-4">
              We believe luxury is not about excess—it is about creating
              intentional moments that bring comfort, calm, and connection. Each
              candle is hand-poured in small batches using premium soy and
              beeswax blends and carefully curated fragrances that evoke warmth,
              elegance, and lasting memories.
            </p>

            <p className="text-warm-grey text-base md:text-lg leading-relaxed mb-4">
              Whether you're hosting guests, unwinding after a long day, or
              celebrating life's special moments, Lusso Candles creates an
              atmosphere that feels effortlessly luxurious.
            </p>

            <p className="text-warm-grey text-base md:text-lg leading-relaxed font-semibold">
              Clean. Comfortable. Intentional.
            </p>
          </div>

          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl">
            <Image
              src="/images/about/workshop.png"
              alt="Lusso candle workshop with hand-poured soy candles cooling on a wooden bench"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="section-spacing" aria-labelledby="philosophy-heading">
        <div className="mx-auto max-w-4xl px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1 relative aspect-[4/5] w-full overflow-hidden rounded-xl">
            <Image
              src="/images/about/materials.png"
              alt="Premium candle-making materials including soy wax flakes, beeswax, and botanical oils"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>

          <div className="order-1 lg:order-2">
            <h2
              id="philosophy-heading"
              className="font-serif text-3xl md:text-4xl text-charcoal mb-6"
            >
              Our Philosophy
            </h2>

            <p className="text-warm-grey text-base md:text-lg leading-relaxed mb-4">
              We believe luxury should be felt, not announced. Every Lusso
              candle is hand-poured in small batches using premium soy wax and
              beeswax blends, paired with phthalate-free fragrance oils sourced
              for depth and longevity. We choose natural cotton wicks and
              reusable vessels because craft without conscience isn&apos;t craft
              at all.
            </p>

            <p className="text-warm-grey text-base md:text-lg leading-relaxed mb-4">
              Sustainability isn&apos;t a marketing line for us — it&apos;s a
              practice woven into every decision. From biodegradable packaging
              to locally sourced botanicals, we work to ensure that what brings
              warmth to your home doesn&apos;t cost the earth. Our wax is
              renewable, our fragrances are clean, and our vessels are designed
              to be repurposed long after the last burn.
            </p>

            <p className="text-warm-grey text-base md:text-lg leading-relaxed">
              Based in Centurion, we draw inspiration from the South African
              landscape — the golden light of the highveld, the earthy warmth of
              fynbos, the quiet stillness of a winter evening. These are the
              moments we bottle, one pour at a time.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
