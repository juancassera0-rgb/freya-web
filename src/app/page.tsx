import { Suspense } from "react";
import { ContactForm } from "@/components/ContactForm";
import { FaqList } from "@/components/FaqList";
import { MaskReveal } from "@/components/experience/MaskReveal";
import { MagneticCTA } from "@/components/experience/MagneticCTA";
import { ProjectShowcase } from "@/components/experience/ProjectShowcase";
import { ArchitecturalHero } from "@/components/project-3d/ArchitecturalHero";
import { ExplodedArchitecture } from "@/components/project-3d/ExplodedArchitecture";
import { StatsCounters } from "@/components/AnimatedCounter";
import { differentials } from "@/data/differentials";
import {
  getActiveProjects,
  getFinishedProjects,
  getProject,
} from "@/data/projects";
import { getProject3D, HERO_PROJECT_SLUG } from "@/data/project3d";
import { site } from "@/data/site";
import styles from "./home.module.css";

export default function HomePage() {
  const active = getActiveProjects();
  const finished = getFinishedProjects();
  const heroProject = getProject(HERO_PROJECT_SLUG);
  const hero3d = getProject3D(HERO_PROJECT_SLUG);

  return (
    <>
      {/* 01 — HERO 3D */}
      {heroProject && hero3d ? (
        <ArchitecturalHero
          project={heroProject}
          config={hero3d}
          zones={site.zones}
        />
      ) : null}

      {/* 02 — IDENTIDAD */}
      <section className={styles.identity} aria-labelledby="identidad">
        <div className="container-wide">
          <div className={styles.identityGrid}>
            <div className={styles.identityLabel}>
              <span className="meta-index">01</span>
              <span className="meta">Identidad</span>
            </div>

            <div className={styles.identityCopy}>
              <MaskReveal
                as="h2"
                className={styles.identityTitle}
                lines={[
                  "Obra propia,",
                  "escala humana,",
                  "personalización real.",
                ]}
              />
              <MaskReveal delay={280}>
                <p className={styles.identityLead}>{site.tagline}.</p>
              </MaskReveal>
              <MaskReveal delay={360}>
                <p className={styles.identityBody}>{site.description}</p>
              </MaskReveal>
            </div>
          </div>

          <dl className={styles.zoneRow}>
            {site.zones.map((zone, i) => (
              <div key={zone} className={styles.zone}>
                <dt>{String(i + 1).padStart(2, "0")}</dt>
                <dd>{zone}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* 03 — PROYECTOS EN COMERCIALIZACIÓN */}
      <section className={styles.showcase} aria-labelledby="desarrollos">
        <div className={`container-wide ${styles.sectionHead}`}>
          <div className={styles.sectionHeadMain}>
            <span className="meta-index">02</span>
            <MaskReveal as="h2" className={styles.sectionTitle}>
              En comercialización
            </MaskReveal>
          </div>
          <MagneticCTA href="/desarrollos" variant="ghost">
            Todos los desarrollos
          </MagneticCTA>
        </div>

        <ProjectShowcase projects={active} />
      </section>

      {/* 04 — EXPERIENCIA ARQUITECTÓNICA 3D */}
      {heroProject && hero3d ? (
        <ExplodedArchitecture project={heroProject} config={hero3d} />
      ) : null}

      {/* 05 — FILOSOFÍA */}
      <section className={styles.philosophy} aria-labelledby="filosofia">
        <div className="container-wide">
          <div className={styles.sectionHeadMain}>
            <span className="meta-index">03</span>
            <MaskReveal as="h2" className={styles.sectionTitle}>
              Cómo trabajamos
            </MaskReveal>
          </div>

          <ol className={styles.principles}>
            {differentials.map((item, i) => (
              <li key={item.title} className={styles.principle}>
                <span className={styles.principleIndex}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className={styles.principleTitle}>{item.title}</h3>
                <p className={styles.principleBody}>{item.body}</p>
              </li>
            ))}
          </ol>

          <div className={styles.philosophyFoot}>
            <MagneticCTA href="/como-trabajamos" variant="light">
              El método completo
            </MagneticCTA>
          </div>
        </div>
      </section>

      {/* 06 — TRAYECTORIA */}
      <section className={styles.stats} aria-label="Trayectoria">
        <div className="container-wide">
          <StatsCounters
            stats={site.stats}
            className={styles.statsGrid}
            itemClassName={styles.stat}
            valueClassName={styles.statValue}
            labelClassName={styles.statLabel}
          />
          <p className={styles.statNote}>
            Cifras declaradas por Freya en su comunicación pública.
          </p>
        </div>
      </section>

      {/* 07 — OBRA ENTREGADA */}
      <section className={styles.showcase} aria-labelledby="finalizados">
        <div className={`container-wide ${styles.sectionHead}`}>
          <div className={styles.sectionHeadMain}>
            <span className="meta-index">04</span>
            <MaskReveal as="h2" className={styles.sectionTitle}>
              Obra entregada
            </MaskReveal>
          </div>
        </div>

        <ProjectShowcase projects={finished} startIndex={active.length} />
      </section>

      {/* 08 — CTA COMERCIAL */}
      <section className={styles.cta} aria-labelledby="contacto-cta">
        <div className="container-wide">
          <div className={styles.ctaGrid}>
            <div>
              <span className="meta-index">05</span>
              <MaskReveal
                as="h2"
                className={styles.ctaTitle}
                lines={["¿Querés conocer", "un proyecto?"]}
              />
              <MaskReveal delay={260}>
                <p className={styles.ctaLead}>
                  Un asesor te acompaña desde la primera consulta hasta la
                  escritura, con información de avance de obra y opciones de
                  personalización.
                </p>
              </MaskReveal>

              <div className={styles.ctaActions}>
                <MagneticCTA href="/asesor" variant="dark">
                  Hablar con un asesor
                </MagneticCTA>
                <MagneticCTA href="/contacto" variant="ghost">
                  Contacto institucional
                </MagneticCTA>
              </div>

              <ul className={styles.ctaMeta}>
                <li>
                  <a
                    className="link-underline"
                    href={`mailto:${site.contact.email}`}
                  >
                    {site.contact.email}
                  </a>
                </li>
                <li>{site.contact.address}</li>
                <li>{site.contact.hours}</li>
              </ul>
            </div>

            <div className={styles.ctaForm}>
              <Suspense fallback={<p className="meta">Cargando formulario…</p>}>
                <ContactForm compact />
              </Suspense>
            </div>
          </div>
        </div>
      </section>

      {/* 09 — FAQ */}
      <section className={styles.faq} aria-labelledby="faq">
        <div className="container-wide">
          <div className={styles.faqGrid}>
            <div>
              <span className="meta-index">06</span>
              <MaskReveal as="h2" className={styles.sectionTitle}>
                Antes de escribirnos
              </MaskReveal>
              <div className={styles.faqLink}>
                <MagneticCTA href="/faq" variant="ghost">
                  Todas las preguntas
                </MagneticCTA>
              </div>
            </div>
            <FaqList limit={4} />
          </div>
        </div>
      </section>
    </>
  );
}
