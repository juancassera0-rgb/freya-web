"use client";

import Image from "next/image";
import Link from "next/link";
import styles from "./FreyaLogo.module.css";

export type LogoVariant =
  | "header"
  | "header-light"
  | "hero"
  | "footer"
  | "loader"
  | "mark";

type Props = {
  variant?: LogoVariant;
  className?: string;
  priority?: boolean;
  /** Si true, solo isotipo (favicon / mark) */
  markOnly?: boolean;
};

/**
 * Wordmark + cuadrado variable (m²).
 * El Brand Guideline pide que el cuadrado cambie sutilmente
 * según el soporte, sin alterar tipografía ni colores del logo.
 */
export function FreyaLogo({
  variant = "header",
  className,
  priority,
  markOnly = false,
}: Props) {
  const light =
    variant === "header-light" ||
    variant === "hero" ||
    variant === "footer";

  if (markOnly || variant === "mark" || variant === "loader") {
    return (
      <span
        className={[styles.mark, styles[`v-${variant}`], className ?? ""]
          .filter(Boolean)
          .join(" ")}
        data-variant={variant}
      >
        <Image
          src="/images/brand/logo-iso-black.png"
          alt=""
          width={72}
          height={72}
          className={styles.iso}
          priority={priority}
        />
        <span className={styles.sq} aria-hidden />
      </span>
    );
  }

  return (
    <span
      className={[styles.wordmark, styles[`v-${variant}`], className ?? ""]
        .filter(Boolean)
        .join(" ")}
      data-variant={variant}
      data-light={light ? "true" : "false"}
    >
      <Image
        src={light ? "/images/brand/logo-white.png" : "/images/brand/logo-black.png"}
        alt="Freya Desarrollos"
        width={variant === "hero" ? 480 : 160}
        height={variant === "hero" ? 158 : 52}
        className={styles.logo}
        priority={priority}
      />
      <span className={styles.sq} aria-hidden />
    </span>
  );
}

type BrandLinkProps = Props & {
  href?: string;
  onClick?: () => void;
  "aria-label"?: string;
};

export function FreyaBrandLink({
  href = "/",
  onClick,
  "aria-label": ariaLabel = "Freya Desarrollos — Inicio",
  ...logoProps
}: BrandLinkProps) {
  return (
    <Link
      href={href}
      className={styles.brandLink}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      <FreyaLogo {...logoProps} />
    </Link>
  );
}
