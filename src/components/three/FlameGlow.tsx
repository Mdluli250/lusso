'use client';

/**
 * FlameGlow — R3F PointLight component that simulates a candle flame glow.
 *
 * - Positioned at [0, 0.8, 0] (above the candle body, at the wick)
 * - Oscillates intensity between 0.8-1.0 at ~2Hz using sine wave
 * - Respects prefers-reduced-motion (static 0.9 intensity)
 * - Color: warm orange/amber (#FF8C00)
 * - Distance: 2, decay: 2
 *
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */

import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Computes glow intensity as a function of time.
 * Oscillates between 0.8 and 1.0 at ~2Hz using a sine wave.
 * Returns static 0.9 when reduced motion is preferred.
 */
export function getFlameIntensity(elapsedSeconds: number, reducedMotion: boolean): number {
  if (reducedMotion) return 3.0;
  const oscillation = Math.sin(elapsedSeconds * 2 * Math.PI * 2);
  return 3.0 + 0.5 * oscillation;
}

export function FlameGlow() {
  const lightRef = useRef<THREE.PointLight>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const elapsedRef = useRef(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mq.matches);
      const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, []);

  useFrame((_, delta) => {
    elapsedRef.current += delta;
    if (lightRef.current) {
      lightRef.current.intensity = getFlameIntensity(elapsedRef.current, reducedMotion);
    }
  });

  return (
    <pointLight
      ref={lightRef}
      position={[0, 0.9, 0]}
      color="#FF8C00"
      intensity={3.0}
      distance={5}
      decay={1.5}
    />
  );
}
