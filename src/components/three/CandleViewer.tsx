'use client';

/**
 * CandleViewer — the main 3D canvas wrapper for candle models.
 *
 * - Wraps CandleModel in a React Three Fiber <Canvas>
 * - Provides ambient + directional lighting
 * - Adds <OrbitControls> (enabled when not autoRotate/scrollDriven)
 * - Wraps in <Suspense fallback={<SkeletonViewer />}> and <ErrorBoundary fallback={<ModelFallback />}>
 * - Accepts CandleViewerProps as defined in the design document
 *
 * Requirements: 3.1, 3.2, 3.6, 5.1
 */

import { Suspense, Component, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { CandleModel } from './CandleModel';
import { FlameGlow } from './FlameGlow';
import { ModelFallback } from './ModelFallback';
import { SkeletonViewer } from '../ui/SkeletonViewer';

// ─── Types ────────────────────────────────────────────────────────

export interface CandleViewerProps {
  /** Path to the .glb model file (e.g. /models/lavender-soy.glb) */
  modelPath: string;
  /** Enable OrbitControls auto-rotation */
  autoRotate?: boolean;
  /** Connect Y rotation to GSAP ScrollTrigger (disables OrbitControls) */
  scrollDriven?: boolean;
  /** Controlled Y rotation in radians — used when scrollDriven is true */
  rotationY?: number;
  /** Callback fired when the model fails to load */
  onLoadError?: () => void;
  /** Optional CSS class names for the outer container */
  className?: string;
}

// ─── Error Boundary ───────────────────────────────────────────────

interface ErrorBoundaryState {
  hasError: boolean;
}

interface ErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
  onError?: () => void;
}

class ModelErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('[CandleViewer] 3D model load error:', error);
    this.props.onError?.();
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// ─── Scene Contents ───────────────────────────────────────────────

interface SceneProps {
  modelPath: string;
  rotationY: number;
  autoRotate: boolean;
  scrollDriven: boolean;
}

function Scene({ modelPath, rotationY, autoRotate, scrollDriven }: SceneProps) {
  // OrbitControls are disabled when scroll-driven (ScrollTrigger owns rotation)
  const orbitEnabled = !scrollDriven;

  return (
    <>
      {/* Ambient light — soft fill to prevent pure-black shadows */}
      <ambientLight intensity={0.8} />

      {/* Key light — main directional light from upper-right */}
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      {/* Fill light — softer light from the left to reduce harsh shadows */}
      <directionalLight position={[-4, 2, -2]} intensity={0.6} />

      {/* Rim light — subtle back light for depth */}
      <directionalLight position={[0, -2, -6]} intensity={0.3} />

      {/* The candle model — Suspense is handled by the parent */}
      <CandleModel
        modelPath={modelPath}
        rotationY={rotationY}
        idleRotation={autoRotate && !scrollDriven}
      />

      {/* Flame glow effect — pulsing point light at the wick */}
      <FlameGlow />

      {/* OrbitControls — only active when not scroll-driven */}
      {orbitEnabled && (
        <OrbitControls
          autoRotate={autoRotate}
          autoRotateSpeed={1.5}
          enableZoom={true}
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI * 0.75}
          minDistance={1}
          maxDistance={10}
        />
      )}
    </>
  );
}

// ─── CandleViewer ─────────────────────────────────────────────────

export function CandleViewer({
  modelPath,
  autoRotate = false,
  scrollDriven = false,
  rotationY = 0,
  onLoadError,
  className = '',
}: CandleViewerProps) {
  return (
    <div
      className={`w-full h-full ${className}`}
      aria-label="Interactive 3D candle viewer"
      role="img"
      style={{ position: 'relative', zIndex: 0 }}
    >
      <ModelErrorBoundary
        fallback={<ModelFallback />}
        onError={onLoadError}
      >
        <Suspense fallback={<SkeletonViewer />}>
          <Canvas
            camera={{ position: [0, 0, 4], fov: 45 }}
            shadows={{ type: THREE.PCFShadowMap }}
            dpr={[1, 2]}
            style={{ width: '100%', height: '100%' }}
            gl={{ antialias: true, alpha: true }}
          >
            <Scene
              modelPath={modelPath}
              rotationY={rotationY}
              autoRotate={autoRotate}
              scrollDriven={scrollDriven}
            />
          </Canvas>
        </Suspense>
      </ModelErrorBoundary>
    </div>
  );
}
