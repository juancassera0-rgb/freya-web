"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { useMediaQuery } from "@/components/project-3d/useClientFlags";

/**
 * Scroll suave — SÓLO EN PUNTERO FINO.
 *
 * En táctil Lenis se desactiva por completo, y es una decisión de peso:
 *
 * 1. iOS ya tiene inercia de scroll nativa, implementada por el compositor
 *    del sistema. Lenis la reemplaza por una versión en JavaScript que corre
 *    en el hilo principal — el mismo hilo que está armando los frames de
 *    WebGL. En una sección con canvas, las dos cosas se pelean y el
 *    resultado es el scroll a tirones que se nota justo al entrar al 3D.
 * 2. Lenis escucha `touchmove` en el documento. Sobre un canvas que también
 *    quiere ese gesto, la interacción se vuelve impredecible: el arrastre a
 *    veces rota, a veces scrollea, a veces ninguna de las dos.
 * 3. Corre un `requestAnimationFrame` permanente aunque la página esté
 *    quieta: batería gastada sin nada en pantalla.
 *
 * En desktop no aplica ninguno de los tres problemas y el scroll suave suma,
 * así que ahí se mantiene tal cual.
 *
 * Bonus: el rAF ahora se detiene con la pestaña oculta.
 */
export function SmoothScroll() {
  /* Se resuelve en el cliente para no romper la hidratación: el servidor no
     sabe si el puntero es grueso.

     El patch usaba `useState` + `useEffect(() => setReady(true))`, pero el
     lint del proyecto (react-hooks/set-state-in-effect) rechaza el setState
     síncrono en efectos. `useMediaQuery` ya resuelve esto con
     useSyncExternalStore, que además trae snapshot de servidor: es la
     convención que usa el resto del proyecto. */
  const coarse = useMediaQuery("(pointer: coarse)", false);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)", false);

  useEffect(() => {
    if (reducedMotion || coarse) return;

    const lenis = new Lenis({
      duration: 1.2,
      smoothWheel: true,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    let frame = 0;
    let running = true;

    const raf = (time: number) => {
      lenis.raf(time);
      if (running) frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    /* Pestaña oculta: se para el loop. Al volver, se retoma sin acumular
       el salto de tiempo. */
    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(frame);
      } else if (!running) {
        running = true;
        frame = requestAnimationFrame(raf);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    document.documentElement.classList.add("lenis");

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", onVisibility);
      lenis.destroy();
      document.documentElement.classList.remove("lenis");
    };
  }, [reducedMotion, coarse]);

  return null;
}
