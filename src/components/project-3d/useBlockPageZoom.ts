"use client";

import { useEffect, type RefObject } from "react";

/**
 * BLOQUEO DEL ZOOM DE PÁGINA SOBRE UN CANVAS.
 *
 * Versión reducida de `useSceneTouch` para las escenas que NO tienen
 * controles de órbita: el hero, el recorrido por capítulos y la vista
 * explotada. Ahí la cámara la maneja el scroll, así que no hay pinch que
 * traducir — pero el problema de iOS sigue existiendo igual.
 *
 * Con dos dedos sobre cualquier canvas, Safari dispara `gesturestart` y
 * escala todo el documento. En una sección sticky el efecto es peor que en
 * el explorador: la escena queda pinneada mientras la página está zoomeada,
 * así que el usuario ve el edificio recortado y no entiende cómo salir.
 *
 * Acá simplemente se descarta el gesto de dos dedos, junto con el
 * doble-tap-zoom. Un dedo sigue scrolleando con normalidad — que es lo
 * único que estas secciones necesitan.
 */
export function useBlockPageZoom(
  ref: RefObject<HTMLElement | null>,
  enabled = true,
) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    const kill = (e: Event) => e.preventDefault();
    let lastTapEnd = 0;

    const onTouch = (e: TouchEvent) => {
      if (e.touches.length >= 2) e.preventDefault();
    };

    const onTouchEnd = (e: TouchEvent) => {
      const now = performance.now();
      if (now - lastTapEnd < 320) e.preventDefault();
      lastTapEnd = now;
    };

    el.addEventListener("gesturestart", kill, { passive: false });
    el.addEventListener("gesturechange", kill, { passive: false });
    el.addEventListener("gestureend", kill, { passive: false });
    el.addEventListener("touchstart", onTouch, { passive: false });
    el.addEventListener("touchmove", onTouch, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: false });

    return () => {
      el.removeEventListener("gesturestart", kill);
      el.removeEventListener("gesturechange", kill);
      el.removeEventListener("gestureend", kill);
      el.removeEventListener("touchstart", onTouch);
      el.removeEventListener("touchmove", onTouch);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [ref, enabled]);
}
