'use client';

/**
 * HeroSection — brand landing hero for the Home Page.
 *
 * - Renders h1 "Quiet Luxury Candles"
 * - Subheading mentioning "Lusso Picnic" (≤150 chars)
 * - "Shop now" CTA → /collection
 * - Full-viewport background image with parallax scroll effect
 * - GSAP staggered entrance animation + scroll-driven parallax
 * - Min-height 100vh, full-width, no horizontal overflow
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

const HERO_BG_IMAGE = '/images/gallery/styled-trio-1.png';

export function HeroSection() {
  const [imageError, setImageError] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subtextRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let tl: { kill: () => void } | null = null;

    Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(
      ([{ default: gsap }, { ScrollTrigger }]) => {
        gsap.registerPlugin(ScrollTrigger);
        tl = gsap.timeline({ delay: 0.3 });

        if (headingRef.current) {
          gsap.set(headingRef.current, { opacity: 0, y: 40, scale: 0.97 });
          (tl as ReturnType<typeof gsap.timeline>).to(headingRef.current, { opacity: 1, y: 0, scale: 1, duration: 1, ease: 'power3.out' });
        }
        if (subtextRef.current) {
          gsap.set(subtextRef.current, { opacity: 0, y: 30 });
          (tl as ReturnType<typeof gsap.timeline>).to(subtextRef.current, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, '-=0.6');
        }
        if (ctaRef.current) {
          gsap.set(ctaRef.current, { opacity: 0, y: 20, scale: 0.95 });
          (tl as ReturnType<typeof gsap.timeline>).to(ctaRef.current, { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'power2.out' }, '-=0.5');
        }
        if (imageRef.current && sectionRef.current) {
          gsap.to(imageRef.current, { yPercent: 20, ease: 'none', scrollTrigger: { trigger: sectionRef.current, start: 'top top', end: 'bottom top', scrub: true } });
        }
        if (contentRef.current && sectionRef.current) {
          gsap.to(contentRef.current, { yPercent: -30, opacity: 0, ease: 'none', scrollTrigger: { trigger: sectionRef.current, start: 'top top', end: 'bottom top', scrub: true } });
        }
      }
    );

    return () => {
      tl?.kill();
      import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
        ScrollTrigger.getAll().forEach((t) => { if (t.trigger === sectionRef.current) t.kill(); });
      });
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden"
      style={{
        backgroundColor: 'var(--brand-cream)',
      }}
      aria-label="Hero section — Lusso Candles"
    >
      {/* Background image with parallax */}
      {!imageError && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={imageRef}
          src={HERO_BG_IMAGE}
          alt=""
          role="presentation"
          onError={() => setImageError(true)}
          className="absolute inset-0 h-[120%] w-full object-cover will-change-transform"
          style={{ top: '-10%' }}
        />
      )}

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Content overlay with parallax */}
      <div
        ref={contentRef}
        className="relative z-10 flex flex-col items-center gap-6 px-6 text-center will-change-transform"
      >
        <h1
          ref={headingRef}
          className="font-serif text-4xl font-bold leading-tight tracking-tight text-white drop-shadow-lg sm:text-5xl md:text-6xl lg:text-7xl"
        >
          Quiet Luxury Candles
        </h1>

        <p
          ref={subtextRef}
          className="max-w-lg text-lg leading-relaxed text-white/90 drop-shadow-md sm:text-xl"
        >
          Born from Lusso Picnic, we craft hand-poured candles with premium waxes and fine fragrances — quiet luxury for your everyday moments.
        </p>

        <Link
          ref={ctaRef}
          href="/collection"
          className="mt-4 inline-flex min-h-[44px] min-w-[120px] items-center justify-center rounded-lg bg-white/95 px-8 py-3 text-lg font-semibold text-[var(--brand-charcoal)] shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Shop now
        </Link>
      </div>
    </section>
  );
}
