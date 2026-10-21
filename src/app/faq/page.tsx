import type { Metadata } from 'next';
import Link from 'next/link';
import { FaqAccordion } from './FaqAccordion';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Answers to common questions about Lusso candles — shipping, care, subscriptions, returns, and more.',
};

const FAQ_SECTIONS = [
  {
    heading: 'Ordering & Shipping',
    items: [
      {
        q: 'How long does delivery take?',
        a: 'Standard delivery across South Africa takes 3–7 business days after dispatch. You will receive a dispatch email with a tracking number once your order ships.',
      },
      {
        q: 'How much does shipping cost?',
        a: 'Standard shipping is R75. Orders over R750 ship for free automatically.',
      },
      {
        q: 'Do you ship outside South Africa?',
        a: 'Not yet — we currently only deliver within South Africa. International shipping is on our roadmap.',
      },
      {
        q: 'Can I change my delivery address after ordering?',
        a: 'Email support@lusso.co.za as soon as possible. We can update the address if the order has not yet been dispatched.',
      },
      {
        q: 'How do I track my order?',
        a: 'Once your order ships, you will receive a dispatch email with your carrier name and tracking number. You can also view tracking details in your Dashboard under My Orders.',
      },
    ],
  },
  {
    heading: 'Products & Candle Care',
    items: [
      {
        q: 'What wax do you use?',
        a: 'We use premium soy wax and beeswax blends, depending on the candle. The wax type is listed on every product page.',
      },
      {
        q: 'How long do Lusso candles burn?',
        a: 'Burn time varies by candle — each product page lists the expected hours. On average, our candles burn for 40–60 hours.',
      },
      {
        q: 'How do I care for my candle?',
        a: 'Trim the wick to 5mm before every burn. Allow the wax to melt to the edge on the first burn (the "memory burn") to prevent tunnelling. Never burn for more than 4 hours at a time. Visit our Candle Care guide for full instructions.',
      },
      {
        q: 'Are your fragrances safe?',
        a: 'Yes. We use phthalate-free fragrance oils that comply with IFRA safety standards. Our candles are not recommended for use around pets or young children without adequate ventilation.',
      },
      {
        q: 'Can I reuse the jar?',
        a: 'Absolutely — we encourage it. Once the candle is finished, pop the jar in the freezer for 30 minutes, remove the remaining wax, wash with warm soapy water, and use as a planter, pen holder, or glasses.',
      },
    ],
  },
  {
    heading: 'Subscriptions',
    items: [
      {
        q: 'How do subscriptions work?',
        a: 'Choose a product and a frequency (monthly, bi-monthly, or quarterly). We will automatically dispatch a fresh candle on schedule and charge your saved payment method. You get 10% off every delivery.',
      },
      {
        q: 'Can I pause or cancel my subscription?',
        a: 'Yes. Go to Dashboard → Subscriptions and pause or cancel at any time. Changes made before the next billing date take effect immediately.',
      },
      {
        q: 'What happens if my payment fails?',
        a: 'We will pause your subscription and email you. You can update your payment details and resume from your dashboard.',
      },
    ],
  },
  {
    heading: 'Returns & Refunds',
    items: [
      {
        q: 'What is your return policy?',
        a: 'We accept returns of unused, unopened candles within 14 days of delivery. See our full Returns Policy for details.',
      },
      {
        q: 'My candle arrived damaged — what do I do?',
        a: 'Email support@lusso.co.za with a photo within 48 hours of delivery. We will arrange a replacement or refund at no cost to you.',
      },
      {
        q: 'When will my refund appear?',
        a: 'Refunds are processed within 5–10 business days of us receiving the returned item. The time to appear in your account depends on your bank.',
      },
    ],
  },
  {
    heading: 'Account & Payments',
    items: [
      {
        q: 'Do I need an account to order?',
        a: 'Yes — an account is required to place an order so we can link your order history, delivery address, and manage any returns.',
      },
      {
        q: 'What payment methods do you accept?',
        a: 'We accept all major credit and debit cards, EFT, and instant EFT via PayFast. Card details are never stored on our servers.',
      },
      {
        q: 'Is my payment secure?',
        a: 'Yes. All payments are processed by PayFast, a PCI DSS-compliant payment gateway. We only store a transaction reference number.',
      },
      {
        q: 'How do discount codes work?',
        a: 'Add your code in the cart before checkout. Codes can offer a percentage off, a fixed amount, or free shipping. Only one code of each type may be applied per order.',
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-[var(--theme-bg)]">
      <div className="max-w-3xl mx-auto px-6 py-16 sm:py-24">
        <h1 className="text-4xl font-bold text-[var(--theme-accent)] mb-3">Frequently Asked Questions</h1>
        <p className="text-[var(--theme-accent)]/60 mb-12">Can&apos;t find what you&apos;re looking for? <Link href="/contact" className="underline hover:no-underline">Contact us</Link>.</p>

        <div className="space-y-12">
          {FAQ_SECTIONS.map((section) => (
            <div key={section.heading}>
              <h2 className="text-lg font-semibold text-[var(--theme-accent)] mb-4 pb-2 border-b border-[var(--theme-accent)]/15">
                {section.heading}
              </h2>
              <FaqAccordion items={section.items} />
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-xl border border-[var(--theme-accent)]/15 bg-[var(--theme-accent)]/5 px-6 py-5 text-center space-y-2">
          <p className="font-medium text-[var(--theme-accent)]">Still have questions?</p>
          <p className="text-sm text-[var(--theme-accent)]/60">Our team is happy to help.</p>
          <Link
            href="/contact"
            className="inline-block mt-2 px-5 py-2.5 rounded-lg bg-[var(--theme-accent)] text-cream text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Get in touch
          </Link>
        </div>
      </div>
    </div>
  );
}
