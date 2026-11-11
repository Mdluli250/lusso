/**
 * WhyChooseLusso — displays the reasons to choose Lusso on the Home page.
 *
 * Async Server Component that fetches content from the CMS service.
 * Renders a heading and a two-column feature list that stacks vertically
 * below 768px.
 */
import { getContent, getContentJson } from "@/lib/cms/service";

const REASONS_FALLBACK: string[] = [
  "Hand-poured in small batches",
  "Premium soy & beeswax blends",
  "Long-lasting fragrance throw",
  "Elegant reusable vessels",
  "Thoughtfully curated scent collections",
  "Locally crafted in South Africa",
];

export async function Services() {
  const [heading, reasons] = await Promise.all([
    getContent("why_lusso.heading", "Why Choose Lusso?"),
    getContentJson<string[]>("why_lusso.items", REASONS_FALLBACK),
  ]);

  return (
    <section
      className="section-spacing bg-sand"
      aria-labelledby="why-lusso-heading"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <h2
          id="why-lusso-heading"
          className="font-serif text-2xl sm:text-3xl text-charcoal text-center mb-3"
        >
          {heading}
        </h2>
        <p className="text-warm-grey text-center text-sm lg:text-base mb-8 lg:mb-12 max-w-xl mx-auto">
          Every candle we make reflects our commitment to quality, craft, and care.
        </p>

        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 lg:gap-4">
          {reasons.map((reason) => (
            <li
              key={reason}
              className="flex items-start gap-3 p-4 rounded-xl bg-cream border border-[var(--brand-sand)] lg:p-5"
            >
              <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-charcoal/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-charcoal" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
              <span className="text-warm-grey text-sm leading-relaxed">{reason}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
