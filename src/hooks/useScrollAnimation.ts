'use client';

import { useEffect, useRef } from 'react';

type AnimationType = 'fadeUp' | 'fadeLeft' | 'fadeRight' | 'fadeScale' | 'staggerUp';

interface ScrollAnimationOptions {
  type?: AnimationType;
  delay?: number;
  duration?: number;
  stagger?: number;
}

/**
 * Reusable hook for scroll-triggered GSAP animations.
 * GSAP is dynamically imported to avoid adding it to the initial JS bundle.
 */
export function useScrollAnimation<T extends HTMLElement>(options: ScrollAnimationOptions = {}) {
  const ref = useRef<T>(null);
  const { type = 'fadeUp', delay = 0, duration = 0.8, stagger = 0.15 } = options;

  useEffect(() => {
    if (!ref.current) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const el = ref.current;
    let cleanup: (() => void) | undefined;

    // Dynamically import GSAP — keeps it out of the initial bundle
    Promise.all([
      import('gsap'),
      import('gsap/ScrollTrigger'),
    ]).then(([{ default: gsap }, { ScrollTrigger }]) => {
      gsap.registerPlugin(ScrollTrigger);

      if (type === 'staggerUp') {
        const children = el.children;
        if (children.length > 0) {
          gsap.set(children, { opacity: 0, y: 50, scale: 0.97 });
          gsap.to(children, {
            opacity: 1, y: 0, scale: 1, duration, delay, stagger,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 80%', toggleActions: 'play none none none' },
          });
        }
        cleanup = () => { ScrollTrigger.getAll().forEach((t) => { if (t.trigger === el) t.kill(); }); };
        return;
      }

      const fromVars: Record<string, unknown> = { opacity: 0 };
      const toVars: Record<string, unknown> = {
        opacity: 1, duration, delay, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 80%', toggleActions: 'play none none none' },
      };

      if (type === 'fadeUp') { fromVars.y = 60; fromVars.scale = 0.98; toVars.y = 0; toVars.scale = 1; }
      else if (type === 'fadeLeft') { fromVars.x = -80; toVars.x = 0; }
      else if (type === 'fadeRight') { fromVars.x = 80; toVars.x = 0; }
      else if (type === 'fadeScale') { fromVars.scale = 0.88; fromVars.y = 30; toVars.scale = 1; toVars.y = 0; }

      gsap.set(el, fromVars);
      gsap.to(el, toVars);
      cleanup = () => { ScrollTrigger.getAll().forEach((t) => { if (t.trigger === el) t.kill(); }); };
    });

    return () => { cleanup?.(); };
  }, [type, delay, duration, stagger]);

  return ref;
}
