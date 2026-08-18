"use client";

import { useSyncExternalStore } from "react";
import type { QualityTier } from "./AdaptiveQuality";

function subscribeMedia(query: string, onStoreChange: () => void) {
  const mql = window.matchMedia(query);
  mql.addEventListener("change", onStoreChange);
  return () => mql.removeEventListener("change", onStoreChange);
}

function getMediaSnapshot(query: string) {
  return window.matchMedia(query).matches;
}

/** Media query reactiva sin setState en useEffect. */
export function useMediaQuery(query: string, serverFallback = false) {
  return useSyncExternalStore(
    (onStoreChange) => subscribeMedia(query, onStoreChange),
    () => getMediaSnapshot(query),
    () => serverFallback,
  );
}

function subscribeWebGL(onStoreChange: () => void) {
  // WebGL capability no cambia en runtime; no-op subscribe.
  void onStoreChange;
  return () => {};
}

/** Una sola sonda — crear contextos en cada snapshot agota el límite del browser. */
let webglCached: boolean | null = null;

function getWebGLSnapshot() {
  if (webglCached != null) return webglCached;
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    webglCached = Boolean(gl);
    if (gl && "getExtension" in gl) {
      const lose = (
        gl as WebGLRenderingContext
      ).getExtension("WEBGL_lose_context");
      lose?.loseContext();
    }
    return webglCached;
  } catch {
    webglCached = false;
    return false;
  }
}

export function useWebGLAvailable(serverFallback = true) {
  return useSyncExternalStore(subscribeWebGL, getWebGLSnapshot, () => serverFallback);
}

/**
 * Dispositivo de gama baja: pocos núcleos o poca RAM declarada.
 * No cambia en runtime, así que se lee una sola vez.
 */
function getLowPowerSnapshot() {
  if (typeof navigator === "undefined") return false;
  const cores = navigator.hardwareConcurrency ?? 8;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  return cores <= 4 || (typeof mem === "number" && mem <= 4);
}

function getCoresSnapshot() {
  if (typeof navigator === "undefined") return 8;
  return navigator.hardwareConcurrency ?? 8;
}

function subscribeNoop() {
  return () => {};
}

export function useLowPowerDevice(serverFallback = false) {
  return useSyncExternalStore(
    subscribeNoop,
    getLowPowerSnapshot,
    () => serverFallback,
  );
}

export function usePerfFlags() {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const coarse = useMediaQuery("(pointer: coarse)");
  const narrow = useMediaQuery("(max-width: 720px)");
  const webglOk = useWebGLAvailable(true);
  const lowPower = useLowPowerDevice(false);
  const cores = useSyncExternalStore(subscribeNoop, getCoresSnapshot, () => 8);

  const mobile = coarse || narrow;

  /**
   * Tres niveles de calidad. Sólo afectan resolución, sombras y detalle
   * secundario — la volumetría y la identidad visual son las mismas en
   * los tres, para que el edificio se lea igual en cualquier dispositivo.
   */
  const tier: QualityTier = lowPower
    ? "low"
    : mobile
      ? "medium"
      : cores >= 8
        ? "high"
        : "medium";

  return {
    reducedMotion,
    /** Modo reducido: móvil, puntero grueso o hardware limitado */
    lite: mobile || lowPower,
    /** Táctil: cambia controles de órbita, encuadres y desactiva hover */
    touch: coarse,
    lowPower,
    tier,
    webglOk,
  };
}
