/**
 * Site-wide footer.
 * Displays business hours, sustainability note, social media links,
 * contact information, and attribution.
 * Requirements: 2.1, 2.2, 7.7, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 16.3, 16.4
 */
import Link from 'next/link';
import { BUSINESS_INFO, SOCIAL_LINKS } from '@/lib/constants/brand';
import { getContentSection } from '@/lib/cms/service';

export default async function Footer() {
  const year = new Date().getFullYear();

  // Fetch business_info.* keys with fallbacks from BUSINESS_INFO constant
  const businessInfoFallbacks: Record<string, string> = {
    'business_info.address': BUSINESS_INFO.address,
    'business_info.hours': BUSINESS_INFO.hours,
    'business_info.phone': BUSINESS_INFO.phone,
    'business_info.phone_href': BUSINESS_INFO.phoneHref,
    'business_info.email': BUSINESS_INFO.email,
    'business_info.email_href': BUSINESS_INFO.emailHref,
    'business_info.map_embed_url': BUSINESS_INFO.mapEmbedUrl,
  };

  // Fetch footer.* keys with fallbacks from current hardcoded strings
  const footerFallbacks: Record<string, string> = {
    'footer.sustainability_text':
      'Crafted with sustainably sourced materials. We are committed to eco-conscious practices in every pour.',
    'footer.newsletter_heading': 'Join Our Inner Circle',
    'footer.newsletter_subtext':
      'Early access to new scents, exclusive offers, and candle care tips.',
  };

  const [businessInfo, footerContent] = await Promise.all([
    getContentSection('business_info', businessInfoFallbacks),
    getContentSection('footer', footerFallbacks),
  ]);

  return (
    <footer
      className={[
        'mt-auto',
        'bg-[var(--theme-bg)] text-[var(--theme-accent)]',
        'border-t border-[var(--border)]',
        'transition-colors duration-[600ms]',
      ].join(' ')}
      role="contentinfo"
    >
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Newsletter signup */}
        <div className="mb-8 pb-8 border-b border-[var(--border)]">
          <div className="max-w-md">
            <h2 className="text-sm font-semibold mb-2">
              {footerContent.get('footer.newsletter_heading')}
            </h2>
            <p className="text-sm opacity-70 mb-3">
              {footerContent.get('footer.newsletter_subtext')}
            </p>
            <form className="flex gap-2" action="/api/email-capture" method="POST">
              <input
                type="email"
                name="email"
                placeholder="your@email.com"
                className="flex-1 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--theme-bg)] text-[var(--theme-accent)] text-sm placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/30"
              />
              <button type="submit" className="px-4 py-2 rounded-lg bg-[var(--theme-accent)] text-cream text-sm font-medium hover:opacity-90 transition-opacity">
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand & Sustainability */}
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-tight">
              <svg
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-4 w-4 shrink-0"
              >
                <path
                  fillRule="evenodd"
                  d="M12.963 2.286a.75.75 0 0 0-1.071-.136 9.742 9.742 0 0 0-3.539 6.176 7.547 7.547 0 0 1-1.705-1.715.75.75 0 0 0-1.152-.082A9 9 0 1 0 15.68 4.534a7.46 7.46 0 0 1-2.717-2.248ZM15.75 14.25a3.75 3.75 0 1 1-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 0 1 1.925-3.546 3.75 3.75 0 0 1 3.255 3.718Z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Lusso</span>
            </div>
            <p className="text-sm opacity-70 mb-3">
              {footerContent.get('footer.sustainability_text')}
            </p>
            <div className="flex flex-col gap-1 text-xs opacity-60">
              <span>🕯️ Hand-poured in Centurion, SA</span>
              <span>🔒 Secure checkout</span>
              <span>🌿 Sustainably sourced</span>
            </div>
          </div>

          {/* Business Hours */}
          <div>
            <h2 className="mb-3 text-sm font-semibold">Hours</h2>
            <p className="text-sm opacity-70">
              {businessInfo.get('business_info.hours')}
            </p>
          </div>

          {/* Quick Nav Links */}
          <div>
            <h2 className="mb-3 text-sm font-semibold">Explore</h2>
            <ul className="space-y-2 text-sm opacity-70">
              {[
                { href: '/collection', label: 'Shop Candles' },
                { href: '/bundle', label: 'Build a Bundle' },
                { href: '/quiz', label: 'Find Your Scent' },
                { href: '/compare', label: 'Compare Scents' },
                { href: '/about', label: 'Our Story' },
                { href: '/experiences', label: 'Experiences' },
                { href: '/contact', label: 'Contact' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="hover:opacity-100 transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-accent)] rounded-sm"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h2 className="mb-3 text-sm font-semibold">Contact</h2>
            <address className="not-italic text-sm opacity-70 space-y-1">
              <p>{businessInfo.get('business_info.address')}</p>
              <p>
                <a
                  href={businessInfo.get('business_info.phone_href')}
                  className="inline-flex min-h-[44px] items-center underline underline-offset-2 hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-accent)] rounded-sm"
                >
                  {businessInfo.get('business_info.phone')}
                </a>
              </p>
              <p>
                <a
                  href={businessInfo.get('business_info.email_href')}
                  className="inline-flex min-h-[44px] items-center underline underline-offset-2 hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-accent)] rounded-sm"
                >
                  {businessInfo.get('business_info.email')}
                </a>
              </p>
            </address>
          </div>

          {/* Social Media Links */}
          <div>
            <h2 className="mb-3 text-sm font-semibold">Follow Us</h2>
            <ul className="flex gap-3">
              {SOCIAL_LINKS.map((link) => (
                <li key={link.platform}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Follow us on ${link.platform}`}
                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md opacity-70 hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-accent)]"
                  >
                    <SocialIcon platform={link.icon} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar: copyright + attribution */}
        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-[var(--border)] pt-6 sm:flex-row">
          <p className="text-xs opacity-50">
            &copy; {year} Lusso. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({ platform }: { platform: string }) {
  switch (platform) {
    case 'instagram':
      return (
        <svg
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-5 w-5"
        >
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
      );
    case 'tiktok':
      return (
        <svg
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-5 w-5"
        >
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.88 2.89 2.89 0 01-2.88-2.88 2.89 2.89 0 012.88-2.88c.28 0 .56.04.82.11V9.4a6.33 6.33 0 00-.82-.05A6.34 6.34 0 003.15 15.7a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V9.42a8.16 8.16 0 004.76 1.52V7.5a4.85 4.85 0 01-1-.81z" />
        </svg>
      );
    case 'facebook':
      return (
        <svg
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-5 w-5"
        >
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    default:
      return <span>{platform}</span>;
  }
}
