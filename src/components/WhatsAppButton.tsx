import { whatsappUrl } from "@/data/site";
import styles from "./WhatsAppButton.module.css";

export function WhatsAppButton() {
  return (
    <a
      className={styles.fab}
      href={whatsappUrl("Hola Freya, quiero consultar por un desarrollo.")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribir por WhatsApp"
    >
      <span className={styles.icon} aria-hidden />
      <span className={styles.label}>WhatsApp</span>
    </a>
  );
}
