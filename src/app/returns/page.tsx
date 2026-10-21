import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Returns & Refunds',
  description: 'Lusso returns, exchange and refund policy. 14-day returns on unused products.',
};

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-[var(--theme-bg)]">
      <div className="max-w-3xl mx-auto px-6 py-16 sm:py-24">
        <h1 className="text-4xl font-bold text-[var(--theme-accent)] mb-2">Returns &amp; Refunds</h1>
        <p className="text-sm text-[var(--theme-accent)]/50 mb-12">Last updated: October 2026</p>

        <div className="space-y-10 text-[var(--theme-accent)]/80 leading-relaxed text-sm">

          <section className="rounded-xl border border-green-500/20 bg-green-500/5 px-5 py-4">
            <p className="font-medium text-green-400">We want you to love your Lusso candle. If something isn&apos;t right, we&apos;ll make it right.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--theme-accent)] mb-3">14-day return window</h2>
            <p>You may return unused, unopened products within <strong>14 days</strong> of the delivery date. Items must be in their original packaging and in a resaleable condition.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--theme-accent)] mb-3">What we accept</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Unused candles in original, sealed packaging</li>
              <li>Damaged or defective products (we cover return shipping)</li>
              <li>Incorrect items sent due to a picking error on our part</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--theme-accent)] mb-3">What we cannot accept</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Candles that have been lit or used</li>
              <li>Items returned after 14 days from delivery</li>
              <li>Custom or personalised orders</li>
              <li>Gift wrap charges</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--theme-accent)] mb-3">How to request a return</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Log in and go to <Link href="/dashboard" className="underline hover:no-underline">My Orders</Link>.</li>
              <li>Find the order and click &ldquo;Request return&rdquo;.</li>
              <li>Select the items to return and describe the reason.</li>
              <li>We will email you a return authorisation and shipping label within 2 business days.</li>
              <li>Ship the items using the provided label.</li>
              <li>Refund is processed within 5–10 business days of us receiving the return.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--theme-accent)] mb-3">Refund method</h2>
            <p>Approved refunds are returned to the original payment method via PayFast. Shipping fees are non-refundable unless the return is due to our error.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--theme-accent)] mb-3">Damaged in transit</h2>
            <p>If your order arrives damaged, email us at <a href="mailto:support@lusso.co.za" className="underline hover:no-underline">support@lusso.co.za</a> with a photo within 48 hours of delivery. We will arrange a replacement or refund at no cost to you.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--theme-accent)] mb-3">Questions?</h2>
            <p>Contact us at <a href="mailto:support@lusso.co.za" className="underline hover:no-underline">support@lusso.co.za</a> or via the <Link href="/contact" className="underline hover:no-underline">contact page</Link>.</p>
          </section>

        </div>
      </div>
    </div>
  );
}
