'use client';

/**
 * CelebrationScene — 3D particle celebration rendered on the Success page.
 *
 * Renders floating particle meshes (small glowing spheres) that drift upward
 * and sway gently, evoking floating candle flames or embers.
 *
 * - Uses React Three Fiber's useFrame for per-frame animation
 * - Accepts `particleCount` prop (default 80)
 * - Fully self-contained — no external model files required
 *
 * Requirements: 10.2
 */

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─── Types ────────────────────────────────────────────────────────

export interface CelebrationSceneProps {
  /** Number of floating particles to render. Default: 80 */
  particleCount?: number;
  /** Optional CSS class names for the outer container */
  className?: string;
}

interface ParticleData {
  position: [number, number, number];
  speed: number;
  sway: number;
  phase: number;
  scale: number;
  color: THREE.Color;
}

// ─── Pure data factory (outside component — no purity lint issues) ─

const PALETTE = [
  new THREE.Color('#E67E22'), // cinnamon orange
  new THREE.Color('#9B59B6'), // lavender purple
  new THREE.Color('#F39C12'), // warm amber
  new THREE.Color('#D35400'), // deep ember
  new THREE.Color('#BDC3C7'), // soft white
];

function createParticles(count: number): ParticleData[] {
  return Array.from({ length: count }, () => ({
    position: [
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 6,
      (Math.random() - 0.5) * 4,
    ] as [number, number, number],
    speed: 0.3 + Math.random() * 0.7,
    sway: 0.3 + Math.random() * 0.5,
    phase: Math.random() * Math.PI * 2,
    scale: 0.04 + Math.random() * 0.1,
    color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
  }));
}

// ─── Particles component ──────────────────────────────────────────

interface ParticlesProps {
  count: number;
}

function Particles({ count }: ParticlesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const elapsedRef = useRef(0);

  // Stable particle data — recreated only when count changes.
  // createParticles is a pure module-level function, so useMemo is safe here.
  const particles = useMemo(() => createParticles(count), [count]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    elapsedRef.current += delta;
    const t = elapsedRef.current;

    particles.forEach((p, i) => {
      // Drift upward, wrapping back to bottom when off-screen
      const y = ((p.position[1] + t * p.speed) % 8) - 4;
      // Gentle horizontal sway
      const x = p.position[0] + Math.sin(t * p.sway + p.phase) * 0.4;
      const z = p.position[2];

      dummy.position.set(x, y, z);
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();

      meshRef.current!.setMatrixAt(i, dummy.matrix);
      meshRef.current!.setColorAt(i, p.color);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      {/* Icosahedron gives a faceted gem-like look for the particles */}
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        roughness={0.2}
        metalness={0.1}
        transparent
        opacity={0.85}
        vertexColors
      />
    </instancedMesh>
  );
}

// ─── CelebrationScene ─────────────────────────────────────────────

export function CelebrationScene({
  particleCount = 80,
  className = '',
}: CelebrationSceneProps) {
  return (
    <div
      className={`w-full h-full ${className}`}
      aria-label="Celebration animation"
      role="img"
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        dpr={[1, 2]}
        style={{ width: '100%', height: '100%' }}
        gl={{ antialias: true, alpha: true }}
      >
        {/* Soft ambient fill */}
        <ambientLight intensity={0.8} />

        {/* Warm key light to make particles glow */}
        <pointLight position={[0, 4, 4]} intensity={2} color="#F39C12" />
        <pointLight position={[-4, -2, 2]} intensity={1} color="#9B59B6" />

        <Particles count={particleCount} />
      </Canvas>
    </div>
  );
}
