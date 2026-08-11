"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { Project } from "@/data/projects";
import { ProjectVisual } from "./ProjectVisual";
import { CountedText } from "./AnimatedCounter";
import { ScrollReveal } from "./ScrollReveal";
import styles from "./ProjectRail.module.css";

type Props = {
  projects: Project[];
  finished?: boolean;
};

/** Carril editorial horizontal (inspiración OCI) adaptado a Freya. */
export function ProjectRail({ projects, finished = false }: Props) {
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    const onWheel = (e: WheelEvent) => {
      if (window.innerWidth < 900) return;
      if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
      if (rail.scrollWidth <= rail.clientWidth) return;

      const atStart = rail.scrollLeft <= 0;
      const atEnd =
        rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 2;

      if ((e.deltaY < 0 && atStart) || (e.deltaY > 0 && atEnd)) return;

      e.preventDefault();
      rail.scrollLeft += e.deltaY;
    };

    rail.addEventListener("wheel", onWheel, { passive: false });
    return () => rail.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <div className={styles.root}>
      <div className={styles.guide} aria-hidden>
        <span />
        <span />
        <span />
        <span />
      </div>
      <div ref={railRef} className={styles.rail}>
        {projects.map((project, i) => {
          const isActive = project.status === "en-comercializacion";
          return (
            <ScrollReveal key={project.slug} delay={i * 80} className={styles.card}>
              <article data-finished={finished ? "true" : "false"}>
                <Link
                  href={`/desarrollos/${project.slug}`}
                  className={styles.media}
                >
                  <ProjectVisual
                    src={project.coverImage}
                    alt={project.name}
                    priority={i === 0}
                  />
                  <span className={styles.index}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className={styles.sq} aria-hidden />
                </Link>
                <div className={styles.body}>
                  <p className={styles.meta}>
                    <span>{project.neighborhood}</span>
                    <span className={styles.dot} aria-hidden />
                    <span data-active={isActive ? "true" : "false"}>
                      {isActive ? "En comercialización" : "Finalizado"}
                    </span>
                  </p>
                  <h3>
                    <Link href={`/desarrollos/${project.slug}`}>
                      {project.name}
                    </Link>
                  </h3>
                  <p className={styles.facts}>
                    <CountedText text={project.typologies} />
                    <span aria-hidden> · </span>
                    <CountedText text={project.surfaces} />
                  </p>
                  <Link
                    className={styles.link}
                    href={`/desarrollos/${project.slug}`}
                  >
                    Conocer
                    <span aria-hidden>→</span>
                  </Link>
                </div>
              </article>
            </ScrollReveal>
          );
        })}
      </div>
    </div>
  );
}
