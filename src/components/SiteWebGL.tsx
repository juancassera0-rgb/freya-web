"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import styles from "./SiteWebGL.module.css";

const SiteCanvas = dynamic(
  () => import("./webgl/SiteCanvas").then((m) => m.SiteCanvas),
  { ssr: false, loading: () => null },
);

/**
 * WebGL fijo en toda la página.
 * Illoca: experiencia inmersiva continua · OCI: masas / estructura · Brand Freya.
 */
export function SiteWebGL() {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [onDark, setOnDark] = useState(pathname === "/");

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setEnabled(false);
      return;
    }
    setEnabled(true);

    const onScroll = () => {
      const max = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      const p = Math.min(1, Math.max(0, window.scrollY / max));
      setScrollProgress(p);

      // Hero home = fondo oscuro; resto Off-White
      if (pathname === "/") {
        setOnDark(window.scrollY < window.innerHeight * 0.72);
      } else {
        setOnDark(false);
      }
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  useEffect(() => {
    setOnDark(pathname === "/");
    window.scrollTo({ top: window.scrollY });
  }, [pathname]);

  if (!enabled) return null;

  return (
    <div
      className={styles.root}
      aria-hidden
      data-dark={onDark ? "true" : "false"}
    >
      <SiteCanvas scrollProgress={scrollProgress} onDark={onDark} />
    </div>
  );
}
