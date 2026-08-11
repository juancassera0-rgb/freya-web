"use client";

import { type RefObject, useEffect, useRef, useState } from "react";

type Options = {
  /** Sólo actualiza mientras la sección está en viewport */
  enabled?: boolean;
  /** Cuántos pasos discretos emitir (evita re-render por píxel) */
  steps?: number;
};

/**
 * Progreso 0→1 del scroll a través de una sección sticky.
 *
 * Cuantiza el valor para no re-renderizar React en cada píxel: el 3D lee
 * el progreso continuo por ref, y React sólo re-renderiza en cambios de paso.
 * Un solo listener pasivo + rAF; se desconecta fuera de viewport.
 */
export function useScrollProgress(
  ref: RefObject<HTMLElement | null>,
  { enabled = true, steps = 100 }: Options = {},
) {
  const [progress, setProgress] = useState(0);
  const [inView, setInView] = useState(false);
  /** Progreso continuo sin cuantizar — para consumo en useFrame */
  const rawRef = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(Boolean(entry?.isIntersecting)),
      { rootMargin: "10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled || !inView) return;

    let raf = 0;
    let queued = false;

    const measure = () => {
      queued = false;
      const rect = el.getBoundingClientRect();
      const travel = Math.max(1, rect.height - window.innerHeight);
      const p = Math.min(1, Math.max(0, -rect.top / travel));
      rawRef.current = p;
      const quantized = Math.round(p * steps) / steps;
      setProgress((prev) => (prev === quantized ? prev : quantized));
    };

    const onScroll = () => {
      if (queued) return;
      queued = true;
      raf = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [ref, enabled, inView, steps]);

  return { progress, rawRef, inView };
}
