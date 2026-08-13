"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * ALTURA ESTABLE PARA EL CONTENEDOR DEL CANVAS EN MÓVIL.
 *
 * Segunda mitad del bug de "se acerca solo".
 *
 * Al scrollear en iOS, Safari muestra y oculta su barra de direcciones. Eso
 * cambia la altura del contenedor, R3F redimensiona el canvas, la cámara
 * recalcula su `aspect` y el encuadre salta. Con FOV vertical fijo, un
 * canvas más bajo recorta lateralmente: se lee como un zoom que nadie pidió,
 * y se repite en cada scroll.
 *
 * `svh` en CSS resuelve el caso simple, pero no cuando el contenedor recibe
 * su altura de un grid (`height: 100%`) o cuando el teclado virtual entra en
 * juego. Este hook cierra el caso: mide una vez, y después IGNORA los
 * cambios de altura por debajo de un umbral — que son siempre la barra del
 * navegador, nunca una rotación de pantalla.
 *
 * Un cambio grande (rotar el dispositivo, abrir el teclado) sí se acepta.
 *
 * Devuelve la altura en px a fijar, o null en punteros finos (en desktop no
 * hay barra que aparezca y desaparezca: se deja el layout intacto).
 */
export function useStableStageSize(
  ref: RefObject<HTMLElement | null>,
  {
    enabled = true,
    /** Diferencia mínima de altura que se considera un cambio real */
    threshold = 140,
  }: { enabled?: boolean; threshold?: number } = {},
) {
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) {
      setHeight(null);
      return;
    }

    let locked = 0;

    const measure = () => {
      const h = el.getBoundingClientRect().height;
      if (h < 80) return; // aún sin layout
      if (locked === 0 || Math.abs(h - locked) > threshold) {
        locked = Math.round(h);
        setHeight(locked);
      }
    };

    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);

    /* Rotación de pantalla: se fuerza una relectura después de que el
       navegador terminó de reacomodar el layout. */
    const onOrientation = () => {
      locked = 0;
      requestAnimationFrame(() => requestAnimationFrame(measure));
    };
    window.addEventListener("orientationchange", onOrientation);

    return () => {
      ro.disconnect();
      window.removeEventListener("orientationchange", onOrientation);
    };
  }, [ref, enabled, threshold]);

  return height;
}
