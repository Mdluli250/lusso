import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { RefObject } from 'react';
import type * as THREE from 'three';

// Register ScrollTrigger plugin with GSAP
gsap.registerPlugin(ScrollTrigger);

class AnimationEngine {
  private triggers: ScrollTrigger[] = [];

  /**
   * Creates a ScrollTrigger that maps scroll progress [0, 1] to Y rotation [0, Math.PI * 2].
   * The candle model rotates a full 360° as the user scrolls through the hero container.
   *
   * Requirements: 3.3, 3.4, 5.2
   */
  initHeroRotation(
    candleRef: RefObject<THREE.Group | null>,
    containerRef: RefObject<HTMLElement | null>
  ): void {
    if (!candleRef || !containerRef) return;

    const trigger = ScrollTrigger.create({
      trigger: containerRef.current ?? undefined,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.5,
      onUpdate: (self) => {
        if (candleRef.current) {
          candleRef.current.rotation.y = self.progress * Math.PI * 2;
        }
      },
    });

    this.triggers.push(trigger);
  }

  /**
   * Creates staggered ScrollTrigger animations for each ingredient section.
   * Each section fades in and slides up when it enters the viewport.
   *
   * Requirements: 3.5, 5.4
   */
  initIngredientReveal(sectionRefs: RefObject<HTMLElement | null>[]): void {
    if (!sectionRefs || sectionRefs.length === 0) return;

    sectionRefs.forEach((ref, index) => {
      if (!ref || !ref.current) return;

      const tween = gsap.fromTo(
        ref.current,
        {
          opacity: 0,
          y: 40,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
          delay: index * 0.1,
          scrollTrigger: {
            trigger: ref.current,
            start: 'top 80%',
            end: 'bottom 20%',
            toggleActions: 'play none none reverse',
            onToggle: (self) => {
              // Track the ScrollTrigger instance created by this tween
              if (self && !this.triggers.includes(self)) {
                this.triggers.push(self);
              }
            },
          },
        }
      );

      // Also track the ScrollTrigger from the tween's scrollTrigger property
      if (tween.scrollTrigger) {
        this.triggers.push(tween.scrollTrigger);
      }
    });
  }

  /**
   * Animates CSS custom properties --theme-bg and --theme-accent on :root
   * to create smooth color theme transitions between scent profiles.
   *
   * Requirements: 3.3, 11.2
   */
  animateColorTheme(targetBg: string, targetAccent: string, duration = 0.6): void {
    gsap.to(':root', {
      '--theme-bg': targetBg,
      '--theme-accent': targetAccent,
      duration,
      ease: 'power2.inOut',
    });
  }

  /**
   * Kills all tracked ScrollTrigger instances and GSAP tweens.
   * Should be called on component unmount to prevent memory leaks.
   *
   * Requirements: 5.2, 5.4
   */
  destroy(): void {
    this.triggers.forEach((trigger) => {
      trigger.kill();
    });
    this.triggers = [];

    gsap.killTweensOf(':root');
  }
}

export const animationEngine = new AnimationEngine();
