"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { usePointerNorm } from "./usePointerNorm";

const CAMO = "#4f4c37";
const CREAM = "#c4b79a";

/**
 * Un solo edificio de fondo (masa residencial).
 * Movimiento mínimo — atmósfera, no protagonista.
 */
export function SiteScene({
  scrollProgress,
  onDark,
}: {
  scrollProgress: number;
  onDark: boolean;
}) {
  const pointer = usePointerNorm();
  const group = useRef<THREE.Group>(null);

  const volumes = useMemo(
    () =>
      [
        { w: 1.35, d: 1.05, h: 3.4, x: 0, z: 0 },
        { w: 0.85, d: 0.95, h: 2.2, x: -1.15, z: 0.15 },
        { w: 0.7, d: 0.8, h: 2.85, x: 1.1, z: -0.2 },
        { w: 1.5, d: 0.55, h: 0.35, x: 0, z: 0.55 },
      ] as const,
    [],
  );

  const edges = useMemo(
    () =>
      volumes.map(
        (v) => new THREE.EdgesGeometry(new THREE.BoxGeometry(v.w, v.h, v.d)),
      ),
    [volumes],
  );

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    g.rotation.y =
      -0.45 +
      pointer.current.x * 0.05 +
      scrollProgress * 0.28 +
      Math.sin(t * 0.1) * 0.015;
    g.rotation.x = -0.05 + pointer.current.y * 0.025;
    g.position.y = -0.35 - scrollProgress * 0.45;
  });

  const line = onDark ? CREAM : CAMO;
  const fill = onDark ? "#1d1c1b" : "#f0eee8";

  return (
    <>
      <ambientLight intensity={0.9} />
      <group ref={group} position={[2.8, -0.35, -1.4]}>
        {volumes.map((v, i) => (
          <group key={i} position={[v.x, v.h / 2, v.z]}>
            <mesh>
              <boxGeometry args={[v.w, v.h, v.d]} />
              <meshBasicMaterial
                color={fill}
                transparent
                opacity={onDark ? 0.2 : 0.35}
                depthWrite={false}
              />
            </mesh>
            <lineSegments geometry={edges[i]}>
              <lineBasicMaterial
                color={line}
                transparent
                opacity={onDark ? 0.35 : 0.28}
              />
            </lineSegments>
          </group>
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <mesh key={`fl-${i}`} position={[0, 0.5 + i * 0.45, 0.53]}>
            <planeGeometry args={[1.25, 0.01]} />
            <meshBasicMaterial
              color={line}
              transparent
              opacity={onDark ? 0.2 : 0.14}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>
    </>
  );
}
