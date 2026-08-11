"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import styles from "./MagneticCTA.module.css";

type Props = {
  href: string;
  children: string;
  /** dark = fondo camo, light = contorno sobre claro, ghost = solo texto */
  variant?: "dark" | "light" | "ghost";
  className?: string;
};

/**
 * CTA con atracción magnética sutil (máx. 6px) y flecha que se desplaza.
 * El movimiento se aplica por transform directo — sin re-render por frame.
 */
export function MagneticCTA({
  href,
  children,
  variant = "dark",
  className,
}: Props) {
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;

    const strength = 6;

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const dx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
      el.style.transform = `translate3d(${dx * strength}px, ${dy * strength}px, 0)`;
    };

    const onLeave = () => {
      el.style.transform = "translate3d(0, 0, 0)";
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <Link
      ref={ref}
      href={href}
      className={`${styles.cta} ${className ?? ""}`}
      data-variant={variant}
    >
      <span className={styles.label}>{children}</span>
      <span className={styles.arrow} aria-hidden>
        →
      </span>
    </Link>
  );
}
