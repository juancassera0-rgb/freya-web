import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProjectFacts } from "@/components/ProjectFacts";
import { ProjectGallery } from "@/components/ProjectGallery";
import { ContactForm } from "@/components/ContactForm";
import { ScrollReveal } from "@/components/ScrollReveal";
import { MaskReveal } from "@/components/experience/MaskReveal";
import { ProjectDetailHero } from "@/components/experience/ProjectDetailHero";
import { BuildingExplorer } from "@/components/project-3d/BuildingExplorer";
import { ProjectStory3D } from "@/components/project-3d/ProjectStory3D";
import { getProject, projects } from "@/data/projects";
import { getProject3D } from "@/data/project3d";
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
  const project3d = getProject3D(project.slug);

  return (
    <>
      <ProjectDetailHero
        project={project}
        statusLabel={statusLabel}
        isActive={isActive}
        whatsappHref={whatsappUrl(project.ctaMessage)}
      />

      {/* Storytelling — el proyecto y su barrio */}
      <section className={styles.narrative}>
        <div className="container-wide">
          <div className={styles.narrativeGrid}>
            <div className={styles.narrativeLabel}>
              <span className="meta-index">01</span>
              <span className="meta">El proyecto</span>
            </div>
            <div className={styles.narrativeCopy}>
              <MaskReveal as="p" className={styles.narrativeLead}>
                {project.summary}
              </MaskReveal>
              {project.spacesCopy ? (
                <MaskReveal delay={160}>
                  <p className={styles.narrativeBody}>{project.spacesCopy}</p>
                </MaskReveal>
              ) : null}
            </div>
          </div>

          <div className={styles.narrativeGrid}>
            <div className={styles.narrativeLabel}>
              <span className="meta-index">02</span>
              <span className="meta">El barrio</span>
            </div>
            <div className={styles.narrativeCopy}>
              <MaskReveal as="p" className={styles.narrativeLead}>
                {project.neighborhoodCopy}
              </MaskReveal>
            </div>
          </div>

          <ul className={styles.highlightList}>
            {project.highlights.map((item, i) => (
              <li key={item}>
                <span className={styles.highlightIndex}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {project3d ? (
        <>
          <ProjectStory3D project={project} config={project3d} />
          <BuildingExplorer config={project3d} projectName={project.name} />
        </>
      ) : null}

      <section className={`section-tight ${styles.gallery}`}>
        <div className="container-wide">
          <ScrollReveal>
            <div className={styles.galleryHead}>
              <span className="meta-index">03</span>
              <h2 className={styles.galleryTitle}>Galería</h2>
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

      <section className="section">
        <div className="container-wide">
          <ScrollReveal>
            <ProjectFacts project={project} statusLabel={statusLabel} />
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
