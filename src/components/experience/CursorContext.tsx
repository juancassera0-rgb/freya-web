"use client";

import { useEffect, useRef, useState } from "react";
import { useMediaQuery } from "@/components/project-3d/useClientFlags";
import styles from "./CursorContext.module.css";

/**
 * Cursor contextual desktop. Lee `data-cursor="VER"` de cualquier elemento
 * bajo el puntero y muestra esa etiqueta. Sin punteros gruesos ni retardo:
 * seguimiento directo por rAF, sin re-render de React por frame.
 *
 * No se monta en touch, pointer coarse ni con reduced-motion.
 */
export function CursorContext() {
  const dotRef = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState<string | null>(null);

  // Capacidades leídas vía useSyncExternalStore — sin setState en efecto
  const fine = useMediaQuery("(pointer: fine)", false);
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)", false);
  const enabled = fine && !reduced;

  useEffect(() => {
    if (!enabled) return;
    document.documentElement.dataset.customCursor = "true";
    return () => {
      delete document.documentElement.dataset.customCursor;
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const pos = { ...target };
    let raf = 0;
    let currentLabel: string | null = null;

    const onMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;

      const el = (e.target as HTMLElement | null)?.closest?.("[data-cursor]");
      const next = el instanceof HTMLElement ? el.dataset.cursor ?? null : null;
      if (next !== currentLabel) {
        currentLabel = next;
        setLabel(next);
      }
    };

    const tick = () => {
      // Lerp corto: preciso, no flota
      pos.x += (target.x - pos.x) * 0.28;
      pos.y += (target.y - pos.y) * 0.28;
      const node = dotRef.current;
      if (node) {
        node.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      ref={dotRef}
      className={styles.cursor}
      data-label={label ? "true" : "false"}
      aria-hidden="true"
    >
      <span className={styles.ring} />
      {label ? <span className={styles.label}>{label}</span> : null}
    </div>
  );
}
