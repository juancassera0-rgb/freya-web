"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FreyaLogo } from "@/components/FreyaLogo";
import { LineReveal } from "@/components/LineReveal";
import type { Project } from "@/data/projects";
import type { Project3DConfig } from "@/data/project3d";
import { BuildingPlaceholder } from "./BuildingPlaceholder";
import { usePerfFlags } from "./useClientFlags";
import styles from "./ProjectHero3D.module.css";

const Project3DScene = dynamic(
  () => import("./Project3DScene").then((m) => m.Project3DScene),
  { ssr: false, loading: () => <div className={styles.canvasFallback} /> },
);

type Props = {
  project: Project;
  config: Project3DConfig;
};

/**
 * Hero 3D — el proyecto es protagonista.
 * Cámara cinematográfica + scroll que acerca el volumen.
 */
export function ProjectHero3D({ project, config }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const { reducedMotion, lite } = usePerfFlags();
  const enabled = !reducedMotion;
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || !enabled) return;

    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const travel = Math.max(1, rect.height - window.innerHeight);
      const raw = Math.min(1, Math.max(0, -rect.top / travel));
      setProgress(raw);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [enabled]);

  return (
    <section
      ref={sectionRef}
      className={styles.root}
      aria-label={`Presentación 3D de ${project.name}`}
    >
      <div className={styles.sticky}>
        <div className={styles.stage}>
          {enabled ? (
            <Project3DScene
              config={config}
              variant="hero"
              cameraProgress={progress}
              performanceMode={lite ? "lite" : "full"}
              enablePointerParallax={!lite}
            >
              <BuildingPlaceholder config={config} />
            </Project3DScene>
          ) : (
            <div
              className={styles.poster}
              style={{ backgroundImage: `url(${project.coverImage})` }}
            />
          )}
          <div className={styles.veil} aria-hidden />
          <div className={styles.grid} aria-hidden>
            <span /><span /><span /><span />
          </div>
        </div>

        <div className={`container ${styles.ui}`}>
          <div className={styles.top}>
            <LineReveal as="div" className={styles.brand} immediate delay={200}>
              <FreyaLogo variant="hero" priority />
            </LineReveal>
            <LineReveal as="p" className={styles.eyebrow} immediate delay={360}>
              Proyecto en foco · {project.neighborhood}
            </LineReveal>
          </div>

          <div className={styles.main}>
            <div className={styles.copy}>
              <h1 className={styles.title}>
                <LineReveal as="span" className={styles.line} immediate delay={480}>
                  {project.name}
                </LineReveal>
                <LineReveal as="span" className={styles.lineSub} immediate delay={580}>
                  {project.headline}
                </LineReveal>
              </h1>
              <LineReveal as="p" className={styles.lead} immediate delay={700}>
                {project.summary}
              </LineReveal>
              <LineReveal as="div" className={styles.actions} immediate delay={820}>
                <Link
                  className={styles.primary}
                  href={`/desarrollos/${project.slug}`}
                >
                  <span className={styles.sq} aria-hidden />
                  Entrar al proyecto
                  <span aria-hidden>→</span>
                </Link>
                <Link className={styles.secondary} href="/desarrollos">
                  Ver todos los desarrollos
                </Link>
              </LineReveal>
            </div>
          </div>

          {config.status === "placeholder" && (
            <p className={styles.badge}>{config.placeholderNote}</p>
          )}

          <p className={styles.scrollHint} aria-hidden>
            Desplazá para acercarte
          </p>
        </div>
      </div>
    </section>
  );
}
