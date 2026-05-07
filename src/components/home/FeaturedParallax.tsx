'use client';

/**
 * FeaturedParallax — wraps the featured products section with GSAP
 * scroll-triggered parallax entrance animations.
 *
 * - Section heading slides up and fades in
 * - Product cards stagger in from below with a slight scale effect
 */

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface FeaturedParallaxProps {
  children: React.ReactNode;
}

export function FeaturedParallax({ children }: FeaturedParallaxProps) {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Animate the section heading
      const heading = sectionRef.current?.querySelector('[data-parallax="heading"]');
      if (heading) {
        gsap.fromTo(
          heading,
          { y: 60, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: heading,
              start: 'top 85%',
              end: 'top 60%',
              toggleActions: 'play none none reverse',
            },
          },
        );
      }

      // Animate product cards with stagger
      const cards = sectionRef.current?.querySelectorAll('[data-parallax="card"]');
      if (cards && cards.length > 0) {
        gsap.fromTo(
          cards,
          { y: 80, opacity: 0, scale: 0.95 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.6,
            ease: 'power2.out',
            stagger: 0.1,
            scrollTrigger: {
              trigger: cards[0],
              start: 'top 90%',
              end: 'top 60%',
              toggleActions: 'play none none reverse',
            },
          },
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={sectionRef}>
      {children}
    </div>
  );
}
