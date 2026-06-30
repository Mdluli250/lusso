import type { Metadata } from "next";
import Image from "next/image";
import { InquiryForm } from "@/components/experiences/InquiryForm";
import { getContentSection } from "@/lib/cms/service";

/**
 * Experiences Page — Lusso Picnics and scent-styling services.
 *
 * Async Server Component that fetches content from the CMS service.
 * Falls back to hardcoded strings when the database is unavailable.
 *
 * Requirements: 2.1, 2.2, 7.10, 12.1, 12.2, 12.3
 */

export const metadata: Metadata = {
  title: "Experiences",
  description:
    "Explore Lusso Picnics — curated outdoor gatherings with candle ambiance — and our bespoke scent-styling services for weddings, events, and corporate occasions.",
};

const experiencesFallbacks: Record<string, string> = {
  "experiences.intro_1":
    "Born from the experiences created through Lusso Picnics, Lusso Candles extends our passion for beautiful spaces into the home.",
  "experiences.intro_2":
    "We believe luxury is not about excess—it is about creating intentional moments that bring comfort, calm, and connection. Each candle is hand-poured in small batches using premium soy and beeswax blends and carefully curated fragrances that evoke warmth, elegance, and lasting memories.",
  "experiences.intro_3":
    "Whether you're hosting guests, unwinding after a long day, or celebrating life's special moments, Lusso Candles creates an atmosphere that feels effortlessly luxurious.",
  "experiences.intro_tagline": "Clean. Comfortable. Intentional.",
  "experiences.picnics_heading": "Lusso Picnics",
  "experiences.picnics_body_1":
    "Our curated outdoor experiences bring together intimate gatherings, thoughtful styling, and the warm glow of hand-poured candles. Each Lusso Picnic is designed as a sensory escape — from the soft flicker of candlelight to carefully chosen scents that complement the setting and season. Whether it's a birthday celebration, an anniversary, or simply an afternoon with friends, we create the atmosphere so you can be fully present in the moment.",
  "experiences.picnics_body_2":
    "Every detail is considered: linen draping, botanical arrangements, curated playlists, and of course, our signature candle installations that transform any outdoor space into something extraordinary. Based in Centurion, we bring the quiet luxury of a Lusso experience to parks, gardens, and private estates across Gauteng.",
  "experiences.picnics_image": "/images/experiences/picnic.jpg",
  "experiences.scent_heading": "Scent-Styling Services",
  "experiences.scent_body_1":
    "Fragrance has the power to define a space and anchor a memory. Our bespoke scent-styling service pairs you with a dedicated fragrance consultant who crafts a custom scent narrative for your event — whether it's a wedding, a product launch, or a corporate gathering. We work with you to select notes that reflect your vision, from fresh botanicals to warm amber and oud.",
  "experiences.scent_body_2":
    "The result is a cohesive olfactory experience woven throughout your venue: welcome candles at the entrance, signature blends at each table, and take-home favours your guests will treasure. Every element is hand-poured in our Centurion studio using premium soy wax and phthalate-free oils, ensuring a clean burn and lasting impression.",
  "experiences.scent_image": "/images/experiences/scent-styling.png",
};

export default async function ExperiencesPage() {
  const content = await getContentSection("experiences", experiencesFallbacks);

  return (
    <div className="bg-cream">
      {/* Page Header */}
      <section
        className="section-spacing"
        aria-labelledby="experiences-heading"
      >
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h1
            id="experiences-heading"
            className="font-serif text-4xl md:text-5xl text-charcoal mb-6"
          >
            Experiences
          </h1>
          <div className="space-y-4 text-warm-grey text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
            <p>{content.get("experiences.intro_1")}</p>
            <p>{content.get("experiences.intro_2")}</p>
            <p>{content.get("experiences.intro_3")}</p>
            <p className="font-semibold">
              {content.get("experiences.intro_tagline")}
            </p>
          </div>
        </div>
      </section>

      {/* Lusso Picnics Section */}
      <section
        className="section-spacing bg-white"
        aria-labelledby="picnics-heading"
      >
        <div className="mx-auto max-w-4xl px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2
              id="picnics-heading"
              className="font-serif text-3xl md:text-4xl text-charcoal mb-6"
            >
              {content.get("experiences.picnics_heading")}
            </h2>

            <p className="text-warm-grey text-base md:text-lg leading-relaxed mb-4">
              {content.get("experiences.picnics_body_1")}
            </p>

            <p className="text-warm-grey text-base md:text-lg leading-relaxed mb-6">
              {content.get("experiences.picnics_body_2")}
            </p>

            <a
              href="#inquiry-form"
              className="inline-block min-h-[44px] min-w-[120px] rounded-md bg-warm-grey px-6 py-3 text-base font-medium text-white text-center transition-colors duration-150 hover:bg-charcoal hover:text-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal"
            >
              Inquire About a Picnic
            </a>
          </div>

          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl">
            <Image
              src={content.get("experiences.picnics_image")!}
              alt="Lusso Picnic setup with candles glowing at golden hour in an outdoor garden setting"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      {/* Scent-Styling Services Section */}
      <section
        className="section-spacing"
        aria-labelledby="scent-styling-heading"
      >
        <div className="mx-auto max-w-4xl px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1 relative aspect-[4/5] w-full overflow-hidden rounded-xl">
            <Image
              src={content.get("experiences.scent_image")!}
              alt="Bespoke scent-styling consultation with fragrance samples arranged on a marble surface"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>

          <div className="order-1 lg:order-2">
            <h2
              id="scent-styling-heading"
              className="font-serif text-3xl md:text-4xl text-charcoal mb-6"
            >
              {content.get("experiences.scent_heading")}
            </h2>

            <p className="text-warm-grey text-base md:text-lg leading-relaxed mb-4">
              {content.get("experiences.scent_body_1")}
            </p>

            <p className="text-warm-grey text-base md:text-lg leading-relaxed mb-6">
              {content.get("experiences.scent_body_2")}
            </p>

            <a
              href="#inquiry-form"
              className="inline-block min-h-[44px] min-w-[120px] rounded-md bg-warm-grey px-6 py-3 text-base font-medium text-white text-center transition-colors duration-150 hover:bg-charcoal hover:text-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal"
            >
              Book a Consultation
            </a>
          </div>
        </div>
      </section>

      {/* Inquiry Form Section */}
      <section
        id="inquiry-form"
        className="section-spacing bg-white"
        aria-labelledby="inquiry-heading"
      >
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center mb-10">
            <h2
              id="inquiry-heading"
              className="font-serif text-3xl md:text-4xl text-charcoal mb-4"
            >
              Get in Touch
            </h2>
            <p className="text-warm-grey text-base md:text-lg leading-relaxed max-w-xl mx-auto">
              Ready to create something memorable? Tell us about your event and
              we&apos;ll craft an experience tailored to you.
            </p>
          </div>

          <InquiryForm />
        </div>
      </section>
    </div>
  );
}
