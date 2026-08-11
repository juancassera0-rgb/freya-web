"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * Decide si una escena WebGL debe estar renderizando.
 *
 * Un canvas fuera de viewport, o en una pestaña oculta, sigue consumiendo
 * GPU y batería si nadie lo detiene. Este hook devuelve dos señales:
 *
 * - `mounted`: montar el canvas (una sola vez, al acercarse al viewport).
 *   Evita crear contextos WebGL para escenas que el usuario nunca ve —
 *   los navegadores limitan a ~8-16 contextos simultáneos por página.
 * - `active`: si debe correr el render loop. Se apaga fuera de viewport
 *   y al ocultarse la pestaña.
 */
export function useCanvasActive(
  ref: RefObject<HTMLElement | null>,
  { rootMargin = "200px" }: { rootMargin?: string } = {},
) {
  const [mounted, setMounted] = useState(false);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        const visible = Boolean(entry?.isIntersecting);
        setInView(visible);
        if (visible) setMounted(true);
      },
      { rootMargin },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin]);

  useEffect(() => {
    const onVisibility = () => setPageVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return { mounted, active: mounted && inView && pageVisible };
}
