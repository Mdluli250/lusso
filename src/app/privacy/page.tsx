import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Lusso collects, uses and protects your personal information in accordance with POPIA.',
  robots: { index: true, follow: true },
};

const EFFECTIVE_DATE = '1 October 2026';
const CONTACT_EMAIL = 'privacy@lusso.co.za';
const COMPANY = 'Lusso Candles (Pty) Ltd';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--theme-bg)]">
      <div className="max-w-3xl mx-auto px-6 py-16 sm:py-24">
        <h1 className="text-4xl font-bold text-[var(--theme-accent)] mb-2">Privacy Policy</h1>
        <p className="text-sm text-[var(--theme-accent)]/50 mb-12">Effective date: {EFFECTIVE_DATE}</p>

        <div className="prose prose-sm max-w-none space-y-10 text-[var(--theme-accent)]/80 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-[var(--theme-accent)] mb-3">1. Who we are</h2>
            <p>{COMPANY} (&ldquo;Lusso&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) operates the website lusso.co.za. This policy explains how we handle personal information in accordance with the Protection of Personal Information Act 4 of 2013 (&ldquo;POPIA&rdquo;).</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--theme-accent)] mb-3">2. Information we collect</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Account information:</strong> name, email address, and password (hashed) when you create an account.</li>
              <li><strong>Order information:</strong> delivery address, order contents, and payment reference numbers.</li>
              <li><strong>Payment data:</strong> we never store card details. Payments are processed by PayFast. Only a transaction reference is retained.</li>
              <li><strong>Usage data:</strong> pages visited, products viewed, and search queries — used to improve recommendations.</li>
              <li><strong>Communications:</strong> messages sent via our contact form or email.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--theme-accent)] mb-3">3. How we use your information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Processing and fulfilling orders, including shipping and invoicing.</li>
              <li>Sending transactional emails (order confirmation, dispatch notifications).</li>
              <li>Improving our website and personalising product recommendations.</li>
              <li>Responding to customer service enquiries.</li>
              <li>Sending marketing emails — only with your explicit consent; unsubscribe at any time.</li>
              <li>Complying with legal obligations under South African law.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--theme-accent)] mb-3">4. Sharing your information</h2>
            <p>We do not sell your personal information. We share it only with:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>PayFast</strong> — to process payments securely.</li>
              <li><strong>Resend</strong> — to deliver transactional emails.</li>
              <li><strong>Vercel</strong> — our hosting provider; data is processed in accordance with their DPA.</li>
              <li>Law enforcement or regulatory bodies when required by law.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--theme-accent)] mb-3">5. Data retention</h2>
            <p>We retain order and account data for 5 years to meet tax and consumer protection obligations. You may request earlier deletion of your account data, subject to any outstanding obligations.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--theme-accent)] mb-3">6. Your rights under POPIA</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Right to access the personal information we hold about you.</li>
              <li>Right to correct inaccurate information.</li>
              <li>Right to request deletion of your account (subject to legal retention requirements).</li>
              <li>Right to object to direct marketing at any time.</li>
              <li>Right to lodge a complaint with the Information Regulator.</li>
            </ul>
            <p className="mt-3">To exercise your rights, email us at <a href={`mailto:${CONTACT_EMAIL}`} className="underline hover:no-underline">{CONTACT_EMAIL}</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--theme-accent)] mb-3">7. Cookies</h2>
            <p>We use strictly necessary cookies for session management and authentication. We do not use third-party advertising or tracking cookies. Theme preferences are stored in <code className="text-xs bg-[var(--theme-accent)]/10 px-1 py-0.5 rounded">localStorage</code>.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--theme-accent)] mb-3">8. Security</h2>
            <p>We use industry-standard measures including HTTPS, bcrypt password hashing, and parameterised database queries. No method of transmission is 100% secure; we encourage strong passwords and prompt reporting of any suspected breach.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--theme-accent)] mb-3">9. Changes to this policy</h2>
            <p>We may update this policy from time to time. Material changes will be communicated by email or a prominent notice on the website at least 14 days before they take effect.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--theme-accent)] mb-3">10. Contact</h2>
            <p>Information Officer: <a href={`mailto:${CONTACT_EMAIL}`} className="underline hover:no-underline">{CONTACT_EMAIL}</a></p>
            <p className="mt-1">Information Regulator (South Africa): <a href="https://inforegulator.org.za" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">inforegulator.org.za</a></p>
          </section>
        </div>
      </div>
    </div>
  );
}
