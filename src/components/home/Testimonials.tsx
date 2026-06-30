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
    <section className="section-spacing bg-sand" aria-labelledby="testimonials-heading">
      <div className="mx-auto max-w-4xl px-6">
        <h2
          id="testimonials-heading"
          className="font-serif text-3xl md:text-4xl text-charcoal text-center mb-12"
        >
          Reviews
        </h2>

        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <blockquote
              key={testimonial.name}
              className="flex flex-col items-center text-center"
            >
              <p className="font-serif text-lg md:text-xl text-charcoal leading-relaxed italic mb-4">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
              <cite className="not-italic text-sm font-semibold tracking-wide uppercase text-warm-grey">
                {testimonial.name}
              </cite>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
