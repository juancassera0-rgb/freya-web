import Link from "next/link";
import { FreyaLogo } from "@/components/FreyaLogo";
import { site } from "@/data/site";
import { getActiveProjects, getFinishedProjects } from "@/data/projects";
import styles from "./Footer.module.css";

export function Footer() {
  const active = getActiveProjects();
  const finished = getFinishedProjects();

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.brandCol}>
          <FreyaLogo variant="footer" />
          <p className={styles.tag}>{site.tagline}</p>
          <p className={styles.meta}>{site.contact.address}</p>
          <p className={styles.meta}>
            <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a>
          </p>
          <p className={styles.meta}>
            <a href={`tel:${site.contact.phoneTel}`}>{site.contact.phoneDisplay}</a>
          </p>
        </div>

        <div>
          <p className={styles.heading}>Navegación</p>
          <ul className={styles.list}>
            <li>
              <Link href="/desarrollos">Desarrollos</Link>
            </li>
            <li>
              <Link href="/nosotros">Nosotros</Link>
            </li>
            <li>
              <Link href="/como-trabajamos">Cómo trabajamos</Link>
            </li>
            <li>
              <Link href="/faq">Preguntas frecuentes</Link>
            </li>
            <li>
              <Link href="/contacto">Contacto</Link>
            </li>
            <li>
              <Link href="/asesor">Hablar con un asesor</Link>
            </li>
          </ul>
        </div>

        <div>
          <p className={styles.heading}>En comercialización</p>
          <ul className={styles.list}>
            {active.map((p) => (
              <li key={p.slug}>
                <Link href={`/desarrollos/${p.slug}`}>{p.name}</Link>
              </li>
            ))}
          </ul>
          <p className={`${styles.heading} ${styles.spaced}`}>Finalizados</p>
          <ul className={styles.list}>
            {finished.map((p) => (
              <li key={p.slug}>
                <Link href={`/desarrollos/${p.slug}`}>{p.name}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className={styles.heading}>Consultas</p>
          <p className={styles.meta}>{site.contact.hours}</p>
          <div className={styles.actions}>
            <Link className={styles.footerPrimary} href="/asesor">
              Hablar con un asesor →
            </Link>
            <Link className={styles.footerText} href="/contacto">
              Contacto
            </Link>
          </div>
        </div>
      </div>

      <div className={`container ${styles.bottom}`}>
        <p>© {new Date().getFullYear()} Freya. Todos los derechos reservados.</p>
        <p>
          <Link href="/contacto">Privacidad y contacto</Link>
        </p>
      </div>
    </footer>
  );
}
