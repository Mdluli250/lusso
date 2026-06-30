import Link from 'next/link';
import { getContentSection } from '@/lib/cms/service';

/**
 * AboutPreview — brief brand introduction on the Home page.
 *
 * Async Server Component that fetches content from the CMS.
 * Renders a short overview of Lusso Candles covering hand-poured candles,
 * premium materials, and sustainability, with a CTA linking to /about.
 *
 * Requirements: 2.1, 2.2, 7.8
 */

const aboutPreviewFallbacks: Record<string, string> = {
  'about_preview.heading': 'About Lusso Candles',
  'about_preview.body_1':
    'Born from a love of atmosphere and intention, Lusso Candles are hand-poured in small batches using premium soy and beeswax blends. Every candle is crafted with sustainably sourced botanicals and phthalate-free fragrance oils, honouring both the senses and the earth.',
  'about_preview.body_2':
    'We believe quiet luxury lives in the details — the slow pour, the natural wick, the vessel designed to be kept long after the last flame.',
  'about_preview.cta_label': 'Learn More',
};

export async function AboutPreview() {
  const content = await getContentSection('about_preview', aboutPreviewFallbacks);

  const heading = content.get('about_preview.heading')!;
  const body1 = content.get('about_preview.body_1')!;
  const body2 = content.get('about_preview.body_2')!;
  const ctaLabel = content.get('about_preview.cta_label')!;

  return (
    <section className="section-spacing bg-cream" aria-labelledby="about-preview-heading">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2
          id="about-preview-heading"
          className="font-serif text-3xl md:text-4xl text-charcoal mb-6"
        >
          {heading}
        </h2>

        <p className="text-warm-grey text-base md:text-lg leading-relaxed mb-4">
          {body1}
        </p>

        <p className="text-warm-grey text-base md:text-lg leading-relaxed mb-8">
          {body2}
        </p>

        <Link
          href="/about"
          className="inline-flex items-center justify-center px-8 py-3 min-h-[44px] min-w-[120px] rounded-lg bg-[#2c2825] text-white font-semibold text-base transition-opacity duration-150 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c2825]"
        >
          {ctaLabel}
        </Link>
      </div>
    </section>
  );
}
