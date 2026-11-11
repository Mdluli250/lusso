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
      <div className="mx-auto max-w-5xl px-6 lg:px-10">
        <h1 className="font-serif text-3xl sm:text-4xl text-charcoal mb-10 text-center">
          Contact Us
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Contact Form */}
          <section aria-labelledby="contact-form-heading">
            <h2
              id="contact-form-heading"
              className="text-base font-semibold text-[var(--theme-accent)] mb-5 uppercase tracking-widest"
            >
              Send a Message
            </h2>
            <ContactForm />
          </section>

          {/* Business Info & Map */}
          <section aria-labelledby="contact-info-heading">
            <h2
              id="contact-info-heading"
              className="text-base font-semibold text-[var(--theme-accent)] mb-5 uppercase tracking-widest"
            >
              Visit Our Studio
            </h2>

            <address className="not-italic text-charcoal space-y-5 mb-8">
              {[
                { label: 'Address', value: BUSINESS_INFO.address },
                { label: 'Hours', value: BUSINESS_INFO.hours },
              ].map(({ label, value }) => (
                <div key={label} className="border-b border-[var(--brand-sand)] pb-4">
                  <h3 className="text-xs font-semibold tracking-widest uppercase text-[var(--muted)] mb-1.5">{label}</h3>
                  <p className="text-sm lg:text-base text-charcoal leading-relaxed">{value}</p>
                </div>
              ))}

              <div className="border-b border-[var(--brand-sand)] pb-4">
                <h3 className="text-xs font-semibold tracking-widest uppercase text-[var(--muted)] mb-1.5">Phone</h3>
                <a
                  href={BUSINESS_INFO.phoneHref}
                  className="text-sm lg:text-base text-charcoal underline underline-offset-2 hover:text-[var(--muted)] transition-colors"
                >
                  {BUSINESS_INFO.phone}
                </a>
              </div>

              <div>
                <h3 className="text-xs font-semibold tracking-widest uppercase text-[var(--muted)] mb-1.5">Email</h3>
                <a
                  href={BUSINESS_INFO.emailHref}
                  className="text-sm lg:text-base text-charcoal underline underline-offset-2 hover:text-[var(--muted)] transition-colors"
                >
                  {BUSINESS_INFO.email}
                </a>
              </div>
            </address>

            {/* Embedded Map */}
            <div>
              <h3 className="text-xs font-semibold tracking-widest uppercase text-[var(--muted)] mb-3">
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
