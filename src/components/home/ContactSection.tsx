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
      <div className="mx-auto max-w-5xl px-6">
        <h2
          id="contact-section-heading"
          className="font-serif text-3xl md:text-4xl text-charcoal mb-8 text-center"
        >
          Visit Us
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Contact Details */}
          <address className="not-italic text-charcoal space-y-4">
            <div>
              <h3 className="font-serif text-xl text-charcoal mb-1">Address</h3>
              <p className="text-warm-grey text-base leading-relaxed">
                {BUSINESS_INFO.address}
              </p>
            </div>

            <div>
              <h3 className="font-serif text-xl text-charcoal mb-1">Hours</h3>
              <p className="text-warm-grey text-base leading-relaxed">
                {BUSINESS_INFO.hours}
              </p>
            </div>

            <div>
              <h3 className="font-serif text-xl text-charcoal mb-1">Phone</h3>
              <a
                href={BUSINESS_INFO.phoneHref}
                className="text-charcoal underline underline-offset-2 hover:text-warm-grey transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal"
              >
                {BUSINESS_INFO.phone}
              </a>
            </div>

            <div>
              <h3 className="font-serif text-xl text-charcoal mb-1">Email</h3>
              <a
                href={BUSINESS_INFO.emailHref}
                className="text-charcoal underline underline-offset-2 hover:text-warm-grey transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal"
              >
                {BUSINESS_INFO.email}
              </a>
            </div>
          </address>

          {/* Embedded Map */}
          <div className="w-full min-h-[200px]">
            {mapError ? (
              <div
                className="flex items-center justify-center min-h-[200px] min-w-[300px] bg-cream rounded-lg border border-taupe p-6"
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
                className="w-full rounded-lg border border-taupe"
                style={{ minWidth: '300px', minHeight: '200px', height: '100%' }}
                width="100%"
                height="350"
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
