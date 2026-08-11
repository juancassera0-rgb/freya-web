"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import styles from "./ParallaxMedia.module.css";

type Props = {
  children: ReactNode;
  className?: string;
  strength?: number;
};

/** Parallax moderado al scroll — profundidad tipo OCI, sin WebGL. */
export function ParallaxMedia({
  children,
  className,
  strength = 12,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const el = ref.current;
    if (!el) return;

    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const view = window.innerHeight;
      const center = rect.top + rect.height / 2;
      const progress = (center - view / 2) / view;
      setOffset(progress * strength * -1);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [strength]);

  const style: CSSProperties = {
    transform: `translate3d(0, ${offset}px, 0) scale(1.08)`,
  };

  return (
    <div ref={ref} className={[styles.wrap, className ?? ""].filter(Boolean).join(" ")}>
      <div className={styles.inner} style={style}>
        {children}
      </div>
    </div>
  );
}
