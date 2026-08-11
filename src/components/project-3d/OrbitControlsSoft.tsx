"use client";

import { OrbitControls } from "@react-three/drei";

type Props = {
  enabled?: boolean;
  target?: [number, number, number];
};

/** Orbit suave — explorador, no videojuego. */
export function OrbitControlsSoft({
  enabled = true,
  target = [0, 1.8, 0],
}: Props) {
  if (!enabled) return null;

  return (
    <OrbitControls
      makeDefault
      enablePan={false}
      enableDamping
      dampingFactor={0.06}
      rotateSpeed={0.45}
      zoomSpeed={0.55}
      minDistance={3.2}
      maxDistance={11}
      minPolarAngle={Math.PI * 0.22}
      maxPolarAngle={Math.PI * 0.48}
      target={target}
    />
  );
}
