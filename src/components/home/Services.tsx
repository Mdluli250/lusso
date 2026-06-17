import { SERVICES } from '@/lib/constants/brand';

/**
 * Services — displays the three core service offerings on the Home page.
 *
 * Server Component (no "use client" directive).
 * Renders an "Our Services" heading with three equal-width columns that
 * stack vertically below 768px, preserving order.
 *
 * Requirements: 7.1, 7.2, 7.3
 */
export function Services() {
  return (
    <section className="section-spacing bg-sand" aria-labelledby="services-heading">
      <div className="mx-auto max-w-6xl px-6">
        <h2
          id="services-heading"
          className="font-serif text-3xl md:text-4xl text-charcoal text-center mb-10"
        >
          Our Services
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {SERVICES.map((service) => (
            <div key={service.name} className="flex flex-col items-center text-center">
              <h3 className="font-serif text-xl md:text-2xl text-charcoal mb-3">
                {service.name}
              </h3>
              <p className="text-warm-grey text-base leading-relaxed">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
