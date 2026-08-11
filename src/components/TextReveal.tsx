"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./TextReveal.module.css";

type Props = {
  children: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p";
  delay?: number;
};

/** Reveal tipográfico por palabras — ritmo editorial sin librerías pesadas. */
export function TextReveal({
  children,
  className,
  as = "h2",
  delay = 0,
}: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);
  const words = children.trim().split(/\s+/);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const Tag = as;

  return (
    <Tag
      ref={ref as never}
      className={[styles.root, visible ? styles.visible : "", className ?? ""]
        .filter(Boolean)
        .join(" ")}
      style={{ ["--reveal-delay" as string]: `${delay}ms` }}
    >
      {words.map((word, i) => (
        <span key={`${word}-${i}`} className={styles.wordWrap}>
          <span
            className={styles.word}
            style={{ transitionDelay: visible ? `${delay + i * 45}ms` : "0ms" }}
          >
            {word}
          </span>
          {i < words.length - 1 ? " " : null}
        </span>
      ))}
    </Tag>
  );
}

export function TextRevealBlock({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}
