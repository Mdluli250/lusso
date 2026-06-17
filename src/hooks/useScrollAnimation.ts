'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

type AnimationType = 'fadeUp' | 'fadeLeft' | 'fadeRight' | 'fadeScale' | 'staggerUp';

interface ScrollAnimationOptions {
  type?: AnimationType;
  delay?: number;
  duration?: number;
  stagger?: number;
}

/**
 * Reusable hook for scroll-triggered GSAP animations with parallax-style movement.
 *
 * Applies entrance animations when elements scroll into view, using
 * power3.out easing for a smooth, luxury feel. Respects prefers-reduced-motion.
 *
 * @param options - Animation configuration
 * @returns A ref to attach to the target element
 */
export function useScrollAnimation<T extends HTMLElement>(options: ScrollAnimationOptions = {}) {
  const ref = useRef<T>(null);
  const { type = 'fadeUp', delay = 0, duration = 0.8, stagger = 0.15 } = options;

  useEffect(() => {
    if (!ref.current) return;

    // Respect reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const el = ref.current;

    // For stagger animations, animate children with cascading effect
    if (type === 'staggerUp') {
      const children = el.children;
      if (children.length > 0) {
        gsap.set(children, { opacity: 0, y: 50, scale: 0.97 });
        gsap.to(children, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration,
          delay,
          stagger,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        });
      }

      return () => {
        ScrollTrigger.getAll().forEach((t) => {
          if (t.trigger === el) t.kill();
        });
      };
    }

    // Standard single-element animations
    const fromVars: gsap.TweenVars = { opacity: 0 };
    const toVars: gsap.TweenVars = {
      opacity: 1,
      duration,
      delay,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 80%',
        toggleActions: 'play none none none',
      },
    };

    switch (type) {
      case 'fadeUp':
        fromVars.y = 60;
        fromVars.scale = 0.98;
        toVars.y = 0;
        toVars.scale = 1;
        break;
      case 'fadeLeft':
        fromVars.x = -80;
        fromVars.rotateY = 3;
        toVars.x = 0;
        toVars.rotateY = 0;
        break;
      case 'fadeRight':
        fromVars.x = 80;
        fromVars.rotateY = -3;
        toVars.x = 0;
        toVars.rotateY = 0;
        break;
      case 'fadeScale':
        fromVars.scale = 0.88;
        fromVars.y = 30;
        toVars.scale = 1;
        toVars.y = 0;
        break;
    }

    gsap.set(el, fromVars);
    gsap.to(el, toVars);

    return () => {
      ScrollTrigger.getAll().forEach((t) => {
        if (t.trigger === el) t.kill();
      });
    };
  }, [type, delay, duration, stagger]);

  return ref;
}
