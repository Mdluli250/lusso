import type { Metadata } from "next";
import Image from "next/image";
import { getContentSection } from "@/lib/cms/service";

/**
 * About Page — full brand story, philosophy, and lifestyle imagery.
 *
 * Async Server Component that fetches content from the CMS.
 * Expands on the Home page About preview with 3+ paragraphs covering
 * origin in Lusso Picnic, hand-poured process, premium materials,
 * sustainability, and South African roots.
 *
 * Requirements: 2.1, 2.2, 7.9, 10.1, 10.2, 10.3, 10.4, 16.2, 16.3
 */

export const metadata: Metadata = {
  title: "About",
  description:
    "Discover the story behind Lusso Candles — from our origins in Lusso Picnic to hand-poured luxury candles crafted with premium soy wax, beeswax, and phthalate-free fragrance oils in Centurion, South Africa.",
};

const aboutPageFallbacks: Record<string, string> = {
  "about_page.heading": "Our Story",
  "about_page.intro":
    "From curated picnics to hand-poured candles — a journey rooted in atmosphere, intention, and quiet luxury.",
  "about_page.story_heading": "About Lusso Candles",
  "about_page.story_body_1":
    "Born from the experiences created through Lusso Picnics, Lusso Candles extends our passion for beautiful spaces into the home.",
  "about_page.story_body_2":
    "We believe luxury is not about excess—it is about creating intentional moments that bring comfort, calm, and connection. Each candle is hand-poured in small batches using premium soy and beeswax blends and carefully curated fragrances that evoke warmth, elegance, and lasting memories.",
  "about_page.story_body_3":
    "Whether you're hosting guests, unwinding after a long day, or celebrating life's special moments, Lusso Candles creates an atmosphere that feels effortlessly luxurious.",
  "about_page.story_tagline": "Clean. Comfortable. Intentional.",
  "about_page.story_image": "/images/about/workshop.png",
  "about_page.philosophy_heading": "Our Philosophy",
  "about_page.philosophy_body_1":
    "We believe luxury should be felt, not announced. Every Lusso candle is hand-poured in small batches using premium soy wax and beeswax blends, paired with phthalate-free fragrance oils sourced for depth and longevity. We choose natural cotton wicks and reusable vessels because craft without conscience isn't craft at all.",
  "about_page.philosophy_body_2":
    "Sustainability isn't a marketing line for us — it's a practice woven into every decision. From biodegradable packaging to locally sourced botanicals, we work to ensure that what brings warmth to your home doesn't cost the earth. Our wax is renewable, our fragrances are clean, and our vessels are designed to be repurposed long after the last burn.",
  "about_page.philosophy_body_3":
    "Based in Centurion, we draw inspiration from the South African landscape — the golden light of the highveld, the earthy warmth of fynbos, the quiet stillness of a winter evening. These are the moments we bottle, one pour at a time.",
  "about_page.philosophy_image": "/images/about/materials.png",
};

export default async function AboutPage() {
  const content = await getContentSection("about_page", aboutPageFallbacks);

  return (
    <div className="bg-cream">
      {/* Page Header */}
      <section className="section-spacing" aria-labelledby="about-heading">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h1
            id="about-heading"
            className="font-serif text-4xl md:text-5xl text-charcoal mb-6"
          >
            {content.get("about_page.heading")}
          </h1>
          <p className="text-warm-grey text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
            {content.get("about_page.intro")}
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
              {content.get("about_page.story_heading")}
            </h2>

            <p className="text-warm-grey text-base md:text-lg leading-relaxed mb-4">
              {content.get("about_page.story_body_1")}
            </p>

            <p className="text-warm-grey text-base md:text-lg leading-relaxed mb-4">
              {content.get("about_page.story_body_2")}
            </p>

            <p className="text-warm-grey text-base md:text-lg leading-relaxed mb-4">
              {content.get("about_page.story_body_3")}
            </p>

            <p className="text-warm-grey text-base md:text-lg leading-relaxed font-semibold">
              {content.get("about_page.story_tagline")}
            </p>
          </div>

          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl">
            <Image
              src={content.get("about_page.story_image")!}
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
              src={content.get("about_page.philosophy_image")!}
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
              {content.get("about_page.philosophy_heading")}
            </h2>

            <p className="text-warm-grey text-base md:text-lg leading-relaxed mb-4">
              {content.get("about_page.philosophy_body_1")}
            </p>

            <p className="text-warm-grey text-base md:text-lg leading-relaxed mb-4">
              {content.get("about_page.philosophy_body_2")}
            </p>

            <p className="text-warm-grey text-base md:text-lg leading-relaxed">
              {content.get("about_page.philosophy_body_3")}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
