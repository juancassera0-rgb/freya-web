"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

export type QualityTier = "low" | "medium" | "high";

/**
 * Determina el tier inicial según capacidades declaradas del dispositivo.
 * Se evalúa una sola vez: no cambia en runtime.
 */
export function detectQualityTier(opts: {
  coarse: boolean;
  narrow: boolean;
}): QualityTier {
  if (typeof navigator === "undefined") return "medium";

  const cores = navigator.hardwareConcurrency ?? 8;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const weakHardware = cores <= 4 || (typeof mem === "number" && mem <= 4);
  const mobile = opts.coarse || opts.narrow;

  if (weakHardware) return "low";
  if (mobile) return "medium";
  return cores >= 8 ? "high" : "medium";
}

type Props = {
  enabled?: boolean;
  /** FPS por debajo del cual se baja la resolución de render */
  floor?: number;
  minDpr?: number;
};

/**
 * Degradación automática de resolución.
 *
 * Mide FPS en ventanas de ~1s. Si el dispositivo no sostiene el objetivo,
 * baja el DPR en escalones; si sobra margen, lo devuelve. Así un teléfono
 * de gama media mantiene fluidez en vez de renderizar bonito a 15 FPS,
 * y una máquina potente no queda limitada de entrada.
 *
 * Sólo toca resolución: no altera geometría ni iluminación, así que la
 * identidad visual de la escena se mantiene.
 */
export function AdaptiveQuality({
  enabled = true,
  floor = 42,
  minDpr = 0.75,
}: Props) {
  const frames = useRef(0);
  const windowStart = useRef(0);
  const scale = useRef(1);
  const maxDpr = useRef(0);

  useFrame((state) => {
    if (!enabled) return;

    if (maxDpr.current === 0) {
      maxDpr.current = state.gl.getPixelRatio();
      windowStart.current = performance.now();
    }

    frames.current += 1;
    const now = performance.now();
    const elapsed = now - windowStart.current;
    if (elapsed < 1000) return;

    const fps = (frames.current * 1000) / elapsed;
    frames.current = 0;
    windowStart.current = now;

    const max = maxDpr.current;
    let next = scale.current;
    if (fps < floor) next = Math.max(minDpr / max, next - 0.18);
    else if (fps > floor + 18) next = Math.min(1, next + 0.12);

    if (Math.abs(next - scale.current) > 0.01) {
      scale.current = next;
      state.gl.setPixelRatio(Math.max(minDpr, max * next));
    }
  });

  return null;
}
