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
      className="relative flex min-h-[85svh] w-full items-center justify-center overflow-hidden sm:min-h-screen"
      style={{ backgroundColor: 'var(--brand-cream)' }}
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

      {/* Gradient overlay — stronger at bottom for readability, lighter at top */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-black/10" />

      {/* Content */}
      <div
        ref={contentRef}
        className="relative z-10 mx-auto w-full max-w-4xl flex flex-col items-center gap-5 px-6 text-center will-change-transform sm:gap-7 sm:px-10 lg:px-16"
      >
        <h1
          ref={headingRef}
          className="font-serif text-3xl font-bold leading-[1.15] tracking-tight text-white drop-shadow-lg sm:text-5xl lg:text-6xl xl:text-7xl"
        >
          {heading}
        </h1>

        <p
          ref={subtextRef}
          className="max-w-sm text-base leading-relaxed text-white/85 drop-shadow-md sm:max-w-lg sm:text-lg"
        >
          {subtext}
        </p>

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4 mt-2">
          <Link
            ref={ctaRef}
            href="/collection"
            className="inline-flex min-h-[52px] min-w-[180px] items-center justify-center rounded-xl bg-white/95 px-10 py-3.5 text-base font-semibold text-[var(--brand-charcoal)] shadow-xl backdrop-blur-sm transition-all hover:bg-white hover:scale-[1.03] hover:shadow-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white lg:text-lg"
          >
            {ctaLabel}
          </Link>
          <Link
            href="/about"
            className="inline-flex min-h-[52px] min-w-[160px] items-center justify-center rounded-xl border-2 border-white/50 px-8 py-3.5 text-base font-medium text-white/90 backdrop-blur-sm transition-all hover:border-white hover:text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white lg:text-lg"
          >
            Our Story
          </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/50" aria-hidden="true">
        <span className="text-xs tracking-widest uppercase">Scroll</span>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 animate-bounce">
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </div>
    </section>
  );
}
