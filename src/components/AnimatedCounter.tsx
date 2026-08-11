"use client";

import { useEffect, useRef, useState } from "react";
import { formatStatNumber, type SiteStat } from "@/data/site";
import styles from "./AnimatedCounter.module.css";

type CounterProps = {
  value: number;
  suffix?: string;
  useThousandsDot?: boolean;
  durationMs?: number;
  className?: string;
  startOnView?: boolean;
};

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

export function AnimatedCounter({
  value,
  suffix = "",
  useThousandsDot,
  durationMs = 1600,
  className,
  startOnView = true,
}: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);
  const [started, setStarted] = useState(!startOnView);

  useEffect(() => {
    if (!startOnView) {
      setStarted(true);
      return;
    }
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [startOnView]);

  useEffect(() => {
    if (!started) return;

    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const current = value * easeOutCubic(progress);
      setDisplay(current);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        setDisplay(value);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [started, value, durationMs]);

  return (
    <span ref={ref} className={className} aria-label={`${value}${suffix}`}>
      {formatStatNumber(display, useThousandsDot)}
      {suffix}
    </span>
  );
}

type StatsProps = {
  stats: readonly SiteStat[];
  className?: string;
  itemClassName?: string;
  valueClassName?: string;
  labelClassName?: string;
};

export function StatsCounters({
  stats,
  className,
  itemClassName,
  valueClassName,
  labelClassName,
}: StatsProps) {
  return (
    <div className={className ?? styles.grid}>
      {stats.map((stat) => (
        <div key={stat.label} className={itemClassName ?? styles.item}>
          <p className={valueClassName ?? styles.value}>
            <AnimatedCounter
              value={stat.value}
              suffix={stat.suffix}
              useThousandsDot={stat.useThousandsDot}
              durationMs={stat.durationMs}
            />
          </p>
          <p className={labelClassName ?? styles.label}>{stat.label}</p>
        </div>
      ))}
    </div>
  );
}

/**
 * Anima todos los números de un texto.
 * Ej: "1, 2 y 3 ambientes" · "38 m² · 48 m² · 97 m²" · "Desde 178 m²"
 */
export function CountedText({
  text,
  durationMs = 1400,
}: {
  text: string;
  durationMs?: number;
}) {
  const parts = text.split(/(\d[\d.]*)/g);
  if (parts.length <= 1) {
    return <>{text}</>;
  }

  let numberIndex = 0;

  return (
    <>
      {parts.map((part, i) => {
        if (!/^\d[\d.]*$/.test(part)) {
          return <span key={`t-${i}`}>{part}</span>;
        }

        const value = Number(part.replace(/\./g, ""));
        if (!Number.isFinite(value)) {
          return <span key={`t-${i}`}>{part}</span>;
        }

        const stagger = numberIndex;
        numberIndex += 1;

        return (
          <AnimatedCounter
            key={`n-${i}-${part}`}
            value={value}
            useThousandsDot={part.includes(".")}
            durationMs={durationMs + stagger * 180}
          />
        );
      })}
    </>
  );
}
