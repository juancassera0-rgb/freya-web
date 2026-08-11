"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getActiveProjects } from "@/data/projects";
import { site } from "@/data/site";
import { FreyaLogo } from "./FreyaLogo";
import styles from "./Header.module.css";

const links = [
  { href: "/desarrollos", label: "Desarrollos" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/como-trabajamos", label: "Cómo trabajamos" },
  { href: "/faq", label: "FAQ" },
  { href: "/contacto", label: "Contacto" },
];

const featured = getActiveProjects();

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isHome = pathname === "/";
  const transparent = isHome && !scrolled && !open;

  useEffect(() => {
    if (!isHome) return;
    const onScroll = () => setScrolled(window.scrollY > 48);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  // Cierra el menú mobile al cambiar de ruta (ajuste de estado durante el render,
  // sin efecto: https://react.dev/learn/you-might-not-need-an-effect).
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <header
        className={styles.header}
        data-transparent={transparent ? "true" : "false"}
        data-home={isHome ? "true" : "false"}
        data-open={open ? "true" : "false"}
        data-scrolled={scrolled ? "true" : "false"}
      >
        <div className={`container ${styles.inner}`}>
          <Link
            href="/"
            className={styles.brand}
            data-hidden={transparent ? "true" : "false"}
            onClick={() => setOpen(false)}
            aria-label="Freya Desarrollos — Inicio"
          >
            <FreyaLogo variant="header" priority={!isHome} />
          </Link>

          <nav className={styles.desktopNav} aria-label="Principal">
            {links.map((link) => {
              const active =
                pathname === link.href ||
                pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={styles.link}
                  data-active={active}
                >
                  <span className={styles.linkLabel}>{link.label}</span>
                </Link>
              );
            })}
            <Link
              href="/asesor"
              className={styles.cta}
              data-active={pathname.startsWith("/asesor")}
            >
              <span className={styles.ctaSq} aria-hidden />
              Hablar con un asesor
            </Link>
          </nav>

          <button
            type="button"
            className={styles.menuBtn}
            aria-expanded={open}
            aria-controls="site-nav-overlay"
            onClick={() => setOpen((v) => !v)}
          >
            <span className={styles.menuIcon} data-open={open} aria-hidden>
              <span />
              <span />
            </span>
            <span className={styles.menuLabel}>
              {open ? "Cerrar" : "Menú"}
            </span>
          </button>
        </div>
      </header>

      <div
        id="site-nav-overlay"
        className={styles.overlay}
        data-open={open ? "true" : "false"}
        aria-hidden={!open}
      >
        <div className={styles.overlayWash} aria-hidden />
        <div className={`container ${styles.overlayInner}`}>
          <div className={styles.overlayBrand}>
            <FreyaLogo variant="header-light" />
          </div>
          <nav className={styles.overlayNav} aria-label="Menú">
            {[...links, { href: "/asesor", label: "Hablar con un asesor" }].map(
              (link, i) => {
                const active =
                  pathname === link.href ||
                  pathname.startsWith(`${link.href}/`);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={styles.overlayLink}
                    data-active={active}
                    style={{
                      ["--i" as string]: String(i),
                    }}
                    onClick={() => setOpen(false)}
                    tabIndex={open ? 0 : -1}
                  >
                    <span className={styles.overlayIndex}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className={styles.overlayLabel}>{link.label}</span>
                  </Link>
                );
              },
            )}
          </nav>
          <div className={styles.overlayAside}>
            <div className={styles.overlayCol}>
              <p className={styles.overlayColLabel}>En comercialización</p>
              <ul className={styles.overlayProjects}>
                {featured.map((p) => (
                  <li key={p.slug}>
                    <Link
                      href={`/desarrollos/${p.slug}`}
                      onClick={() => setOpen(false)}
                      tabIndex={open ? 0 : -1}
                      className={styles.overlayProject}
                    >
                      <span className={styles.overlayProjectName}>{p.name}</span>
                      <span className={styles.overlayProjectMeta}>
                        {p.neighborhood} · {p.typologies}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.overlayCol}>
              <p className={styles.overlayColLabel}>Contacto</p>
              <a
                className={styles.overlayContact}
                href={`mailto:${site.contact.email}`}
                tabIndex={open ? 0 : -1}
              >
                {site.contact.email}
              </a>
              <p className={styles.overlayContactMeta}>{site.contact.address}</p>
              <p className={styles.overlayContactMeta}>{site.contact.hours}</p>
            </div>
          </div>

          <p className={styles.overlayMeta}>Imagined for personalization</p>
        </div>
      </div>
    </>
  );
}
