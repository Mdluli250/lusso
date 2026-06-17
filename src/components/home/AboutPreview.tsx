import Link from 'next/link';

/**
 * AboutPreview — brief brand introduction on the Home page.
 *
 * Server Component (no "use client" directive).
 * Renders a short overview of Lusso Candles covering hand-poured candles,
 * premium materials, and sustainability, with a CTA linking to /about.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */
export function AboutPreview() {
  return (
    <section className="section-spacing bg-cream" aria-labelledby="about-preview-heading">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2
          id="about-preview-heading"
          className="font-serif text-3xl md:text-4xl text-charcoal mb-6"
        >
          About Lusso Candles
        </h2>

        <p className="text-warm-grey text-base md:text-lg leading-relaxed mb-4">
          Born from a love of atmosphere and intention, Lusso Candles are hand-poured in small
          batches using premium soy and beeswax blends. Every candle is crafted with sustainably
          sourced botanicals and phthalate-free fragrance oils, honouring both the senses and the
          earth.
        </p>

        <p className="text-warm-grey text-base md:text-lg leading-relaxed mb-8">
          We believe quiet luxury lives in the details — the slow pour, the natural wick, the
          vessel designed to be kept long after the last flame.
        </p>

        <Link
          href="/about"
          className="inline-flex items-center justify-center px-8 py-3 min-h-[44px] min-w-[120px] rounded-lg bg-[#2c2825] text-white font-semibold text-base transition-opacity duration-150 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c2825]"
        >
          Learn More
        </Link>
      </div>
    </section>
  );
}
