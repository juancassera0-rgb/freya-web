"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import styles from "./ProjectGallery.module.css";

type Shot = { src: string; alt: string };

type Props = {
  images: Shot[];
  projectName: string;
};

export function ProjectGallery({ images, projectName }: Props) {
  const [active, setActive] = useState<number | null>(null);

  const close = useCallback(() => setActive(null), []);
  const prev = useCallback(() => {
    setActive((i) =>
      i === null ? null : (i - 1 + images.length) % images.length,
    );
  }, [images.length]);
  const next = useCallback(() => {
    setActive((i) => (i === null ? null : (i + 1) % images.length));
  }, [images.length]);

  useEffect(() => {
    if (active === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [active, close, next, prev]);

  return (
    <>
      <div className={styles.grid}>
        {images.map((item, index) => (
          <button
            key={item.src}
            type="button"
            className={styles.shot}
            onClick={() => setActive(index)}
            aria-label={`Ampliar imagen: ${item.alt}`}
          >
            <Image
              src={item.src}
              alt={item.alt}
              fill
              sizes="(max-width: 800px) 100vw, 50vw"
              className={styles.img}
            />
            <span className={styles.hint}>Ver</span>
          </button>
        ))}
      </div>

      {active !== null && (
        <div
          className={styles.lightbox}
          role="dialog"
          aria-modal="true"
          aria-label={`Galería de ${projectName}`}
          onClick={close}
        >
          <button
            type="button"
            className={styles.close}
            onClick={close}
            aria-label="Cerrar"
          >
            Cerrar
          </button>
          <button
            type="button"
            className={`${styles.nav} ${styles.prev}`}
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            aria-label="Anterior"
          >
            ←
          </button>
          <div
            className={styles.frame}
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[active].src}
              alt={images[active].alt}
              width={1400}
              height={900}
              className={styles.full}
              priority
            />
            <p className={styles.caption}>
              {images[active].alt} · {active + 1}/{images.length}
            </p>
          </div>
          <button
            type="button"
            className={`${styles.nav} ${styles.next}`}
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            aria-label="Siguiente"
          >
            →
          </button>
        </div>
      )}
    </>
  );
}
