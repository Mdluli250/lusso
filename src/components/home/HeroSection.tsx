'use client';

/**
 * HeroSection — immersive 3D hero component for the Home Page.
 *
 * - Renders CandleViewer with scroll-driven rotation
 * - Initialises AnimationEngine hero rotation on mount
 * - Wires scroll-driven color theme shifts for lavender and cinnamon scent sections
 * - Displays headline copy and a CTA link to /collection
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import * as THREE from 'three';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import gsap from 'gsap';
import { CandleViewer } from '@/components/three/CandleViewer';
import { animationEngine } from '@/components/animation/AnimationEngine';
import { getColorTheme } from '@/lib/scentColorMap';

// ─── Scent sections ───────────────────────────────────────────────
// Each section defines the scroll progress range [start, end] at which
// the color theme should transition to that scent's palette.

interface ScentSection {
  name: string;
  start: number; // scroll progress [0, 1]
  end: number;
}

const SCENT_SECTIONS: ScentSection[] = [
  { name: 'lavender', start: 0, end: 0.5 },
  { name: 'cinnamon', start: 0.5, end: 1 },
];

// ─── HeroSection ─────────────────────────────────────────────────

export function HeroSection() {
  const candleRef = useRef<THREE.Group | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);
  const headlineRef = useRef<HTMLHeadingElement | null>(null);
  const subtitleRef = useRef<HTMLParagraphElement | null>(null);
  const ctaRef = useRef<HTMLAnchorElement | null>(null);
  const candleWrapperRef = useRef<HTMLDivElement | null>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Initialise scroll-driven candle rotation
    animationEngine.initHeroRotation(candleRef, containerRef);

    // Wire color theme shifts as scroll progresses through scent sections.
    if (!containerRef.current) return;

    // Apply the initial theme immediately (lavender at scroll 0)
    const initialTheme = getColorTheme(SCENT_SECTIONS[0].name);
    animationEngine.animateColorTheme(initialTheme.bg, initialTheme.accent);

    // ─── GSAP Parallax Effects ────────────────────────────────────
    // Each element moves at a different speed on scroll for depth illusion.
    const parallaxTriggers: globalThis.ScrollTrigger[] = [];

    // Headline moves up faster (parallax speed: -200px over scroll)
    if (headlineRef.current) {
      parallaxTriggers.push(
        ScrollTrigger.create({
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1.5,
          animation: gsap.to(headlineRef.current, {
            y: -200,
            opacity: 0,
            ease: 'power1.out',
          }),
        }),
      );
    }

    // Subtitle moves slightly slower than headline
    if (subtitleRef.current) {
      parallaxTriggers.push(
        ScrollTrigger.create({
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1.5,
          animation: gsap.to(subtitleRef.current, {
            y: -150,
            opacity: 0,
            ease: 'power1.out',
          }),
        }),
      );
    }

    // CTA button moves even slower — creates layered depth
    if (ctaRef.current) {
      parallaxTriggers.push(
        ScrollTrigger.create({
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1.5,
          animation: gsap.to(ctaRef.current, {
            y: -100,
            opacity: 0,
            ease: 'power1.out',
          }),
        }),
      );
    }

    // 3D candle moves slowest — appears to recede into background
    if (candleWrapperRef.current) {
      parallaxTriggers.push(
        ScrollTrigger.create({
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1.8,
          animation: gsap.to(candleWrapperRef.current, {
            scale: 0.95,
            opacity: 0.8,
            ease: 'power1.out',
          }),
        }),
      );
    }

    // Scroll indicator fades out quickly
    if (scrollIndicatorRef.current) {
      parallaxTriggers.push(
        ScrollTrigger.create({
          trigger: containerRef.current,
          start: 'top top',
          end: '20% top',
          scrub: 1.2,
          animation: gsap.to(scrollIndicatorRef.current, {
            opacity: 0,
            y: 20,
            ease: 'power1.out',
          }),
        }),
      );
    }

    // ─── Color Theme Scroll Trigger ───────────────────────────────
    let lastSectionName = SCENT_SECTIONS[0].name;

    const colorTrigger = ScrollTrigger.create({
      trigger: containerRef.current,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        const progress = self.progress;

        const activeSection = SCENT_SECTIONS.find(
          (section) => progress >= section.start && progress <= section.end,
        );

        if (activeSection && activeSection.name !== lastSectionName) {
          lastSectionName = activeSection.name;
          const theme = getColorTheme(activeSection.name);
          animationEngine.animateColorTheme(theme.bg, theme.accent);
        }
      },
    });

    return () => {
      colorTrigger.kill();
      parallaxTriggers.forEach((t) => t.kill());
      animationEngine.destroy();
    };
  }, []);

  return (
    <section
      ref={containerRef as React.RefObject<HTMLElement>}
      className="relative min-h-screen flex flex-col items-center justify-center bg-[var(--theme-bg)] transition-colors duration-700"
      aria-label="Hero section — Lusso"
    >
      {/* 3D Candle Viewer — centered, takes up most of the viewport */}
      <div ref={candleWrapperRef} className="absolute inset-0 z-0 flex items-center justify-center will-change-transform">
        <div className="w-full h-full max-w-2xl mx-auto">
          <CandleViewer
            modelPath="/models/hero-candle.glb"
            scrollDriven={true}
            className="w-full h-full"
          />
        </div>
      </div>

      {/* Overlay content — headline and CTA */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-6 text-center pointer-events-none -mt-24">
        <h1
          ref={headlineRef}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight text-[var(--theme-accent)] will-change-transform"
        >
          Handcrafted Candles,
          <br />
          Quiet Luxury
        </h1>

        <p
          ref={subtitleRef}
          className="max-w-md text-lg sm:text-xl text-[var(--theme-accent)]/70 leading-relaxed will-change-transform"
        >
          Elevate your space with scent, warmth, and lasting beauty.
        </p>

        {/* CTA button — pointer-events re-enabled so it's clickable */}
        <Link
          ref={ctaRef}
          href="/collection"
          className={[
            'pointer-events-auto will-change-transform',
            'inline-flex items-center justify-center gap-2',
            'px-8 py-4 rounded-xl',
            'bg-white text-gray-900',
            'font-semibold text-lg leading-normal',
            'shadow-lg',
            'transition-all duration-150',
            'hover:opacity-90 active:opacity-80',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-accent)]',
          ].join(' ')}
          aria-label="Browse the candle collection"
        >
          Shop the Collection
        </Link>

        {/* Secondary CTA — Scent Quiz */}
        <Link
          href="/quiz"
          className={[
            'pointer-events-auto will-change-transform',
            'text-[var(--theme-accent)]/80 font-medium text-base',
            'transition-opacity duration-150',
            'hover:opacity-80',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-accent)]',
          ].join(' ')}
        >
          Take the Scent Quiz →
        </Link>
      </div>

      {/* Scroll indicator */}
      <div
        ref={scrollIndicatorRef}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[var(--theme-accent)]/60 animate-bounce will-change-transform"
        aria-hidden="true"
      >
        <span className="text-sm font-medium tracking-widest uppercase">Scroll</span>
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
          className="text-[var(--theme-accent)]/60"
        >
          <path
            d="M10 3v14M4 11l6 6 6-6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </section>
  );
}
