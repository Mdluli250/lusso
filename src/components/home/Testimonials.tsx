import { getContentJson } from '@/lib/cms/service';
import { TESTIMONIALS } from '@/lib/constants/brand';

/**
 * Testimonials — customer reviews section on the Home page.
 *
 * Async Server Component that fetches testimonial data from the CMS,
 * falling back to the TESTIMONIALS constant when the DB is unavailable
 * or the content block is absent.
 *
 * Requirements: 2.1, 2.2, 2.3, 7.4
 */
export async function Testimonials() {
  const testimonials = await getContentJson<Array<{ quote: string; name: string }>>(
    'testimonials',
    [...TESTIMONIALS]
  );

  return (
    <section className="section-spacing bg-cream" aria-labelledby="testimonials-heading">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <h2
          id="testimonials-heading"
          className="font-serif text-2xl sm:text-3xl text-charcoal text-center mb-3"
        >
          What Our Customers Say
        </h2>
        <p className="text-warm-grey text-center text-sm lg:text-base mb-10 lg:mb-12 max-w-xl mx-auto">
          Thousands of homes across South Africa lit by Lusso.
        </p>

        <div className="grid gap-5 md:grid-cols-3 lg:gap-6">
          {testimonials.map((testimonial) => (
            <blockquote
              key={testimonial.name}
              className="flex flex-col items-center text-center p-5 lg:p-6 rounded-2xl bg-sand border border-[var(--brand-sand)]"
            >
              <div className="flex text-amber-500 text-xs mb-3" aria-label="5 out of 5 stars">
                {"★★★★★"}
              </div>
              <p className="font-serif text-base text-charcoal leading-relaxed italic mb-4 flex-1">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
              <cite className="not-italic text-xs font-semibold tracking-widest uppercase text-warm-grey">
                — {testimonial.name}
              </cite>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
