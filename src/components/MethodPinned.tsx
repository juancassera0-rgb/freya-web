"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { services } from "@/data/differentials";
import styles from "./MethodPinned.module.css";

const images = [
  "/images/services/lote.jpg",
  "/images/services/desarrollo.jpg",
  "/images/services/espacios.jpg",
  "/images/services/acompanamiento.jpg",
];

type Props = {
  /** Compacto para home (sin pin largo); full para /como-trabajamos */
  compact?: boolean;
};

export function MethodPinned({ compact = false }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    if (compact) return;

    const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mqDesktop = window.matchMedia("(min-width: 900px)");

    const sync = () => {
      setPinned(!mqReduce.matches && mqDesktop.matches);
    };

    sync();
    mqReduce.addEventListener("change", sync);
    mqDesktop.addEventListener("change", sync);
    return () => {
      mqReduce.removeEventListener("change", sync);
      mqDesktop.removeEventListener("change", sync);
    };
  }, [compact]);

  // `compact` siempre gana sobre el estado async de media query.
  const isPinned = !compact && pinned;

  useEffect(() => {
    if (!pinned) return;
    const track = trackRef.current;
    if (!track) return;

    const onScroll = () => {
      const rect = track.getBoundingClientRect();
      const total = track.offsetHeight - window.innerHeight;
      if (total <= 0) return;
      const progress = Math.min(1, Math.max(0, -rect.top / total));
      const index = Math.min(
        services.length - 1,
        Math.floor(progress * services.length),
      );
      setActive(index);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pinned]);

  if (!isPinned) {
    return (
      <div className={`container ${styles.stackWrap}`}>
        <ol className={styles.stack}>
          {services.map((service, i) => (
            <li key={service.title} className={styles.stackItem}>
              {!compact && (
                <div className={styles.stackMedia}>
                  <Image
                    src={images[i]}
                    alt={service.title}
                    fill
                    sizes="(max-width: 900px) 100vw, 45vw"
                    className={styles.img}
                  />
                </div>
              )}
              <div className={styles.stackCopy}>
                <span className={styles.num}>0{i + 1}</span>
                <h3>{service.title}</h3>
                <p>{service.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  return (
    <div
      ref={trackRef}
      className={styles.track}
      style={{ height: `${services.length * 100}vh` }}
    >
      <div className={styles.sticky}>
        <div className={`container ${styles.panel}`}>
          <div className={styles.copyCol}>
            <p className="eyebrow">Método</p>
            <p className={styles.kicker}>Una identidad viva que se adapta</p>
            <ol className={styles.list}>
              {services.map((service, i) => (
                <li
                  key={service.title}
                  className={styles.item}
                  data-active={i === active ? "true" : "false"}
                >
                  <button
                    type="button"
                    className={styles.itemBtn}
                    onClick={() => {
                      const track = trackRef.current;
                      if (!track) return;
                      const top =
                        track.offsetTop +
                        (i / services.length) * track.offsetHeight +
                        8;
                      window.scrollTo({ top, behavior: "smooth" });
                    }}
                  >
                    <span className={styles.num}>0{i + 1}</span>
                    <span className={styles.itemTitle}>{service.title}</span>
                  </button>
                  <p className={styles.itemBody}>{service.body}</p>
                </li>
              ))}
            </ol>
          </div>
          <div className={styles.mediaCol}>
            <div className={`sq ${styles.frame}`}>
              {images.map((src, i) => (
                <div
                  key={src}
                  className={styles.frameLayer}
                  data-active={i === active ? "true" : "false"}
                >
                  <Image
                    src={src}
                    alt={services[i].title}
                    fill
                    sizes="45vw"
                    className={styles.frameImg}
                    priority={i === 0}
                  />
                </div>
              ))}
              <span className={styles.sqAccent} aria-hidden />
            </div>
            <p className={styles.progress}>
              <span>{String(active + 1).padStart(2, "0")}</span>
              <span aria-hidden>/</span>
              <span>{String(services.length).padStart(2, "0")}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
