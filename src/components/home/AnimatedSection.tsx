'use client';

import { ReactNode } from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

type AnimationType = 'fadeUp' | 'fadeLeft' | 'fadeRight' | 'fadeScale' | 'staggerUp';

interface AnimatedSectionProps {
  children: ReactNode;
  type?: AnimationType;
  delay?: number;
  duration?: number;
  stagger?: number;
  className?: string;
}

/**
 * AnimatedSection — thin client wrapper that applies scroll-triggered
 * GSAP animations to server-rendered content.
 *
 * Wrap any section's inner content to add a subtle entrance animation
 * without converting the parent to a client component.
 */
export function AnimatedSection({
  children,
  type = 'fadeUp',
  delay = 0,
  duration = 0.8,
  stagger = 0.15,
  className = '',
}: AnimatedSectionProps) {
  const ref = useScrollAnimation<HTMLDivElement>({ type, delay, duration, stagger });

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
