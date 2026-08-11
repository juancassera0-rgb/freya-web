"use client";

import {
  createElement,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import styles from "./ScrollReveal.module.css";

type RevealTag = "div" | "li" | "section" | "article";

type Props = {
  children: ReactNode;
  className?: string;
  from?: "up" | "left" | "right" | "fade";
  delay?: number;
  as?: RevealTag;
};

export function ScrollReveal({
  children,
  className,
  from = "up",
  delay = 0,
  as = "div",
}: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

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
      { threshold: 0.14, rootMargin: "0px 0px -6% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const style: CSSProperties = {
    transitionDelay: visible ? `${delay}ms` : "0ms",
  };

  return createElement(
    as,
    {
      ref,
      className: [
        styles.reveal,
        styles[`from-${from}`],
        visible ? styles.visible : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" "),
      style,
    },
    children,
  );
}
