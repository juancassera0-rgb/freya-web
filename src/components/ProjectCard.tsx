import Link from "next/link";
import type { Project } from "@/data/projects";
import { CountedText } from "./AnimatedCounter";
import { ProjectVisual } from "./ProjectVisual";
import styles from "./ProjectCard.module.css";

type Props = {
  project: Project;
  featured?: boolean;
};

export function ProjectCard({ project, featured = false }: Props) {
  const isActive = project.status === "en-comercializacion";
  const statusLabel = isActive ? "En comercialización" : "Finalizado";

  return (
    <article
      className={styles.card}
      data-featured={featured}
      data-status={project.status}
    >
      <Link href={`/desarrollos/${project.slug}`} className={styles.media}>
        <ProjectVisual
          src={project.coverImage}
          alt={project.name}
          priority={featured}
        />
      </Link>
      <div className={styles.body}>
        <div className={styles.metaTop}>
          <p className={styles.loc}>
            {project.neighborhood}, {project.city}
          </p>
          <p className={styles.status} data-active={isActive ? "true" : "false"}>
            {statusLabel}
          </p>
        </div>
        <h3>
          <Link href={`/desarrollos/${project.slug}`}>{project.name}</Link>
        </h3>
        <p className={styles.summary}>{project.headline}</p>
        <dl className={styles.meta}>
          <div>
            <dt>Tipologías</dt>
            <dd>
              <CountedText text={project.typologies} />
            </dd>
          </div>
          <div>
            <dt>Superficies</dt>
            <dd>
              <CountedText text={project.surfaces} />
            </dd>
          </div>
        </dl>
        <div className={styles.actions}>
          <Link
            className={styles.ctaPrimary}
            href={`/desarrollos/${project.slug}`}
          >
            Conocer proyecto
            <span aria-hidden>→</span>
          </Link>
          {isActive && (
            <Link
              className={styles.ctaText}
              href={`/asesor?proyecto=${project.slug}`}
            >
              Consultar unidades
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
