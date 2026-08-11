"use client";

import { useEffect, useState } from "react";
import { FreyaLogo } from "./FreyaLogo";
import styles from "./BrandLoader.module.css";

const SESSION_KEY = "freya-brand-intro";

export function BrandLoader() {
  const [phase, setPhase] = useState<"boot" | "show" | "hide" | "done">(
    "boot",
  );

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const seen = sessionStorage.getItem(SESSION_KEY) === "1";

    if (reduced || seen) {
      setPhase("done");
      return;
    }

    setPhase("show");
    const hideTimer = window.setTimeout(() => setPhase("hide"), 1400);
    const doneTimer = window.setTimeout(() => {
      sessionStorage.setItem(SESSION_KEY, "1");
      setPhase("done");
    }, 2100);

    return () => {
      window.clearTimeout(hideTimer);
      window.clearTimeout(doneTimer);
    };
  }, []);

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
