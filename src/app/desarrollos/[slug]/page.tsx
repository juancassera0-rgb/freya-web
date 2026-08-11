import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProjectVisual } from "@/components/ProjectVisual";
import { ProjectFacts } from "@/components/ProjectFacts";
import { ProjectGallery } from "@/components/ProjectGallery";
import { ContactForm } from "@/components/ContactForm";
import { ScrollReveal } from "@/components/ScrollReveal";
import { getProject, projects } from "@/data/projects";
import { whatsappUrl } from "@/data/site";
import styles from "./page.module.css";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return { title: "Proyecto" };
  return {
    title: `${project.name} · ${project.neighborhood}`,
    description: project.summary,
  };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const isActive = project.status === "en-comercializacion";
  const statusLabel = isActive ? "En comercialización" : "Finalizado";

  return (
    <>
      <section className={styles.hero} data-status={project.status}>
        <div className={styles.heroMedia}>
          <ProjectVisual
            src={project.coverImage}
            alt={project.name}
            large
            priority
          />
          <span className={styles.heroSq} aria-hidden />
        </div>
        <div className={`container ${styles.heroText}`}>
          <ScrollReveal>
            <p className={styles.heroEyebrow}>
              <span>{project.neighborhood}</span>
              <span className={styles.heroDot} aria-hidden />
              <span data-active={isActive ? "true" : "false"}>
                {statusLabel}
              </span>
            </p>
            <h1>{project.name}</h1>
            <p className={styles.headline}>{project.headline}</p>
            <div className={styles.heroActions}>
              {isActive ? (
                <>
                  <a
                    className={styles.ctaPrimary}
                    href={whatsappUrl(project.ctaMessage)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Consultar unidades
                    <span aria-hidden>→</span>
                  </a>
                  <Link
                    className={styles.ctaText}
                    href={`/asesor?proyecto=${project.slug}`}
                  >
                    Pedir precios / brochure
                  </Link>
                </>
              ) : (
                <>
                  <Link className={styles.ctaPrimary} href="/desarrollos">
                    Ver otros desarrollos
                    <span aria-hidden>→</span>
                  </Link>
                  <Link className={styles.ctaText} href="/asesor">
                    Hablar con un asesor
                  </Link>
                </>
              )}
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <ScrollReveal>
            <ProjectFacts project={project} statusLabel={statusLabel} />
          </ScrollReveal>
        </div>
      </section>

      <section className={`section-tight ${styles.gallery}`}>
        <div className="container">
          <ScrollReveal>
            <div className={styles.galleryHead}>
              <h2>Galería</h2>
              <p className={styles.galleryHint}>Hacé clic para ampliar</p>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={80}>
            <ProjectGallery
              images={project.gallery}
              projectName={project.name}
            />
          </ScrollReveal>
        </div>
      </section>

      <section className={`section-tight ${styles.copy}`}>
        <div className="container grid-2">
          <ScrollReveal from="left">
            <article className={styles.copyCard}>
              <h2>El proyecto</h2>
              <p>{project.summary}</p>
              {project.spacesCopy && <p>{project.spacesCopy}</p>}
            </article>
          </ScrollReveal>
          <ScrollReveal from="right" delay={100}>
            <article className={styles.copyCard}>
              <h2>El barrio</h2>
              <p>{project.neighborhoodCopy}</p>
            </article>
          </ScrollReveal>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <ScrollReveal>
            <h2>Destacados</h2>
            <ul className={styles.highlights}>
              {project.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <div className={styles.commercial}>
              <h3>
                {isActive
                  ? "Información comercial"
                  : "Proyecto finalizado"}
              </h3>
              <p>
                {isActive
                  ? "Precios, disponibilidad, financiación y fecha estimada de entrega se informan de forma personalizada."
                  : "Esta obra ya fue entregada. Sirve como respaldo de ejecución de Freya; si buscás unidades actuales, consultá los desarrollos en comercialización."}
              </p>
              <div className={styles.heroActions}>
                {isActive ? (
                  <>
                    <a
                      className={styles.ctaPrimary}
                      href={whatsappUrl(project.ctaMessage)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      WhatsApp
                      <span aria-hidden>→</span>
                    </a>
                    <Link className={styles.ctaText} href="/desarrollos">
                      Volver a desarrollos
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      className={styles.ctaPrimary}
                      href="/desarrollos"
                    >
                      Ver desarrollos activos
                      <span aria-hidden>→</span>
                    </Link>
                    <Link className={styles.ctaText} href="/asesor">
                      Hablar con un asesor
                    </Link>
                  </>
                )}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {isActive && (
        <section className={`section ${styles.formSection}`}>
          <div className="container grid-2">
            <ScrollReveal from="left">
              <p className="eyebrow">Consulta</p>
              <h2>Escribinos por {project.shortName}</h2>
              <p className="lead" style={{ marginTop: "0.85rem" }}>
                Un asesor te responde por tipologías, disponibilidad y visita.
              </p>
            </ScrollReveal>
            <ScrollReveal from="right" delay={100}>
              <Suspense fallback={<p>Cargando formulario…</p>}>
                <ContactForm defaultProject={project.slug} />
              </Suspense>
            </ScrollReveal>
          </div>
        </section>
      )}

      {isActive && (
        <div className={styles.stickyBar}>
          <div className={`container ${styles.stickyInner}`}>
            <p>
              <strong>{project.name}</strong>
              <span>
                {project.neighborhood} · {project.typologies}
              </span>
            </p>
            <div className={styles.stickyActions}>
              <a
                className={styles.stickyText}
                href={whatsappUrl(project.ctaMessage)}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp
              </a>
              <Link
                className={styles.stickyPrimary}
                href={`/asesor?proyecto=${project.slug}`}
              >
                Consultar
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
