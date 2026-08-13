"use client";

import styles from "./SceneTouchGate.module.css";

type Props = {
  /** true = la escena ya tiene el gesto */
  active: boolean;
  onActivate: () => void;
  onRelease: () => void;
  /** Texto de la invitación inicial */
  label?: string;
};

/**
 * RESOLUCIÓN DEL CONFLICTO SCROLL ↔ ESCENA EN TÁCTIL.
 *
 * En una pantalla táctil, un canvas 3D dentro de una página larga plantea un
 * problema sin solución automática: el mismo gesto —arrastrar el dedo— puede
 * significar "rotá el edificio" o "seguí bajando". Cualquier heurística
 * (¿el arrastre fue horizontal o vertical?) falla la mitad de las veces y
 * deja al usuario con la sensación de que la página se trabó.
 *
 * Acá se vuelve explícito, que es como lo resuelven los visores buenos:
 *
 * 1. Al entrar a la sección, la escena NO toma el gesto. El dedo scrollea
 *    con normalidad: el usuario pasa de largo sin quedar atrapado.
 * 2. Un tap sobre la escena la activa. Recién entonces el arrastre rota y
 *    el pinch acerca.
 * 3. Un botón visible la libera y devuelve el scroll.
 *
 * El estado es del padre, así que la sección puede liberar el gesto sola
 * cuando sale del viewport.
 */
export function SceneTouchGate({
  active,
  onActivate,
  onRelease,
  label = "Tocá para explorar el edificio",
}: Props) {
  if (!active) {
    return (
      <button
        type="button"
        className={styles.invite}
        onClick={onActivate}
        aria-label={label}
      >
        <span className={styles.inviteInner}>
          <span className={styles.ring} aria-hidden />
          <span className={styles.inviteText}>{label}</span>
          <span className={styles.inviteHint}>
            Arrastrá para girar · Pinch para acercar
          </span>
        </span>
      </button>
    );
  }

  return (
    <button type="button" className={styles.release} onClick={onRelease}>
      Listo
      <span aria-hidden>×</span>
    </button>
  );
}
