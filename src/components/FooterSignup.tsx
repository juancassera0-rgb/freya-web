"use client";

import { FormEvent, useState } from "react";
import { mailtoUrl, site } from "@/data/site";
import styles from "./FooterSignup.module.css";

/**
 * Único punto de contacto del sitio. Sin backend de lista todavía —
 * arma un mail a site.contact.email con la dirección ingresada.
 * Provisorio hasta que haya un servicio de lista real.
 */
export function FooterSignup() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const body = `Quiero sumarme a la lista de Freya.\nMi mail: ${email}`;
    window.open(mailtoUrl(site.contact.email, body), "_blank");
    setSent(true);
  }

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <label className={styles.label} htmlFor="footer-signup-email">
        Se entra por lista
      </label>
      <div className={styles.row}>
        <input
          id="footer-signup-email"
          className={styles.input}
          type="email"
          name="email"
          placeholder="Tu mail"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button className={styles.submit} type="submit">
          Dejar mail
        </button>
      </div>
      {sent && <p className={styles.ok}>Gracias. Vas a tener novedades.</p>}
    </form>
  );
}
