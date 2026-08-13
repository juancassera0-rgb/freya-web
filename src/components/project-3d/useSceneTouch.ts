"use client";

import { useEffect, type RefObject } from "react";

type Opts = {
  /** true = la escena tiene el gesto (rotar/pinch). false = el dedo scrollea. */
  interactive: boolean;
  /** Recibe el factor de escala del pinch (>1 acercar, <1 alejar). */
  onPinch?: (factor: number) => void;
};

/**
 * DUEÑO ÚNICO DE LOS GESTOS TÁCTILES SOBRE LA ESCENA.
 *
 * ------------------------------------------------------------------
 * ESTO ARREGLA EL BUG DE "SE ACERCA SOLO Y QUEDA INUTILIZABLE" EN iOS.
 * ------------------------------------------------------------------
 *
 * La causa no estaba en la cámara de Three.js: era el ZOOM DE PÁGINA de
 * Safari. Con dos dedos sobre el canvas, iOS dispara `gesturestart` /
 * `gesturechange` y escala TODO el documento. El render se ve gigante y
 * recortado, el layout se rompe y el scroll deja de comportarse — que es
 * exactamente el síntoma reportado.
 *
 * Por qué lo intentado antes no alcanzó:
 *
 * - `touch-action: pan-y` no impide el pinch-zoom de página en Safari iOS.
 *   Safari ignora `touch-action` para su propio zoom.
 * - `user-scalable=no` en el meta viewport: Safari lo ignora desde iOS 10.
 * - Desactivar `enableZoom` en OrbitControls empeora la situación: Three
 *   deja de consumir el gesto de dos dedos, así que llega intacto a Safari
 *   y el zoom de página se dispara con MÁS facilidad. Además deja al
 *   usuario sin ninguna forma de acercarse al edificio.
 *
 * La única vía confiable es interceptar el gesto antes que el navegador:
 * `preventDefault()` no pasivo sobre `gesturestart`, `gesturechange` y
 * sobre cualquier `touchmove` con dos o más dedos. Con el gesto en nuestras
 * manos, el pinch se traduce a un dolly acotado de la cámara: el usuario
 * gana zoom útil y el navegador nunca ve el gesto.
 *
 * También se bloquea el doble-tap-zoom (segundo `touchend` a menos de
 * 320 ms), que era la otra forma de dejar la página zoomeada sin querer.
 */
export function useSceneTouch(
  ref: RefObject<HTMLElement | null>,
  { interactive, onPinch }: Opts,
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    /* Los gestos de Safari se bloquean SIEMPRE, interactivo o no: nunca hay
       un caso en que el zoom de página sobre el canvas sea deseable. */
    const killGesture = (e: Event) => e.preventDefault();

    let lastTapEnd = 0;
    let pinchDist = 0;

    const dist = (t: TouchList) => {
      const dx = t[0].clientX - t[1].clientX;
      const dy = t[0].clientY - t[1].clientY;
      return Math.hypot(dx, dy);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length >= 2) {
        pinchDist = dist(e.touches);
        // Dos dedos = gesto nuestro. Se corta acá, no llega al navegador.
        e.preventDefault();
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length < 2) return;
      e.preventDefault();
      if (!interactive || !onPinch) return;

      const d = dist(e.touches);
      if (pinchDist > 0 && d > 0) {
        const factor = d / pinchDist;
        /* Zona muerta: por debajo de ~1.5% de variación es temblor de dedo,
           no intención. Filtrarlo es lo que hace que el pinch se sienta
           firme en vez de nervioso. */
        if (Math.abs(factor - 1) > 0.015) {
          onPinch(factor);
          pinchDist = d;
        }
      } else {
        pinchDist = d;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) pinchDist = 0;

      const now = performance.now();
      if (now - lastTapEnd < 320) {
        // Segundo tap rápido: es el doble-tap-zoom de Safari. Se anula.
        e.preventDefault();
      }
      lastTapEnd = now;
    };

    el.addEventListener("gesturestart", killGesture, { passive: false });
    el.addEventListener("gesturechange", killGesture, { passive: false });
    el.addEventListener("gestureend", killGesture, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: false });

    return () => {
      el.removeEventListener("gesturestart", killGesture);
      el.removeEventListener("gesturechange", killGesture);
      el.removeEventListener("gestureend", killGesture);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [ref, interactive, onPinch]);
}
