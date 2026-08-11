"use client";

import { SiteWebGL } from "./SiteWebGL";
import styles from "./SiteAtmosphere.module.css";

/** Grilla blueprint + grain + WebGL arquitectónico site-wide. */
export function SiteAtmosphere() {
  return (
    <>
      <div className={styles.grid} aria-hidden />
      <div className={styles.grain} aria-hidden />
      <SiteWebGL />
    </>
  );
}
