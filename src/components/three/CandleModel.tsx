'use client';

/**
 * CandleModel — React Three Fiber component that loads a .glb candle model
 * via useGLTF from @react-three/drei.
 *
 * - Accepts `modelPath` and `rotationY` props
 * - Applies `rotationY` to the root mesh group (controlled by ScrollTrigger proxy)
 * - Calls useGLTF.preload() at module level for the hero model path
 *
 * Requirements: 3.1, 5.1, 5.3
 */

import { useRef, useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Hero model path — preloaded at module level to minimize initial load latency
const HERO_MODEL_PATH = '/models/hero-candle.glb';

interface CandleModelProps {
  /** Path to the .glb model file (e.g. /models/lavender-soy.glb) */
  modelPath: string;
  /** Y-axis rotation in radians — controlled externally by ScrollTrigger */
  rotationY?: number;
  /** Whether to enable a gentle idle auto-rotation when not scroll-driven */
  idleRotation?: boolean;
}

export function CandleModel({
  modelPath,
  rotationY = 0,
  idleRotation = false,
}: CandleModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(modelPath);

  // Clone the scene so multiple instances don't share the same Three.js object.
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);

    // Auto-center and scale the model to fit within a normalized bounding box
    const box = new THREE.Box3().setFromObject(clone);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    // Center the model at origin, then shift up slightly
    clone.position.sub(center);
    clone.position.y += 0.3;

    // Scale to fit within a 1.44-unit bounding sphere (20% larger than original 1.2)
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      const scale = 1.44 / maxDim;
      clone.scale.multiplyScalar(scale);
    }

    // Downscale textures to prevent GPU memory issues with large embedded textures
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const material = mesh.material as THREE.MeshStandardMaterial;
        if (material && material.map) {
          material.map.minFilter = THREE.LinearFilter;
          material.map.generateMipmaps = false;
        }
        if (material && material.normalMap) {
          material.normalMap.minFilter = THREE.LinearFilter;
          material.normalMap.generateMipmaps = false;
        }
        if (material && material.roughnessMap) {
          material.roughnessMap.minFilter = THREE.LinearFilter;
          material.roughnessMap.generateMipmaps = false;
        }
      }
    });
    return clone;
  }, [scene]);

  // Apply controlled rotationY from ScrollTrigger or variant selection
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = rotationY;
    }
  }, [rotationY]);

  // Optional gentle idle rotation when not scroll-driven
  useFrame((_, delta) => {
    if (idleRotation && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <group ref={groupRef} rotation={[0, rotationY, 0]}>
      <primitive object={clonedScene} dispose={null} />
    </group>
  );
}

// Preload the hero model at module level so it's ready before the component mounts
useGLTF.preload(HERO_MODEL_PATH);
