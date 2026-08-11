"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { MaskReveal } from "./MaskReveal";
import { MagneticCTA } from "./MagneticCTA";
import type { Project } from "@/data/projects";
import styles from "./ProjectDetailHero.module.css";

type Props = {
  project: Project;
  statusLabel: string;
  isActive: boolean;
  whatsappHref: string;
};

/**
 * Hero de ficha: la portada entra por máscara y escala hacia atrás mientras
 * el título asciende — continuidad visual con la tarjeta del listado.
 */
export function ProjectDetailHero({
  project,
  statusLabel,
  isActive,
  whatsappHref,
}: Props) {
  const rootRef = useRef<HTMLElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setEntered(true), 40);
    return () => window.clearTimeout(t);
  }, []);

  // Parallax de salida: la imagen se aleja al hacer scroll
  useEffect(() => {
    const root = rootRef.current;
    const media = mediaRef.current;
    if (!root || !media) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let queued = false;

    const measure = () => {
      queued = false;
      const rect = root.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height)));
      media.style.transform = `translate3d(0, ${p * 12}%, 0) scale(${1 + p * 0.08})`;
      media.style.opacity = String(1 - p * 0.45);
    };

    const onScroll = () => {
      if (queued) return;
      queued = true;
      raf = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      ref={rootRef}
      className={styles.root}
      data-entered={entered ? "true" : "false"}
      aria-label={project.name}
    >
      <div className={styles.mediaMask}>
        <div ref={mediaRef} className={styles.media}>
          <Image
            src={project.coverImage}
            alt=""
            fill
            priority
            sizes="100vw"
            className={styles.img}
          />
        </div>
        <div className={styles.scrim} aria-hidden />
      </div>

      <div className={styles.content}>
        <div className={styles.topRow}>
          <MaskReveal immediate delay={120}>
            <span className={styles.status} data-active={isActive}>
              {statusLabel}
            </span>
          </MaskReveal>
          <MaskReveal immediate delay={200}>
            <span className={styles.place}>
              {project.neighborhood} · {project.city}
            </span>
          </MaskReveal>
        </div>

        <MaskReveal
          as="h1"
          className={styles.title}
          lines={project.name.split(" ")}
          immediate
          delay={300}
        />

        <MaskReveal immediate delay={520}>
          <p className={styles.headline}>{project.headline}</p>
        </MaskReveal>

        <MaskReveal immediate delay={620}>
          <dl className={styles.specs}>
            <div>
              <dt>Tipo</dt>
              <dd>{project.type}</dd>
            </div>
            <div>
              <dt>Tipologías</dt>
              <dd>{project.typologies}</dd>
            </div>
            <div>
              <dt>Superficies</dt>
              <dd>{project.surfaces}</dd>
            </div>
            {project.floors || project.units ? (
              <div>
                <dt>Escala</dt>
                <dd>{project.floors ?? project.units}</dd>
              </div>
            ) : null}
            <div>
              <dt>Ubicación</dt>
              <dd>{project.location}</dd>
            </div>
          </dl>
        </MaskReveal>

        <MaskReveal immediate delay={720}>
          <div className={styles.actions}>
            {isActive ? (
              <>
                <a className={styles.waCta} href={whatsappHref} target="_blank" rel="noopener noreferrer">
                  Consultar unidades
                  <span aria-hidden>→</span>
                </a>
                <MagneticCTA
                  href={`/asesor?proyecto=${project.slug}`}
                  variant="ghost"
                >
                  Pedir brochure
                </MagneticCTA>
              </>
            ) : (
              <>
                <MagneticCTA href="/desarrollos" variant="dark">
                  Ver desarrollos activos
                </MagneticCTA>
                <MagneticCTA href="/asesor" variant="ghost">
                  Hablar con un asesor
                </MagneticCTA>
              </>
            )}
          </div>
        </MaskReveal>
      </div>
    </section>
  );
}
