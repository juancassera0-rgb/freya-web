"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./LineReveal.module.css";

type Props = {
  children: ReactNode;
  className?: string;
  /** Retraso base en ms (Illoca: entrada escalonada) */
  delay?: number;
  /** Dispara al montar (hero) o al entrar en viewport */
  immediate?: boolean;
  as?: "h1" | "h2" | "h3" | "p" | "div" | "span";
};

/**
 * Reveal por máscara de línea — OCI (títulos editoriales) + Illoca (clip/máscara).
 */
export function LineReveal({
  children,
  className,
  delay = 0,
  immediate = false,
  as = "div",
}: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (immediate) {
      const id = window.requestAnimationFrame(() => setVisible(true));
      return () => window.cancelAnimationFrame(id);
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -6% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [immediate]);

  const Tag = as;

  return (
    <Tag
      ref={ref as never}
      className={[styles.root, visible ? styles.visible : "", className ?? ""]
        .filter(Boolean)
        .join(" ")}
      style={{ ["--line-delay" as string]: `${delay}ms` }}
    >
      <span className={styles.mask}>
        <span className={styles.inner}>{children}</span>
      </span>
    </Tag>
  );
}
