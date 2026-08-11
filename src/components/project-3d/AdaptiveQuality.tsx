"use client";

import { useFrame, useThree } from "@react-three/fiber";
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
};

/** Escalones fijos de resolución. Discretos a propósito: ver nota abajo. */
const STEPS = [1, 0.85, 0.7, 0.55];

/**
 * Degradación automática de resolución.
 *
 * IMPORTANTE — dos decisiones que arreglan bugs reales:
 *
 * 1. Usa `setDpr` de R3F, NO `gl.setPixelRatio`. R3F es dueño del pixel
 *    ratio a través de la prop `dpr`; tocarlo por fuera hacía que R3F lo
 *    reseteara en el siguiente resize. En móvil los resize son constantes
 *    (barra del navegador), así que eso producía una oscilación continua
 *    del tamaño del buffer que se veía como zoom errático.
 *
 * 2. Baja por escalones fijos y NUNCA vuelve a subir. Antes subía y bajaba
 *    según el FPS del segundo anterior, lo que generaba un ciclo: baja
 *    resolución → sube FPS → sube resolución → baja FPS → baja resolución.
 *    Ese vaivén es peor que quedarse en la calidad menor. Ahora encuentra
 *    un escalón estable y se queda ahí.
 */
export function AdaptiveQuality({ enabled = true, floor = 40 }: Props) {
  const setDpr = useThree((s) => s.setDpr);
  const frames = useRef(0);
  const windowStart = useRef(0);
  const stepIndex = useRef(0);
  const baseDpr = useRef(0);
  /** Deja de medir una vez que encontró un escalón estable */
  const settled = useRef(false);

  useFrame((state) => {
    if (!enabled || settled.current) return;

    if (baseDpr.current === 0) {
      baseDpr.current = state.gl.getPixelRatio();
      windowStart.current = performance.now();
      return;
    }

    frames.current += 1;
    const now = performance.now();
    const elapsed = now - windowStart.current;
    if (elapsed < 1200) return;

    const fps = (frames.current * 1000) / elapsed;
    frames.current = 0;
    windowStart.current = now;

    if (fps >= floor) {
      // Sostiene el objetivo en el escalón actual: se queda acá
      settled.current = true;
      return;
    }

    if (stepIndex.current >= STEPS.length - 1) {
      // Ya está en el escalón más bajo, no hay nada más que hacer
      settled.current = true;
      return;
    }

    stepIndex.current += 1;
    setDpr(baseDpr.current * STEPS[stepIndex.current]);
  });

  return null;
}
