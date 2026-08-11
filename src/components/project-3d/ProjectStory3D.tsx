"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Project } from "@/data/projects";
import type { Project3DConfig } from "@/data/project3d";
import { ArchitecturalMassing } from "./ArchitecturalMassing";
import { usePerfFlags } from "./useClientFlags";
import styles from "./ProjectStory3D.module.css";

const Project3DScene = dynamic(
  () => import("./Project3DScene").then((m) => m.Project3DScene),
  { ssr: false, loading: () => <div className={styles.canvasFallback} /> },
);

type Props = {
  project: Project;
  config: Project3DConfig;
};

/**
 * Story sticky: edificio permanece, el contenido y la cámara evolucionan.
 * Impacto → Arquitectura → Ubicación → Habitar → Niveles.
 */
export function ProjectStory3D({ project, config }: Props) {
  const rootRef = useRef<HTMLElement>(null);
  const { reducedMotion, lite } = usePerfFlags();
  const enabled = !reducedMotion;
  const [progress, setProgress] = useState(0);
  const [activeId, setActiveId] = useState(config.story[0]?.id ?? "");
  const [highlightFloor, setHighlightFloor] = useState<number | null>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || !enabled) return;

    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const travel = Math.max(1, rect.height - window.innerHeight);
      const p = Math.min(1, Math.max(0, -rect.top / travel));
      setProgress(p);

      let current = config.story[0];
      for (const chapter of config.story) {
        if (p >= chapter.cameraAt - 0.08) current = chapter;
      }
      if (current) {
        setActiveId(current.id);
        setHighlightFloor(current.highlightFloor ?? null);
      }
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [config.story, enabled]);

  return (
    <section
      ref={rootRef}
      className={styles.root}
      aria-label={`Recorrido de ${project.name}`}
    >
      <div className={styles.sticky}>
        <div className={styles.stage}>
          {enabled ? (
            <Project3DScene
              config={config}
              variant="studio"
              cameraProgress={progress}
              enablePointerParallax={!lite}
              performanceMode={lite ? "lite" : "full"}
            >
              <ArchitecturalMassing
                config={config}
                highlightedFloor={highlightFloor}
                dimOthers={highlightFloor != null}
                lite={lite}
              />
            </Project3DScene>
          ) : (
            <div
              className={styles.poster}
              style={{ backgroundImage: `url(${project.coverImage})` }}
            />
          )}
        </div>

        <div className={styles.panel}>
          <p className={styles.eyebrow}>Recorrido del proyecto</p>
          <ol className={styles.chapters}>
            {config.story.map((chapter) => (
              <li
                key={chapter.id}
                className={styles.chapter}
                data-active={activeId === chapter.id ? "true" : "false"}
              >
                <span className={styles.index}>{chapter.index}</span>
                <div>
                  <h3>{chapter.title}</h3>
                  <p>{chapter.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <Link
            className={styles.cta}
            href={`/asesor?proyecto=${project.slug}`}
          >
            Consultar por {project.shortName}
            <span aria-hidden>→</span>
          </Link>
          {config.status === "placeholder" && (
            <p className={styles.note}>{config.placeholderNote}</p>
          )}
        </div>
      </div>
    </section>
  );
}
