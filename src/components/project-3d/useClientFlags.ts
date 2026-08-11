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

export function usePerfFlags() {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const coarse = useMediaQuery("(pointer: coarse)");
  const narrow = useMediaQuery("(max-width: 720px)");
  const webglOk = useWebGLAvailable(true);
  return {
    reducedMotion,
    lite: coarse || narrow,
    webglOk,
  };
}
