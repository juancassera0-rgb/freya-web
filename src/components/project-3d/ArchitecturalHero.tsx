"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRef } from "react";
import { MaskReveal } from "@/components/experience/MaskReveal";
import { MagneticCTA } from "@/components/experience/MagneticCTA";
import { useScrollProgress } from "@/components/experience/useScrollProgress";
import type { Project } from "@/data/projects";
import type { Project3DConfig } from "@/data/project3d";
import { ArchitecturalMassing } from "./ArchitecturalMassing";
import { usePerfFlags } from "./useClientFlags";
import { useCanvasActive } from "./useCanvasActive";
import styles from "./ArchitecturalHero.module.css";

const Project3DScene = dynamic(
  () => import("./Project3DScene").then((m) => m.Project3DScene),
  { ssr: false, loading: () => <div className={styles.canvasFallback} /> },
);

type Props = {
  project: Project;
  config: Project3DConfig;
  /** Zonas donde la desarrolladora tiene obra entregada */
  zones: readonly string[];
};

/**
 * Hero cinematográfico. La arquitectura es el sujeto; la tipografía enmarca.
 *
 * Secuencia de entrada: escena → marca → headline → metadata → scroll hint.
 * Durante el scroll la cámara se aproxima al volumen (CameraRig lee progress).
 */
export function ArchitecturalHero({ project, config, zones }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const { reducedMotion, lite, webglOk } = usePerfFlags();
  const enabled = !reducedMotion && webglOk;
  const { progress } = useScrollProgress(sectionRef, { enabled, steps: 60 });
  const { active } = useCanvasActive(sectionRef, { rootMargin: "0px" });

  const year = new Date().getFullYear();

  return (
    <section
      ref={sectionRef}
      className={styles.root}
      aria-label={`${project.name} — presentación`}
    >
      <div className={styles.sticky}>
        {/* Capa 3D */}
        <div className={styles.stage} aria-hidden={enabled ? undefined : true}>
          {enabled ? (
            <Project3DScene
              config={config}
              variant="hero"
              cameraProgress={progress}
              performanceMode={lite ? "lite" : "full"}
              enablePointerParallax={!lite}
              active={active}
            >
              <ArchitecturalMassing config={config} lite={lite} />
            </Project3DScene>
          ) : (
            <div
              className={styles.poster}
              style={{ backgroundImage: `url(${project.coverImage})` }}
              role="img"
              aria-label={`${project.name}, ${project.neighborhood}`}
            />
          )}
          <div className={styles.vignette} aria-hidden />
        </div>

        {/* Retícula estructural de fondo */}
        <div className={styles.gridLines} aria-hidden>
          <span /><span /><span /><span /><span />
        </div>

        {/* Capa tipográfica */}
        <div className={styles.ui}>
          <header className={styles.topMeta}>
            <MaskReveal immediate delay={150}>
              <span className={styles.wordmark}>FREYA</span>
            </MaskReveal>
            <MaskReveal immediate delay={260}>
              <span className={styles.metaLine}>
                Desarrollos residenciales · Buenos Aires
              </span>
            </MaskReveal>
          </header>

          <div className={styles.headlineBlock}>
            <MaskReveal
              as="h1"
              className={styles.headline}
              lines={["Arquitectura", "para una nueva", "forma de vivir"]}
              immediate
              delay={380}
            />
          </div>

          <footer className={styles.bottomMeta}>
            <MaskReveal immediate delay={760}>
              <div className={styles.focusCard}>
                <span className={styles.focusLabel}>Proyecto en foco</span>
                <Link
                  href={`/desarrollos/${project.slug}`}
                  className={styles.focusName}
                  data-cursor="Ver"
                >
                  {project.name}
                </Link>
                <span className={styles.focusPlace}>
                  {project.neighborhood} · {project.typologies}
                </span>
              </div>
            </MaskReveal>

            <MaskReveal immediate delay={860}>
              <dl className={styles.specs}>
                <div>
                  <dt>Zonas</dt>
                  <dd>{zones.length}</dd>
                </div>
                <div>
                  <dt>Trayectoria</dt>
                  <dd>20+ años</dd>
                </div>
                <div>
                  <dt>Año</dt>
                  <dd>{year}</dd>
                </div>
              </dl>
            </MaskReveal>

            <MaskReveal immediate delay={960}>
              <div className={styles.actions}>
                <MagneticCTA href={`/desarrollos/${project.slug}`} variant="dark">
                  Entrar al proyecto
                </MagneticCTA>
                <MagneticCTA href="/desarrollos" variant="ghost">
                  Ver desarrollos
                </MagneticCTA>
              </div>
            </MaskReveal>
          </footer>

          <div className={styles.scrollHint} aria-hidden>
            <span className={styles.scrollLabel}>Scroll</span>
            <span className={styles.scrollBar} />
          </div>
        </div>

        {config.status === "placeholder" ? (
          <p className={styles.badge} role="note">
            Volumetría conceptual — no representa la geometría definitiva del
            edificio.
          </p>
        ) : null}
      </div>
    </section>
  );
}
