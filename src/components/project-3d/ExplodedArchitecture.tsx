"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { MagneticCTA } from "@/components/experience/MagneticCTA";
import { useScrollProgress } from "@/components/experience/useScrollProgress";
import type { Project } from "@/data/projects";
import type { Project3DConfig } from "@/data/project3d";
import { ArchitecturalMassing } from "./ArchitecturalMassing";
import { usePerfFlags } from "./useClientFlags";
import { useCanvasActive } from "./useCanvasActive";
import styles from "./ExplodedArchitecture.module.css";

const Project3DScene = dynamic(
  () => import("./Project3DScene").then((m) => m.Project3DScene),
  { ssr: false, loading: () => <div className={styles.canvasFallback} /> },
);

type Props = {
  project: Project;
  config: Project3DConfig;
};

type Chapter = {
  index: string;
  title: string;
  body: string;
};

/**
 * Narrativa arquitectónica scroll-driven: el volumen queda pinned y se
 * descompone progresivamente mientras avanza el relato.
 *
 *   0–25%   volumen completo
 *   25–50%  las losas se separan (exploded)
 *   50–75%  se aísla un nivel
 *   75–100% se enfoca la unidad
 */
export function ExplodedArchitecture({ project, config }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const { reducedMotion, lite, webglOk } = usePerfFlags();
  const enabled = !reducedMotion && webglOk;
  const { progress } = useScrollProgress(sectionRef, { enabled, steps: 80 });
  const { mounted, active } = useCanvasActive(sectionRef, { rootMargin: "0px" });

  const chapters: Chapter[] = [
    {
      index: "01",
      title: "El volumen",
      body: `${project.name} se lee primero como masa: proporción, retiros y la relación con la línea municipal de ${project.neighborhood}.`,
    },
    {
      index: "02",
      title: "Los niveles",
      body: `${config.schematicFloors} plantas se separan para mostrar cómo se apila el programa. Cada losa expresa su canto y su balcón.`,
    },
    {
      index: "03",
      title: "La planta",
      body: "Al aislar un nivel aparece la lógica de distribución: núcleo, circulación y orientación de cada unidad.",
    },
    {
      index: "04",
      title: "La unidad",
      body: `${project.typologies} · ${project.surfaces}. Del volumen general al espacio concreto donde se vive.`,
    },
  ];

  // Fase activa a partir del progreso
  const phase = Math.min(3, Math.floor(progress * 4));

  // Explode: crece entre 22% y 55%, se sostiene después
  const explode = Math.min(1, Math.max(0, (progress - 0.22) / 0.33));

  // Piso destacado: aparece en la fase 2, se centra en la 3
  const highlightedFloor =
    progress > 0.52
      ? Math.max(1, Math.round(config.schematicFloors * 0.62))
      : null;

  return (
    <section
      ref={sectionRef}
      className={styles.root}
      aria-label="Recorrido arquitectónico del proyecto"
    >
      <div className={styles.sticky}>
        <div className={styles.stage}>
          {enabled && mounted ? (
            <Project3DScene
              config={config}
              variant="studio"
              controlMode="cinematic"
              cameraProgress={progress}
              performanceMode={lite ? "lite" : "full"}
              enablePointerParallax={false}
              active={active}
            >
              <ArchitecturalMassing
                config={config}
                explode={explode}
                highlightedFloor={highlightedFloor}
                dimOthers={progress > 0.52}
                lite={lite}
              />
            </Project3DScene>
          ) : (
            <div
              className={styles.poster}
              style={{ backgroundImage: `url(${project.coverImage})` }}
              role="img"
              aria-label={project.name}
            />
          )}
        </div>

        <div className={styles.overlay}>
          <div className={styles.head}>
            <span className={styles.eyebrow}>Recorrido</span>
            <span className={styles.counter}>
              <em>{chapters[phase]?.index}</em>
              <span aria-hidden>/</span>
              <span>{String(chapters.length).padStart(2, "0")}</span>
            </span>
          </div>

          <ol className={styles.chapters}>
            {chapters.map((c, i) => (
              <li
                key={c.index}
                className={styles.chapter}
                data-active={i === phase ? "true" : "false"}
                data-passed={i < phase ? "true" : "false"}
              >
                <span className={styles.chapterIndex}>{c.index}</span>
                <div className={styles.chapterBody}>
                  <h3>{c.title}</h3>
                  <p>{c.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className={styles.progressTrack} aria-hidden>
            <span
              className={styles.progressFill}
              style={{ transform: `scaleX(${progress})` }}
            />
          </div>

          <MagneticCTA
            href={`/desarrollos/${project.slug}`}
            variant="light"
            className={styles.cta}
          >
            Explorar el edificio
          </MagneticCTA>
        </div>

        <p className={styles.note}>
          Volumetría conceptual — representación esquemática, no la geometría
          definitiva.
        </p>
      </div>
    </section>
  );
}
