"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  className?: string;
  overlayClassName?: string;
};

/** Misma línea estética: interiores minimalistas con madera, luz natural y líneas limpias. */
const SOURCES = [
  "/videos/hero-home.mp4",
  "/videos/hero-2.mp4",
  "/videos/hero-3.mp4",
  "/videos/hero-4.mp4",
];

export function HeroVideo({ className, overlayClassName }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onEnded = () => {
      setIndex((i) => (i + 1) % SOURCES.length);
    };

    video.addEventListener("ended", onEnded);
    return () => video.removeEventListener("ended", onEnded);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.getAttribute("src") !== SOURCES[index]) {
      video.src = SOURCES[index];
      video.load();
    }

    video.playbackRate = 0.7;
    video.play().catch(() => {
      /* autoplay bloqueado: queda el poster */
    });
  }, [index]);

  return (
    <div className={className} aria-hidden>
      <video
        ref={videoRef}
        className="hero-video-el"
        autoPlay
        muted
        playsInline
        preload="auto"
        poster="/videos/hero-poster.jpg"
        src={SOURCES[0]}
      />
      <div className={overlayClassName} />
    </div>
  );
}
