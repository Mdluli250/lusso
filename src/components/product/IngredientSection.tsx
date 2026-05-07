'use client';

/**
 * IngredientSection — scroll-animated ingredient/feature highlights.
 *
 * Accepts an array of ingredient/feature objects and registers each section
 * ref with `animationEngine.initIngredientReveal()` on mount so they
 * animate in as the user scrolls.
 *
 * Requirements: 5.2
 */

import { useEffect, useRef, useCallback } from 'react';
import { animationEngine } from '@/components/animation/AnimationEngine';

// ─── Types ────────────────────────────────────────────────────────

export interface Ingredient {
  title: string;
  description: string;
  icon?: string; // Optional emoji or icon character
}

interface IngredientSectionProps {
  ingredients: Ingredient[];
}

// ─── IngredientSection ────────────────────────────────────────────

export function IngredientSection({ ingredients }: IngredientSectionProps) {
  const elementsRef = useRef<(HTMLDivElement | null)[]>([]);

  // Callback ref factory to collect DOM elements
  const setRef = useCallback((index: number) => (el: HTMLDivElement | null) => {
    elementsRef.current[index] = el;
  }, []);

  useEffect(() => {
    // Build RefObject-like wrappers from collected DOM elements for the AnimationEngine
    const refs = elementsRef.current
      .filter((el): el is HTMLDivElement => el !== null)
      .map((el) => ({ current: el }));

    if (refs.length > 0) {
      animationEngine.initIngredientReveal(refs);
    }
  }, [ingredients.length]);

  if (ingredients.length === 0) return null;

  return (
    <section className="py-12" aria-labelledby="ingredients-heading">
      <h3
        id="ingredients-heading"
        className="text-xl font-semibold text-[var(--theme-accent)] mb-8"
      >
        Ingredients &amp; Features
      </h3>

      <div className="flex flex-col gap-6">
        {ingredients.map((ingredient, index) => (
          <div
            key={`${ingredient.title}-${index}`}
            ref={setRef(index)}
            className={[
              'flex items-start gap-4 p-5 rounded-xl',
              'border border-[var(--theme-accent)]/15',
              'bg-[var(--theme-accent)]/5',
              // Initial state for GSAP animation (opacity 0, translated down)
              'opacity-0 translate-y-10',
            ].join(' ')}
          >
            {/* Icon */}
            {ingredient.icon && (
              <span
                className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--theme-accent)]/15 flex items-center justify-center text-lg"
                aria-hidden="true"
              >
                {ingredient.icon}
              </span>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-semibold text-[var(--theme-accent)] leading-snug">
                {ingredient.title}
              </h4>
              <p className="mt-1 text-sm text-[var(--theme-accent)]/70 leading-relaxed">
                {ingredient.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
