'use client';

import { useState } from 'react';
import { BUSINESS_INFO } from '@/lib/constants/brand';

/**
 * ContactSection — displays business contact details and an embedded map.
 *
 * Client Component (uses useState to track map load errors).
 * Renders address, hours, phone (tel: link), email (mailto: link),
 * and a Google Maps iframe with a text fallback on load failure.
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */
export function ContactSection() {
  const [mapError, setMapError] = useState(false);

  return (
    <section
      className="section-spacing bg-sand"
      aria-labelledby="contact-section-heading"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <h2
          id="contact-section-heading"
          className="font-serif text-2xl sm:text-3xl text-charcoal mb-3 text-center"
        >
          Visit Us
        </h2>
        <p className="text-warm-grey text-center text-sm lg:text-base mb-8 lg:mb-10 max-w-xl mx-auto">
          We'd love to meet you in person. Find us in Centurion.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Contact Details */}
          <address className="not-italic text-charcoal space-y-5">
            {[
              { label: "Address", value: BUSINESS_INFO.address },
              { label: "Hours", value: BUSINESS_INFO.hours },
            ].map(({ label, value }) => (
              <div key={label} className="border-b border-[var(--brand-sand)] pb-4">
                <h3 className="text-xs font-semibold tracking-widest uppercase text-warm-grey mb-1.5">{label}</h3>
                <p className="text-charcoal text-sm lg:text-base leading-relaxed">{value}</p>
              </div>
            ))}

            <div className="border-b border-[var(--brand-sand)] pb-4">
              <h3 className="text-xs font-semibold tracking-widest uppercase text-warm-grey mb-1.5">Phone</h3>
              <a
                href={BUSINESS_INFO.phoneHref}
                className="text-charcoal text-sm lg:text-base underline underline-offset-4 decoration-[var(--brand-taupe)] hover:decoration-charcoal transition-colors duration-150"
              >
                {BUSINESS_INFO.phone}
              </a>
            </div>

            <div>
              <h3 className="text-xs font-semibold tracking-widest uppercase text-warm-grey mb-1.5">Email</h3>
              <a
                href={BUSINESS_INFO.emailHref}
                className="text-charcoal text-sm lg:text-base underline underline-offset-4 decoration-[var(--brand-taupe)] hover:decoration-charcoal transition-colors duration-150"
              >
                {BUSINESS_INFO.email}
              </a>
            </div>
          </address>

          {/* Embedded Map */}
          <div className="w-full h-[280px] lg:h-[400px]">
            {mapError ? (
              <div
                className="flex items-center justify-center w-full h-full bg-cream rounded-2xl border border-[var(--brand-sand)] p-6"
                role="img"
                aria-label="Map showing business location"
              >
                <p className="text-warm-grey text-center text-base leading-relaxed">
                  {BUSINESS_INFO.address}
                </p>
              </div>
            ) : (
              <iframe
                src={BUSINESS_INFO.mapEmbedUrl}
                title="Lusso Candles location on Google Maps"
                className="w-full h-full rounded-2xl border border-[var(--brand-sand)]"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                onError={() => setMapError(true)}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
