"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { MagneticCTA } from "@/components/experience/MagneticCTA";
import { useScrollProgress } from "@/components/experience/useScrollProgress";
import type { Project } from "@/data/projects";
import type { Project3DConfig } from "@/data/project3d";
import { usePerfFlags } from "./useClientFlags";
import { useBlockPageZoom } from "./useBlockPageZoom";
import { useCanvasActive } from "./useCanvasActive";
import { FRAMING, useViewportClass } from "./useViewportClass";
import styles from "./ExplodedArchitecture.module.css";

const MassingCanvas = dynamic(() => import("./MassingCanvas"), {
  ssr: false,
  loading: () => <div className={styles.canvasFallback} />,
});

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
  const { reducedMotion, lite, touch, tier, webglOk } = usePerfFlags();
  const framing = FRAMING[useViewportClass()];
  const enabled = !reducedMotion && webglOk;
  const { progress, rawRef } = useScrollProgress(sectionRef, {
    enabled,
    steps: 4,
  });
  const { mounted, active } = useCanvasActive(sectionRef, { rootMargin: "0px" });

  useBlockPageZoom(sectionRef, touch);

  // Fase activa a partir del progreso
  const phase = Math.min(3, Math.floor(progress * 4));

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
      body: "Del volumen general al espacio concreto donde se vive.",
    },
  ];

  /**
   * Explode derivado del progreso continuo.
   *
   * El bucle ya no es permanente. Antes corría un `requestAnimationFrame`
   * encadenado mientras la sección estuviera en viewport, aunque la página
   * estuviera completamente quieta: un callback por frame en el hilo
   * principal, el mismo que arma los frames de WebGL, sin nada que
   * actualizar. Ahora arranca con el scroll y se apaga 240 ms después del
   * último evento, cuando el valor ya convergió.
   *
   * La consecuencia práctica se nota al leer los capítulos sin scrollear:
   * antes había trabajo constante compitiendo con el render; ahora no.
   */
  const explodeRef = useRef(0);
  useEffect(() => {
    if (!enabled || !active) return;

    let raf = 0;
    let stopAt = 0;
    let running = false;

    const apply = () => {
      explodeRef.current = Math.min(
        1,
        Math.max(0, (rawRef.current - 0.22) / 0.33),
      );
    };

    const tick = () => {
      apply();
      if (performance.now() < stopAt) {
        raf = requestAnimationFrame(tick);
      } else {
        running = false;
      }
    };

    const onScroll = () => {
      stopAt = performance.now() + 240;
      if (!running) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    };

    // Primera pasada: deja el valor correcto sin esperar un scroll
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, [enabled, active, rawRef]);

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
            <MassingCanvas
              config={config}
              variant="studio"
              cameraProgressRef={rawRef}
              explodeRef={explodeRef}
              highlightedFloor={highlightedFloor}
              dimOthers={progress > 0.52}
              lite={lite}
              tier={tier}
              touch={touch}
              framing={framing}
              enablePointerParallax={false}
              active={active}
            />
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
