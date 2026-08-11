"use client";

import { useEffect, useState } from "react";
import { FreyaLogo } from "./FreyaLogo";
import styles from "./BrandLoader.module.css";

const SESSION_KEY = "freya-brand-intro";
const SHOW_MS = 1200;
const DONE_MS = 1900;

function alreadySeen(): boolean {
  try {
    if (typeof window === "undefined") return true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function markSeen() {
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    /* private mode / blocked storage */
  }
}

/**
 * Intro de marca. No debe bloquear la app: si algo falla, se auto-oculta.
 */
export function BrandLoader() {
  const [mounted, setMounted] = useState(false);
  const [hiding, setHiding] = useState(false);

  useEffect(() => {
    if (alreadySeen()) return;

    let hideTimer = 0;
    let doneTimer = 0;
    let safetyTimer = 0;

    // Diferir un frame para no pelear con la hidratación.
    const startTimer = window.setTimeout(() => {
      setMounted(true);
      hideTimer = window.setTimeout(() => setHiding(true), SHOW_MS);
      doneTimer = window.setTimeout(() => {
        markSeen();
        setMounted(false);
      }, DONE_MS);
    }, 16);

    // Red de seguridad: nunca más de 3.5s en pantalla.
    safetyTimer = window.setTimeout(() => {
      markSeen();
      setMounted(false);
    }, 3500);

    return () => {
      window.clearTimeout(startTimer);
      window.clearTimeout(hideTimer);
      window.clearTimeout(doneTimer);
      window.clearTimeout(safetyTimer);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div
      className={styles.loader}
      data-hiding={hiding ? "true" : "false"}
      aria-hidden="true"
    >
      <div className={styles.mark}>
        <FreyaLogo variant="loader" priority />
        <span className={styles.word}>Freya</span>
      </div>
    </div>
  );
}
