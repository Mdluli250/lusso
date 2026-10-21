import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms and conditions governing the use of lusso.co.za and the purchase of Lusso products.',
};

const EFFECTIVE_DATE = '1 October 2026';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[var(--theme-bg)]">
      <div className="max-w-3xl mx-auto px-6 py-16 sm:py-24">
        <h1 className="text-4xl font-bold text-[var(--theme-accent)] mb-2">Terms of Service</h1>
        <p className="text-sm text-[var(--theme-accent)]/50 mb-12">Effective date: {EFFECTIVE_DATE}</p>

        <div className="space-y-10 text-[var(--theme-accent)]/80 leading-relaxed text-sm">

          <section>
            <h2 className="text-xl font-semibold text-[var(--theme-accent)] mb-3">1. Acceptance</h2>
            <p>By accessing lusso.co.za or placing an order you agree to these terms. If you do not agree, do not use the site.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--theme-accent)] mb-3">2. Products and pricing</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>All prices are in South African Rand (ZAR) and inclusive of VAT where applicable.</li>
              <li>We reserve the right to correct pricing errors. If your order is affected, we will contact you before processing payment.</li>
              <li>Product images are representative; actual colours may vary slightly due to screen settings and hand-poured production.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--theme-accent)] mb-3">3. Orders and payment</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Orders are accepted subject to availability. We will notify you if an item becomes unavailable after payment.</li>
              <li>Payment is processed via PayFast. We do not store card details.</li>
              <li>An order confirmation email is sent once payment is verified.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--theme-accent)] mb-3">4. Shipping and delivery</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>We deliver throughout South Africa. Standard shipping is R75; orders over R750 ship free.</li>
              <li>Estimated delivery is 3–7 business days after dispatch. Times may vary during peak periods.</li>
              <li>Risk of loss passes to you once the order is handed to the courier.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--theme-accent)] mb-3">5. Returns and refunds</h2>
            <p>Please read our <Link href="/returns" className="underline hover:no-underline">Returns Policy</Link> for full details. In summary:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Returns are accepted within 14 days of delivery for unused, unopened products.</li>
              <li>Damaged or defective items are replaced or refunded at our cost.</li>
              <li>Digital products and custom orders are non-refundable.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--theme-accent)] mb-3">6. Subscriptions</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Subscriptions are billed on a recurring basis according to your chosen frequency.</li>
              <li>You may pause or cancel a subscription at any time from your dashboard before the next billing date.</li>
              <li>We reserve the right to discontinue a subscription product with 30 days&apos; notice.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--theme-accent)] mb-3">7. Intellectual property</h2>
            <p>All content on this website — including text, images, logos, and design — is owned by or licensed to Lusso Candles (Pty) Ltd. You may not reproduce or redistribute it without written permission.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--theme-accent)] mb-3">8. Limitation of liability</h2>
            <p>To the maximum extent permitted by law, Lusso&apos;s liability for any claim arising from use of the site or our products is limited to the value of the order giving rise to the claim.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--theme-accent)] mb-3">9. Governing law</h2>
            <p>These terms are governed by the laws of the Republic of South Africa. Disputes will be resolved in the courts of South Africa.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--theme-accent)] mb-3">10. Contact</h2>
            <p>Questions? Email <a href="mailto:legal@lusso.co.za" className="underline hover:no-underline">legal@lusso.co.za</a>.</p>
          </section>

        </div>
      </div>
    </div>
  );
}
