"use client";

import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

type Props = {
  enabled?: boolean;
  target?: [number, number, number];
  /** Puntero grueso: un dedo rota, el gesto de dos dedos no se usa acá */
  touch?: boolean;
};

/**
 * Orbit suave — explorador, no videojuego.
 *
 * Se mantiene montado y se controla con `enabled` (no unmount) para evitar
 * thrash de controles al activar/desactivar. En táctil se anula el gesto
 * de dos dedos: OrbitControls no puede impedir el zoom de página de Safari.
 */
export function OrbitControlsSoft({
  enabled = true,
  target = [0, 1.8, 0],
  touch = false,
}: Props) {
  return (
    <OrbitControls
      makeDefault
      enabled={enabled}
      enablePan={false}
      enableDamping
      dampingFactor={touch ? 0.085 : 0.06}
      rotateSpeed={touch ? 0.36 : 0.42}
      zoomSpeed={0.5}
      enableZoom={!touch}
      touches={{
        ONE: THREE.TOUCH.ROTATE,
        TWO: (touch ? -1 : THREE.TOUCH.DOLLY_ROTATE) as THREE.TOUCH,
      }}
      minDistance={3.2}
      maxDistance={11}
      minPolarAngle={Math.PI * 0.22}
      maxPolarAngle={Math.PI * 0.48}
      target={target}
    />
  );
}
