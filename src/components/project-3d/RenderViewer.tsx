"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { PlanRoom } from "@/data/planGeometry";
import styles from "./RenderViewer.module.css";

type Props = {
  room: PlanRoom;
  unitCode: string;
  rooms: PlanRoom[];
  onNavigate: (room: PlanRoom) => void;
  onClose: () => void;
  /**
   * Vuelve al plano dejando el ambiente resaltado.
   * Ausente en renders de espacios comunes, que no viven en una planta.
   */
  onBackToPlan?: () => void;
};

/**
 * Render a viewport completo. Cierra el circuito espacio → render y
 * permite volver al plano con ese mismo ambiente resaltado.
 */
export function RenderViewer({
  room,
  unitCode,
  rooms,
  onNavigate,
  onClose,
  onBackToPlan,
}: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [entered, setEntered] = useState(false);

  const index = rooms.findIndex((r) => r.id === room.id);
  const canNavigate = rooms.length > 1;

  useEffect(() => {
    const t = window.setTimeout(() => setEntered(true), 20);
    return () => window.clearTimeout(t);
  }, []);

  // Bloquea el scroll del documento mientras está abierto
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Teclado: Esc cierra, flechas navegan
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (!canNavigate) return;
      if (e.key === "ArrowRight") {
        onNavigate(rooms[(index + 1) % rooms.length]);
      }
      if (e.key === "ArrowLeft") {
        onNavigate(rooms[(index - 1 + rooms.length) % rooms.length]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, rooms, canNavigate, onClose, onNavigate]);

  // Parallax muy sutil siguiendo el puntero
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const onMove = (e: PointerEvent) => {
      const dx = e.clientX / window.innerWidth - 0.5;
      const dy = e.clientY / window.innerHeight - 0.5;
      frame.style.transform = `scale(1.05) translate3d(${dx * -14}px, ${dy * -10}px, 0)`;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <div
      className={styles.root}
      data-entered={entered ? "true" : "false"}
      role="dialog"
      aria-modal="true"
      aria-label={`Render de ${room.label}`}
    >
      <div className={styles.mediaMask}>
        <div ref={frameRef} className={styles.media}>
          {room.renderSrc ? (
            <Image
              src={room.renderSrc}
              alt={room.renderAlt ?? room.label}
              fill
              priority
              quality={92}
              sizes="100vw"
              className={styles.img}
            />
          ) : null}
        </div>
        <div className={styles.scrim} aria-hidden />
      </div>

      <div className={styles.ui}>
        <header className={styles.head}>
          <div className={styles.headMeta}>
            <span className={styles.unit}>Cuadrado {unitCode}</span>
            <span className={styles.roomName}>{room.label}</span>
          </div>
          <button type="button" className={styles.close} onClick={onClose}>
            Cerrar
            <span aria-hidden>✕</span>
          </button>
        </header>

        <footer className={styles.foot}>
          <div className={styles.counter}>
            <em>{String(index + 1).padStart(2, "0")}</em>
            <span aria-hidden>/</span>
            <span>{String(rooms.length).padStart(2, "0")}</span>
          </div>

          <div className={styles.actions}>
            {onBackToPlan ? (
              <button
                type="button"
                className={styles.planBtn}
                onClick={onBackToPlan}
              >
                Ver en plano
                <span aria-hidden>↩</span>
              </button>
            ) : null}

            {canNavigate && (
              <div className={styles.nav}>
                <button
                  type="button"
                  onClick={() =>
                    onNavigate(rooms[(index - 1 + rooms.length) % rooms.length])
                  }
                  aria-label="Espacio anterior"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate(rooms[(index + 1) % rooms.length])}
                  aria-label="Espacio siguiente"
                >
                  →
                </button>
              </div>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
