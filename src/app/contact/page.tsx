import type { Metadata } from 'next';
import { ContactForm } from '@/components/contact/ContactForm';
import { BUSINESS_INFO } from '@/lib/constants/brand';
import { EmbeddedMap } from './EmbeddedMap';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Get in touch with Lusso Candles. Send us a message, visit our studio in Centurion, or call us for custom orders, wholesale inquiries, and more.',
};

/**
 * Contact Page — server + client hybrid.
 *
 * Server Component rendering business info and SEO metadata,
 * with client components for the ContactForm and embedded map.
 *
 * Requirements: 13.1, 13.5, 13.6
 */
export default function ContactPage() {
  return (
    <div className="section-spacing">
      <div className="mx-auto max-w-6xl px-6">
        <h1 className="font-serif text-4xl md:text-5xl text-charcoal mb-12 text-center">
          Contact Us
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Contact Form */}
          <section aria-labelledby="contact-form-heading">
            <h2
              id="contact-form-heading"
              className="font-serif text-2xl text-charcoal mb-6"
            >
              Send a Message
            </h2>
            <ContactForm />
          </section>

          {/* Business Info & Map */}
          <section aria-labelledby="contact-info-heading">
            <h2
              id="contact-info-heading"
              className="font-serif text-2xl text-charcoal mb-6"
            >
              Visit Our Studio
            </h2>

            <address className="not-italic text-charcoal space-y-4 mb-8">
              <div>
                <h3 className="font-serif text-lg text-charcoal mb-1">
                  Address
                </h3>
                <p className="text-warm-grey text-base leading-relaxed">
                  {BUSINESS_INFO.address}
                </p>
              </div>

              <div>
                <h3 className="font-serif text-lg text-charcoal mb-1">
                  Hours
                </h3>
                <p className="text-warm-grey text-base leading-relaxed">
                  {BUSINESS_INFO.hours}
                </p>
              </div>

              <div>
                <h3 className="font-serif text-lg text-charcoal mb-1">
                  Phone
                </h3>
                <a
                  href={BUSINESS_INFO.phoneHref}
                  className="text-charcoal underline underline-offset-2 hover:text-warm-grey transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal"
                >
                  {BUSINESS_INFO.phone}
                </a>
              </div>

              <div>
                <h3 className="font-serif text-lg text-charcoal mb-1">
                  Email
                </h3>
                <a
                  href={BUSINESS_INFO.emailHref}
                  className="text-charcoal underline underline-offset-2 hover:text-warm-grey transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal"
                >
                  {BUSINESS_INFO.email}
                </a>
              </div>
            </address>

            {/* Embedded Map */}
            <div>
              <h3 className="font-serif text-lg text-charcoal mb-3">
                Find Us
              </h3>
              <EmbeddedMap />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
