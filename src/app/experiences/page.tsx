import type { Metadata } from 'next';
import Image from 'next/image';
import { InquiryForm } from '@/components/experiences/InquiryForm';

/**
 * Experiences Page — Lusso Picnics and scent-styling services.
 *
 * Server + Client hybrid: the page itself is a Server Component,
 * but it imports the InquiryForm Client Component for the inquiry form.
 *
 * Requirements: 12.1, 12.2, 12.3
 */

export const metadata: Metadata = {
  title: 'Experiences',
  description:
    'Explore Lusso Picnics — curated outdoor gatherings with candle ambiance — and our bespoke scent-styling services for weddings, events, and corporate occasions.',
};

export default function ExperiencesPage() {
  return (
    <div className="bg-cream">
      {/* Page Header */}
      <section className="section-spacing" aria-labelledby="experiences-heading">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h1
            id="experiences-heading"
            className="font-serif text-4xl md:text-5xl text-charcoal mb-6"
          >
            Experiences
          </h1>
          <p className="text-warm-grey text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
            Beyond candles — immersive moments designed to engage the senses
            and elevate every gathering.
          </p>
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
              Lusso Picnics
            </h2>

            <p className="text-warm-grey text-base md:text-lg leading-relaxed mb-4">
              Our curated outdoor experiences bring together intimate gatherings,
              thoughtful styling, and the warm glow of hand-poured candles. Each
              Lusso Picnic is designed as a sensory escape — from the soft flicker
              of candlelight to carefully chosen scents that complement the setting
              and season. Whether it&apos;s a birthday celebration, an anniversary,
              or simply an afternoon with friends, we create the atmosphere so you
              can be fully present in the moment.
            </p>

            <p className="text-warm-grey text-base md:text-lg leading-relaxed mb-6">
              Every detail is considered: linen draping, botanical arrangements,
              curated playlists, and of course, our signature candle installations
              that transform any outdoor space into something extraordinary. Based
              in Centurion, we bring the quiet luxury of a Lusso experience to
              parks, gardens, and private estates across Gauteng.
            </p>

            <a
              href="#inquiry-form"
              className="inline-block min-h-[44px] min-w-[120px] rounded-md bg-charcoal px-6 py-3 text-base font-medium text-cream text-center transition-colors duration-150 hover:bg-warm-grey focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal"
            >
              Inquire About a Picnic
            </a>
          </div>

          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl">
            <Image
              src="/images/experiences/picnic.jpg"
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
              src="/images/experiences/scent-styling.png"
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
              Scent-Styling Services
            </h2>

            <p className="text-warm-grey text-base md:text-lg leading-relaxed mb-4">
              Fragrance has the power to define a space and anchor a memory. Our
              bespoke scent-styling service pairs you with a dedicated fragrance
              consultant who crafts a custom scent narrative for your event —
              whether it&apos;s a wedding, a product launch, or a corporate
              gathering. We work with you to select notes that reflect your
              vision, from fresh botanicals to warm amber and oud.
            </p>

            <p className="text-warm-grey text-base md:text-lg leading-relaxed mb-6">
              The result is a cohesive olfactory experience woven throughout your
              venue: welcome candles at the entrance, signature blends at each
              table, and take-home favours your guests will treasure. Every
              element is hand-poured in our Centurion studio using premium soy
              wax and phthalate-free oils, ensuring a clean burn and lasting
              impression.
            </p>

            <a
              href="#inquiry-form"
              className="inline-block min-h-[44px] min-w-[120px] rounded-md bg-charcoal px-6 py-3 text-base font-medium text-cream text-center transition-colors duration-150 hover:bg-warm-grey focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal"
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
