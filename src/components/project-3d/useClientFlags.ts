"use client";

import { useSyncExternalStore } from "react";

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

function getWebGLSnapshot() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl"),
    );
  } catch {
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

  return {
    reducedMotion,
    /** Modo reducido: móvil, puntero grueso o hardware limitado */
    lite: coarse || narrow || lowPower,
    /** Táctil: cambia los controles de órbita y desactiva hover */
    touch: coarse,
    lowPower,
    webglOk,
  };
}
