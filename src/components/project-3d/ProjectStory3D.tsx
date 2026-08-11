"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useRef } from "react";
import { useScrollProgress } from "@/components/experience/useScrollProgress";
import type { Project } from "@/data/projects";
import type { Project3DConfig } from "@/data/project3d";
import { usePerfFlags } from "./useClientFlags";
import { useCanvasActive } from "./useCanvasActive";
import { FRAMING, useViewportClass } from "./useViewportClass";
import styles from "./ProjectStory3D.module.css";

const MassingCanvas = dynamic(() => import("./MassingCanvas"), {
  ssr: false,
  loading: () => <div className={styles.canvasFallback} />,
});

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
  const { reducedMotion, lite, touch, tier } = usePerfFlags();
  const framing = FRAMING[useViewportClass()];
  const enabled = !reducedMotion;
  const { mounted, active } = useCanvasActive(rootRef, { rootMargin: "0px" });

  /**
   * Antes esto era un listener de scroll sin throttle que llamaba setState
   * en cada evento — re-renderizaba toda la sección (y el árbol 3D) decenas
   * de veces por segundo. Ahora el progreso continuo va por ref al canvas y
   * React sólo re-renderiza al cambiar de capítulo.
   */
  const { progress, rawRef } = useScrollProgress(rootRef, {
    enabled,
    steps: Math.max(4, config.story.length * 2),
  });

  const activeChapter = useMemo(() => {
    let current = config.story[0];
    for (const chapter of config.story) {
      if (progress >= chapter.cameraAt - 0.08) current = chapter;
    }
    return current;
  }, [config.story, progress]);

  const activeId = activeChapter?.id ?? "";
  const highlightFloor = activeChapter?.highlightFloor ?? null;

  return (
    <section
      ref={rootRef}
      className={styles.root}
      aria-label={`Recorrido de ${project.name}`}
    >
      <div className={styles.sticky}>
        <div className={styles.stage}>
          {enabled && mounted ? (
            <MassingCanvas
              config={config}
              variant="studio"
              cameraProgressRef={rawRef}
              highlightedFloor={highlightFloor}
              dimOthers={highlightFloor != null}
              lite={lite}
              tier={tier}
              touch={touch}
              framing={framing}
              enablePointerParallax={!lite}
              active={active}
            />
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
