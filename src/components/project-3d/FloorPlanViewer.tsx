"use client";

import { useCallback, useRef, useState } from "react";
import type { ProjectUnit } from "@/data/project3d";
import { ApartmentPlanSVG } from "./ApartmentPlanSVG";
import styles from "./FloorPlanViewer.module.css";

type Props = {
  unit: ProjectUnit;
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 2.8;

/**
 * Visor de planta con zoom y pan. El plano deja de ser una imagen plana:
 * se puede acercar y recorrer, con perspectiva 2.5D opcional para leer
 * el plano como volumen antes de pasar al 3D.
 */
export function FloorPlanViewer({ unit }: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [tilted, setTilted] = useState(false);
  const dragging = useRef<{ x: number; y: number } | null>(null);

  const clampOffset = useCallback(
    (x: number, y: number, z: number) => {
      const frame = frameRef.current;
      if (!frame) return { x, y };
      // Límite proporcional al zoom: nunca se pierde el plano de vista
      const maxX = (frame.clientWidth * (z - 1)) / 2;
      const maxY = (frame.clientHeight * (z - 1)) / 2;
      return {
        x: Math.max(-maxX, Math.min(maxX, x)),
        y: Math.max(-maxY, Math.min(maxY, y)),
      };
    },
    [],
  );

  const applyZoom = useCallback(
    (next: number) => {
      const z = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, next));
      setZoom(z);
      setOffset((o) => clampOffset(o.x, o.y, z));
    },
    [clampOffset],
  );

  const onPointerDown = (e: React.PointerEvent) => {
    if (zoom === 1) return;
    dragging.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const start = dragging.current;
    if (!start) return;
    setOffset(clampOffset(e.clientX - start.x, e.clientY - start.y, zoom));
  };

  const endDrag = (e: React.PointerEvent) => {
    dragging.current = null;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  const reset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setTilted(false);
  };

  return (
    <div className={styles.root}>
      <div
        ref={frameRef}
        className={styles.frame}
        data-zoomed={zoom > 1 ? "true" : "false"}
        data-tilted={tilted ? "true" : "false"}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        data-cursor={zoom > 1 ? "Mover" : "Explorar"}
      >
        <div
          className={styles.canvas}
          style={{
            transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${zoom})`,
          }}
        >
          <ApartmentPlanSVG unit={unit} />
        </div>
      </div>

      <div className={styles.controls} role="group" aria-label="Controles del plano">
        <button
          type="button"
          onClick={() => applyZoom(zoom - 0.45)}
          disabled={zoom <= MIN_ZOOM}
          aria-label="Alejar"
        >
          −
        </button>
        <span className={styles.zoomLabel} aria-live="polite">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          onClick={() => applyZoom(zoom + 0.45)}
          disabled={zoom >= MAX_ZOOM}
          aria-label="Acercar"
        >
          +
        </button>

        <button
          type="button"
          className={styles.tiltBtn}
          data-active={tilted ? "true" : "false"}
          onClick={() => setTilted((v) => !v)}
          aria-pressed={tilted}
        >
          {tilted ? "Ver plano" : "Ver en perspectiva"}
        </button>

        {(zoom > 1 || tilted) && (
          <button type="button" className={styles.resetBtn} onClick={reset}>
            Reiniciar
          </button>
        )}
      </div>
    </div>
  );
}
