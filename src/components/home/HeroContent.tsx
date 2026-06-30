'use client';

/**
 * HeroContent — Client component for the hero section.
 *
 * Receives CMS content as props from the server wrapper and handles
 * all client-side interactivity (GSAP animations, parallax scroll, image error state).
 *
 * Requirements: 2.1, 2.2, 7.3
 */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

export interface HeroContentProps {
  heading: string;
  subtext: string;
  ctaLabel: string;
  bgImage: string;
}

export function HeroContent({ heading, subtext, ctaLabel, bgImage }: HeroContentProps) {
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
          src={bgImage}
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
          {heading}
        </h1>

        <p
          ref={subtextRef}
          className="max-w-lg text-lg leading-relaxed text-white/90 drop-shadow-md sm:text-xl"
        >
          {subtext}
        </p>

        <Link
          ref={ctaRef}
          href="/collection"
          className="mt-4 inline-flex min-h-[44px] min-w-[120px] items-center justify-center rounded-lg bg-white/95 px-8 py-3 text-lg font-semibold text-[var(--brand-charcoal)] shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {ctaLabel}
        </Link>
      </div>
    </section>
  );
}
