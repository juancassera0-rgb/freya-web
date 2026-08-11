"use client";

import { Canvas } from "@react-three/fiber";
import { SiteScene } from "./SiteScene";

type Props = {
  scrollProgress: number;
  onDark: boolean;
};

export function SiteCanvas({ scrollProgress, onDark }: Props) {
  return (
    <Canvas
      dpr={[1, 1.25]}
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
        stencil: false,
      }}
      camera={{ position: [1.2, 1.4, 8.2], fov: 36, near: 0.1, far: 40 }}
      style={{ width: "100%", height: "100%", pointerEvents: "none" }}
    >
      <SiteScene scrollProgress={scrollProgress} onDark={onDark} />
    </Canvas>
  );
}
