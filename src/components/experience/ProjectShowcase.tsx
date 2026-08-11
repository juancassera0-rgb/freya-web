"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Project } from "@/data/projects";
import styles from "./ProjectShowcase.module.css";

type Props = {
  projects: Project[];
  /** Numeración inicial (para continuar series entre secciones) */
  startIndex?: number;
  /** Atenúa los no-hovereados: foco editorial */
  dimSiblings?: boolean;
};

/**
 * Proyectos en composición editorial asimétrica: cada obra ocupa una banda
 * completa, alternando lado de imagen. La imagen hace parallax suave y se
 * revela por máscara; el resto se atenúa al enfocar uno.
 */
export function ProjectShowcase({
  projects,
  startIndex = 0,
  dimSiblings = true,
}: Props) {
  const [focused, setFocused] = useState<string | null>(null);

  return (
    <div
      className={styles.list}
      data-dim={dimSiblings && focused ? "true" : "false"}
      onPointerLeave={() => setFocused(null)}
    >
      {projects.map((project, i) => (
        <ProjectRow
          key={project.slug}
          project={project}
          index={startIndex + i + 1}
          flip={i % 2 === 1}
          focused={focused === project.slug}
          onFocus={() => setFocused(project.slug)}
        />
      ))}
    </div>
  );
}

type RowProps = {
  project: Project;
  index: number;
  flip: boolean;
  focused: boolean;
  onFocus: () => void;
};

function ProjectRow({ project, index, flip, focused, onFocus }: RowProps) {
  const rowRef = useRef<HTMLElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  // Reveal por máscara al entrar
  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Parallax vertical de la imagen — desplazamiento contenido
  useEffect(() => {
    const row = rowRef.current;
    const media = mediaRef.current;
    if (!row || !media) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let queued = false;
    let active = false;

    const io = new IntersectionObserver(
      ([entry]) => {
        active = Boolean(entry?.isIntersecting);
        if (active) onScroll();
      },
      { rootMargin: "15% 0px" },
    );
    io.observe(row);

    const measure = () => {
      queued = false;
      const rect = row.getBoundingClientRect();
      const centre = rect.top + rect.height / 2 - window.innerHeight / 2;
      const shift = Math.max(-28, Math.min(28, (centre / window.innerHeight) * -34));
      media.style.transform = `translate3d(0, ${shift}px, 0) scale(1.1)`;
    };

    const onScroll = () => {
      if (queued || !active) return;
      queued = true;
      raf = requestAnimationFrame(measure);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const statusLabel =
    project.status === "en-comercializacion" ? "En comercialización" : "Finalizado";

  return (
    <article
      ref={rowRef}
      className={styles.row}
      data-flip={flip ? "true" : "false"}
      data-visible={visible ? "true" : "false"}
      data-focused={focused ? "true" : "false"}
      onPointerEnter={onFocus}
    >
      <Link
        href={`/desarrollos/${project.slug}`}
        className={styles.link}
        data-cursor="Ver proyecto"
        aria-label={`${project.name}, ${project.neighborhood}`}
      >
        <div className={styles.mediaMask}>
          <div ref={mediaRef} className={styles.media}>
            <Image
              src={project.coverImage}
              alt=""
              fill
              sizes="(max-width: 900px) 100vw, 58vw"
              className={styles.img}
            />
          </div>
          <span className={styles.status}>{statusLabel}</span>
        </div>

        <div className={styles.copy}>
          <span className={styles.index}>
            {String(index).padStart(2, "0")}
          </span>

          <h3 className={styles.name}>{project.name}</h3>

          <p className={styles.place}>
            {project.neighborhood} · {project.city}
          </p>

          <p className={styles.headline}>{project.headline}</p>

          <dl className={styles.specs}>
            <div>
              <dt>Tipologías</dt>
              <dd>{project.typologies}</dd>
            </div>
            <div>
              <dt>Superficies</dt>
              <dd>{project.surfaces}</dd>
            </div>
            {project.floors ? (
              <div>
                <dt>Escala</dt>
                <dd>{project.floors}</dd>
              </div>
            ) : project.units ? (
              <div>
                <dt>Escala</dt>
                <dd>{project.units}</dd>
              </div>
            ) : null}
          </dl>

          <span className={styles.action}>
            Ver proyecto
            <span className={styles.arrow} aria-hidden>→</span>
          </span>
        </div>
      </Link>
    </article>
  );
}
