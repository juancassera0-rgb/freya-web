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
 * No alcanza con "mobile / desktop": una notebook es ancha pero BAJA, y ahí
 * una torre alta y angosta se corta por arriba aunque haya ancho de sobra.
 * Por eso se distingue laptop de desktop por altura, no por ancho.
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
 * `distance` aleja la cámara y `fov` abre el ángulo.
 *
 * CAMBIO EN TELÉFONO. La versión anterior combinaba distancia 1.24 con FOV
 * 46 para garantizar que la torre entrara completa. Entraba, pero quedaba
 * chica y con la deformación de perspectiva propia de un ángulo abierto:
 * las líneas verticales del edificio se abrían y la lectura arquitectónica
 * se perdía, que es justamente lo que hay que vender.
 *
 * Ahora el teléfono usa un FOV MÁS CERRADO (40) y compensa con menos
 * distancia. El edificio ocupa la pantalla y las verticales se mantienen
 * verticales. Que entre completo ya no depende del encuadre inicial: el
 * pinch volvió a funcionar (ver useSceneTouch), así que alejarse es una
 * decisión del usuario y no una restricción del diseño.
 */
export const FRAMING: Record<
  ViewportClass,
  { distance: number; fov: number; targetY: number }
> = {
  phone: { distance: 1.06, fov: 40, targetY: 1.04 },
  tablet: { distance: 1.08, fov: 40, targetY: 1.0 },
  laptop: { distance: 1.08, fov: 40, targetY: 0.97 },
  desktop: { distance: 1.0, fov: 38, targetY: 1.0 },
  wide: { distance: 0.94, fov: 36, targetY: 1.0 },
};
