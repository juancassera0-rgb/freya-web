import Link from "next/link";
import { FreyaLogo } from "@/components/FreyaLogo";
import { FooterSignup } from "@/components/FooterSignup";
import { site } from "@/data/site";
import { getActiveProjects, getFinishedProjects } from "@/data/projects";
import styles from "./Footer.module.css";

export function Footer() {
  const active = getActiveProjects();
  const finished = getFinishedProjects();

  return (
    <footer className={styles.footer} id="contacto">
      <div className={`container ${styles.grid}`}>
        <div className={styles.brandCol}>
          <FreyaLogo variant="footer" />
          <p className={styles.tag}>{site.tagline}</p>
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
          </ul>
        </div>

        <div>
          <p className={styles.heading}>Proyectos</p>
          <ul className={styles.list}>
            {active.map((p) => (
              <li key={p.slug}>
                <Link href={`/desarrollos/${p.slug}`}>{p.name}</Link>
              </li>
            ))}
          </ul>
          <p className={`${styles.heading} ${styles.spaced}`}>Cerrados</p>
          <ul className={styles.list}>
            {finished.map((p) => (
              <li key={p.slug}>
                <Link href={`/desarrollos/${p.slug}`}>{p.name}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <FooterSignup />
          <p className={styles.meta}>{site.contact.email}</p>
        </div>
      </div>

      <div className={`container ${styles.bottom}`}>
        <p>© {new Date().getFullYear()} Freya.</p>
      </div>
    </footer>
  );
}
