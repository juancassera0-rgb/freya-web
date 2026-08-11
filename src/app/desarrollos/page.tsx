import type { Metadata } from "next";
import { MaskReveal } from "@/components/experience/MaskReveal";
import { ProjectShowcase } from "@/components/experience/ProjectShowcase";
import { getActiveProjects, getFinishedProjects } from "@/data/projects";
import { site } from "@/data/site";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Desarrollos",
  description:
    "Proyectos en comercialización y finalizados de Freya en Caballito, Saavedra, Villa Devoto y Pinamar.",
};

export default function DesarrollosPage() {
  const active = getActiveProjects();
  const finished = getFinishedProjects();

  return (
    <div className={styles.page}>
      <header className={styles.masthead}>
        <div className="container-wide">
          <span className="meta">Portafolio</span>
          <MaskReveal
            as="h1"
            className={styles.mastheadTitle}
            lines={["Desarrollos"]}
            immediate
            delay={120}
          />
          <MaskReveal immediate delay={280}>
            <p className={styles.mastheadLead}>
              Lo que está en venta hoy, y lo ya entregado como respaldo de
              ejecución.
            </p>
          </MaskReveal>

          <dl className={styles.mastheadSpecs}>
            <div>
              <dt>En comercialización</dt>
              <dd>{String(active.length).padStart(2, "0")}</dd>
            </div>
            <div>
              <dt>Entregados</dt>
              <dd>{String(finished.length).padStart(2, "0")}</dd>
            </div>
            <div>
              <dt>Zonas</dt>
              <dd>{site.zones.join(" · ")}</dd>
            </div>
          </dl>
        </div>
      </header>

      <section className={styles.block} aria-labelledby="activos">
        <div className={`container-wide ${styles.blockHead}`}>
          <span className="meta-index">01</span>
          <h2 id="activos" className={styles.blockTitle}>
            En comercialización
          </h2>
          <p className={styles.blockLead}>
            Unidades disponibles para vivir o invertir, con asesoramiento
            comercial.
          </p>
        </div>
        <ProjectShowcase projects={active} />
      </section>

      <section className={styles.block} aria-labelledby="finalizados">
        <div className={`container-wide ${styles.blockHead}`}>
          <span className="meta-index">02</span>
          <h2 id="finalizados" className={styles.blockTitle}>
            Obra entregada
          </h2>
          <p className={styles.blockLead}>
            Obras finalizadas que muestran la trayectoria y calidad constructiva
            de Freya.
          </p>
        </div>
        <ProjectShowcase projects={finished} startIndex={active.length} />
      </section>
    </div>
  );
}
