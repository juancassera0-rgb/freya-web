"use client";

import styles from "./SiteAtmosphere.module.css";

/** Grilla blueprint + grain — sin WebGL decorativo. */
export function SiteAtmosphere() {
  return (
    <>
      <div className={styles.grid} aria-hidden />
      <div className={styles.grain} aria-hidden />
    </>
  );
}
