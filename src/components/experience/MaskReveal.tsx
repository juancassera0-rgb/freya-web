"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import styles from "./MaskReveal.module.css";

type Props = {
  /** Contenido simple. Opcional si se pasan `lines`. */
  children?: ReactNode;
  /** Líneas separadas — cada una entra con stagger */
  lines?: string[];
  className?: string;
  delay?: number;
  /** Dispara al montar en vez de al entrar en viewport */
  immediate?: boolean;
  as?: "div" | "h1" | "h2" | "h3" | "p" | "span";
};

/**
 * Reveal por máscara: el texto sube desde debajo de un borde recortado.
 * Es el gesto tipográfico base del sitio — arquitectónico, no rebota.
 */
export function MaskReveal({
  children,
  lines,
  className,
  delay = 0,
  immediate = false,
  as: Tag = "div",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (immediate) {
      const t = window.setTimeout(() => setVisible(true), 30);
      return () => window.clearTimeout(t);
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [immediate]);

  const content = lines ?? null;

  return (
    <div ref={ref} className={styles.wrap}>
      {content ? (
        <Tag className={className} data-visible={visible ? "true" : "false"}>
          {content.map((line, i) => (
            <span key={i} className={styles.line}>
              <span
                className={styles.inner}
                style={
                  {
                    "--d": `${delay + i * 90}ms`,
                  } as CSSProperties
                }
                data-visible={visible ? "true" : "false"}
              >
                {line}
              </span>
            </span>
          ))}
        </Tag>
      ) : (
        <span className={styles.line}>
          <span
            className={`${styles.inner} ${className ?? ""}`}
            style={{ "--d": `${delay}ms` } as CSSProperties}
            data-visible={visible ? "true" : "false"}
          >
            {children}
          </span>
        </span>
      )}
    </div>
  );
}
