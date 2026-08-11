"use client";

import { useMediaQuery } from "./useClientFlags";

export type ViewportClass =
  | "phone"
  | "tablet"
  | "laptop"
  | "desktop"
  | "wide";

/**
 * Clase de viewport para decisiones de encuadre 3D.
 *
 * No alcanza con "mobile / desktop": una notebook es ancha pero BAJA, y
 * ahí una torre alta y angosta se corta por arriba aunque haya ancho de
 * sobra. Por eso se distingue laptop de desktop por altura, no por ancho.
 */
export function useViewportClass(): ViewportClass {
  const phone = useMediaQuery("(max-width: 599px)", false);
  const tablet = useMediaQuery("(max-width: 1023px)", false);
  const shortViewport = useMediaQuery("(max-height: 820px)", false);
  const wide = useMediaQuery("(min-width: 1800px)", false);

  if (phone) return "phone";
  if (tablet) return "tablet";
  if (wide) return "wide";
  return shortViewport ? "laptop" : "desktop";
}

/**
 * Multiplicadores de encuadre por clase de viewport.
 *
 * `distance` aleja la cámara y `fov` abre el ángulo. En pantallas angostas
 * o bajas se combinan ambos para que el edificio entre completo sin quedar
 * diminuto; en monitores grandes la cámara se acerca un poco para que no
 * se pierda en el centro de la pantalla.
 */
export const FRAMING: Record<
  ViewportClass,
  { distance: number; fov: number; targetY: number }
> = {
  phone: { distance: 1.24, fov: 46, targetY: 1.0 },
  tablet: { distance: 1.12, fov: 42, targetY: 1.0 },
  laptop: { distance: 1.08, fov: 40, targetY: 0.97 },
  desktop: { distance: 1.0, fov: 38, targetY: 1.0 },
  wide: { distance: 0.94, fov: 36, targetY: 1.0 },
};
