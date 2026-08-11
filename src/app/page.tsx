import Link from "next/link";
import { Suspense } from "react";
import { FaqList } from "@/components/FaqList";
import { ContactForm } from "@/components/ContactForm";
import { ScrollReveal } from "@/components/ScrollReveal";
import { TextReveal } from "@/components/TextReveal";
import { MethodPinned } from "@/components/MethodPinned";
import { ProjectRail } from "@/components/ProjectRail";
import { ProjectHero3D } from "@/components/project-3d/ProjectHero3D";
import { differentials } from "@/data/differentials";
import {
  getActiveProjects,
  getFinishedProjects,
  getProject,
} from "@/data/projects";
import { getProject3D, HERO_PROJECT_SLUG } from "@/data/project3d";
import { site } from "@/data/site";
import { StatsCounters } from "@/components/AnimatedCounter";
import styles from "./home.module.css";

export default function HomePage() {
  const active = getActiveProjects();
  const finished = getFinishedProjects();
  const heroProject = getProject(HERO_PROJECT_SLUG);
  const hero3d = getProject3D(HERO_PROJECT_SLUG);

  return (
    <>
      {heroProject && hero3d ? (
        <ProjectHero3D project={heroProject} config={hero3d} />
      ) : null}

      <section className={styles.marquee} aria-hidden>
        <div className={styles.marqueeTrack}>
          {Array.from({ length: 2 }).map((_, k) => (
            <p key={k}>
              Personalización · Obra propia · Caballito · Saavedra · Villa Devoto
              · Pinamar · Identidad viva ·&nbsp;
            </p>
          ))}
        </div>
      </section>

      <section className={`section ${styles.value}`}>
        <div className={styles.valueSteps} aria-hidden>
          <span /><span /><span />
        </div>
        <div className={`container ${styles.valueGrid}`}>
          <ScrollReveal from="left">
            <p className="eyebrow">Propuesta</p>
            <TextReveal as="h2" className={styles.valueTitle}>
              Edificios pensados para vivir bien y valorizar en el tiempo
            </TextReveal>
          </ScrollReveal>
          <ScrollReveal from="right" delay={140}>
            <p className={styles.valueLead}>
              Con más de 20 años de experiencia, Freya desarrolla en barrios con
              proyección —Caballito, Saavedra, Villa Devoto y Pinamar— con
              acompañamiento hasta la escritura y personalización de terminaciones.
            </p>
            <p className={styles.valueNote}>
              Una identidad viva que se adapta, y refleja tu impronta desde el
              principio.
            </p>
          </ScrollReveal>
        </div>
      </section>

      <section className={`section ${styles.projects}`}>
        <div className="container">
          <ScrollReveal>
            <div className={styles.sectionHead}>
              <div>
                <p className="eyebrow">Ahora</p>
                <TextReveal as="h2">Desarrollos en comercialización</TextReveal>
              </div>
              <Link className={styles.inlineLink} href="/desarrollos">
                Ver todos →
              </Link>
            </div>
          </ScrollReveal>
        </div>
        <ProjectRail projects={active} />
      </section>

      <section className={styles.method}>
        <div className="container">
          <ScrollReveal>
            <p className="eyebrow">Personalización</p>
            <TextReveal as="h2">Cómo trabajamos</TextReveal>
            <p className="lead" style={{ marginTop: "0.85rem" }}>
              Cuatro etapas claras — del lote a la escritura — contadas como un
              recorrido.
            </p>
          </ScrollReveal>
        </div>
        <MethodPinned compact />
        <div className={`container ${styles.methodLink}`}>
          <Link className={styles.inlineLink} href="/como-trabajamos">
            Entrar al método completo →
          </Link>
        </div>
      </section>

      <section className={`section ${styles.diffSection}`}>
        <div className="container">
          <ScrollReveal>
            <p className="eyebrow">Por qué Freya</p>
            <TextReveal as="h2" className={styles.diffTitle}>
              Diferenciales concretos
            </TextReveal>
          </ScrollReveal>
          <div className={styles.diffGrid}>
            {differentials.map((item, i) => (
              <ScrollReveal
                key={item.title}
                from={i % 2 === 0 ? "left" : "right"}
                delay={i * 90}
              >
                <article className={styles.diffCard}>
                  <span className={styles.diffIndex}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className={styles.diffSq} aria-hidden />
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              </ScrollReveal>
            ))}
          </div>
          <ScrollReveal delay={160}>
            <div className={styles.diffLinks}>
              <Link className={styles.inlineLinkLight} href="/asesor">
                Consultar personalización →
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className={`section-tight ${styles.stats}`}>
        <div className={styles.statsGridBg} aria-hidden />
        <ScrollReveal>
          <div className="container">
            <StatsCounters
              stats={site.stats}
              valueClassName={styles.statValue}
              labelClassName={styles.statLabel}
              itemClassName={styles.stat}
            />
          </div>
          <p className={`container ${styles.statNote}`}>
            Cifras declaradas por Freya en su comunicación pública.
          </p>
        </ScrollReveal>
      </section>

      <section className={`section ${styles.finished}`}>
        <div className="container">
          <ScrollReveal>
            <div className={styles.sectionHead}>
              <div>
                <p className="eyebrow">Respaldo</p>
                <TextReveal as="h2">Proyectos finalizados</TextReveal>
              </div>
            </div>
          </ScrollReveal>
        </div>
        <ProjectRail projects={finished} finished />
      </section>

      <section className={`section ${styles.paths}`}>
        <div className="container grid-2">
          <ScrollReveal from="left">
            <article className={styles.pathCard}>
              <div
                className={styles.pathBg}
                style={{
                  backgroundImage: "url(/images/projects/beauchef-cover.jpg)",
                }}
              />
              <div className={styles.pathFrame} aria-hidden />
              <p className="eyebrow">Para vivir</p>
              <h2>Tu próximo hogar</h2>
              <p>
                Tipologías amplias, barrios consolidados y personalización de
                terminaciones.
              </p>
              <Link className={styles.pathLink} href="/desarrollos/beauchef-620">
                Ver Beauchef 620 →
              </Link>
            </article>
          </ScrollReveal>
          <ScrollReveal from="right" delay={120}>
            <article className={styles.pathCard}>
              <div
                className={styles.pathBg}
                style={{
                  backgroundImage: "url(/images/projects/besares-cover.png)",
                }}
              />
              <div className={styles.pathFrame} aria-hidden />
              <p className="eyebrow">Para invertir</p>
              <h2>Unidades con demanda</h2>
              <p>
                En Besares, tipologías 1 y 2 ambientes en un barrio en crecimiento.
              </p>
              <Link className={styles.pathLink} href="/desarrollos/besares-4786">
                Ver Besares 4786 →
              </Link>
            </article>
          </ScrollReveal>
        </div>
      </section>

      <section className="section">
        <div className="container grid-2">
          <ScrollReveal from="left">
            <p className="eyebrow">Dudas frecuentes</p>
            <TextReveal as="h2">Antes de escribirnos</TextReveal>
            <Link className={styles.inlineLink} href="/faq">
              Ver todas las preguntas →
            </Link>
          </ScrollReveal>
          <ScrollReveal from="right" delay={100}>
            <FaqList limit={4} />
          </ScrollReveal>
        </div>
      </section>

      <section className={`section ${styles.contact}`}>
        <div className="container grid-2">
          <ScrollReveal from="left">
            <p className="eyebrow">Siguiente paso</p>
            <TextReveal as="h2">Elegí cómo continuar</TextReveal>
            <p className="lead" style={{ marginTop: "1rem" }}>
              Asesor comercial para comprar o invertir. Contacto institucional
              para datos de oficina y consultas generales.
            </p>
            <div className={styles.heroActions}>
              <Link className={styles.contactPrimary} href="/asesor">
                Hablar con un asesor
                <span aria-hidden>→</span>
              </Link>
              <Link className={styles.inlineLink} href="/contacto">
                Ir a contacto
              </Link>
            </div>
            <ul className={styles.contactMeta}>
              <li>
                <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a>
              </li>
              <li>{site.contact.address}</li>
            </ul>
          </ScrollReveal>
          <ScrollReveal from="right" delay={120}>
            <Suspense fallback={<p>Cargando formulario…</p>}>
              <ContactForm compact />
            </Suspense>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
