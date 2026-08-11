"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import type { CameraWaypoint } from "@/data/project3d";

type Props = {
  intro: CameraWaypoint;
  overview: CameraWaypoint;
  detail: CameraWaypoint;
  /**
   * Progreso de scroll 0→1 leído por REFERENCIA.
   *
   * Pasarlo como prop obligaba a re-renderizar el árbol React en cada
   * paso de scroll; leerlo acá desde un ref permite que el scroll mueva
   * la cámara a 60fps sin que React reconcilie una sola vez.
   */
  progressRef?: RefObject<number>;
  enablePointerParallax?: boolean;
  /** Duración de la intro en ms */
  introDuration?: number;
};

function lerpVec(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

/**
 * Cámara cinematográfica: intro lenta → overview → detail por scroll.
 */
export function CameraRig({
  intro,
  overview,
  detail,
  progressRef,
  enablePointerParallax = true,
  introDuration = 2800,
}: Props) {
  const { camera, pointer } = useThree();
  const current = useRef(new THREE.Vector3(...intro.position));
  const lookAt = useRef(new THREE.Vector3(...intro.target));
  const targetPos = useRef(new THREE.Vector3(...intro.position));
  const targetLook = useRef(new THREE.Vector3(...intro.target));
  const introDone = useRef(false);

  useEffect(() => {
    introDone.current = false;
    camera.position.set(...intro.position);
    camera.lookAt(...intro.target);
    current.current.set(...intro.position);
    lookAt.current.set(...intro.target);
    targetPos.current.set(...intro.position);
    targetLook.current.set(...intro.target);

    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / introDuration);
      const eased = 1 - Math.pow(1 - t, 3);
      const pos = lerpVec(intro.position, overview.position, eased);
      const look = lerpVec(intro.target, overview.target, eased);
      targetPos.current.set(...pos);
      targetLook.current.set(...look);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        introDone.current = true;
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [camera, intro, overview, introDuration]);

  useFrame((_, delta) => {
    if (introDone.current) {
      const p = Math.min(1, Math.max(0, progressRef?.current ?? 0));
      const pos = lerpVec(overview.position, detail.position, p);
      const look = lerpVec(overview.target, detail.target, p);
      targetPos.current.set(...pos);
      targetLook.current.set(...look);

      if (enablePointerParallax) {
        targetPos.current.x += pointer.x * 0.16;
        targetPos.current.y += pointer.y * 0.08;
      }
    }

    const lerp = 1 - Math.exp(-2.4 * delta);
    current.current.lerp(targetPos.current, lerp);
    lookAt.current.lerp(targetLook.current, lerp);
    camera.position.copy(current.current);
    camera.lookAt(lookAt.current);
  });

  return null;
}
