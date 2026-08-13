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
 * En táctil se anula el gesto de dos dedos igual que en SalesCenterScene:
 * OrbitControls no puede impedir el zoom de página de Safari, así que si
 * el gesto no está interceptado por un listener no pasivo del contenedor,
 * lo mejor es no invitarlo. Las escenas que usan este componente son de
 * recorrido, no de análisis, y no necesitan zoom.
 */
export function OrbitControlsSoft({
  enabled = true,
  target = [0, 1.8, 0],
  touch = false,
}: Props) {
  if (!enabled) return null;

  return (
    <OrbitControls
      makeDefault
      enablePan={false}
      enableDamping
      dampingFactor={touch ? 0.1 : 0.06}
      rotateSpeed={0.45}
      zoomSpeed={0.55}
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
