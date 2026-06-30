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
      <div className="mx-auto max-w-6xl px-6">
        <h2
          id="why-lusso-heading"
          className="font-serif text-3xl md:text-4xl text-charcoal text-center mb-10"
        >
          {heading}
        </h2>

        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {reasons.map((reason) => (
            <li
              key={reason}
              className="flex items-start gap-3 text-warm-grey text-base leading-relaxed"
            >
              <span className="mt-1 text-xl text-charcoal">✓</span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
