"use client";

import { useEffect, useState } from "react";
import { FreyaLogo } from "./FreyaLogo";
import styles from "./BrandLoader.module.css";

const SESSION_KEY = "freya-brand-intro";

type Phase = "boot" | "show" | "hide" | "done";

function getInitialPhase(): Phase {
  if (typeof window === "undefined") return "boot";
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const seen = sessionStorage.getItem(SESSION_KEY) === "1";
  return reduced || seen ? "done" : "boot";
}

export function BrandLoader() {
  const [phase, setPhase] = useState<Phase>(getInitialPhase);

  useEffect(() => {
    if (phase !== "boot") return;

    // Timers (no setState síncrono en el cuerpo del efecto): arranca la
    // animación en el siguiente tick, luego hide/done en cascada.
    const showTimer = window.setTimeout(() => setPhase("show"), 0);
    const hideTimer = window.setTimeout(() => setPhase("hide"), 1400);
    const doneTimer = window.setTimeout(() => {
      sessionStorage.setItem(SESSION_KEY, "1");
      setPhase("done");
    }, 2100);

    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
      window.clearTimeout(doneTimer);
    };
  }, [phase]);

  if (phase === "boot" || phase === "done") return null;

  return (
    <div
      className={styles.loader}
      data-hiding={phase === "hide" ? "true" : "false"}
      aria-hidden="true"
    >
      <div className={styles.mark}>
        <FreyaLogo variant="loader" priority />
        <span className={styles.word}>Freya</span>
      </div>
    </div>
  );
}
