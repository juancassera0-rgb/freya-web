"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, type ReactNode } from "react";
import { CameraRig } from "./CameraRig";
import { OrbitControlsSoft } from "./OrbitControlsSoft";
import type { Project3DConfig } from "@/data/project3d";

type Props = {
  config: Project3DConfig;
  children: ReactNode;
  className?: string;
  cameraProgress?: number;
  /** hero = atmósfera Oscura Brand; studio = Off-White para explorador */
  variant?: "hero" | "studio";
  enablePointerParallax?: boolean;
  /** cinematic = CameraRig; orbit = OrbitControls suave */
  controlMode?: "cinematic" | "orbit";
  /** Baja densidades en móvil / coarse pointer */
  performanceMode?: "full" | "lite";
};

export function Project3DScene({
  config,
  children,
  className,
  cameraProgress = 0,
  variant = "studio",
  enablePointerParallax = true,
  controlMode = "cinematic",
  performanceMode = "full",
}: Props) {
  const isHero = variant === "hero";
  const isOrbit = controlMode === "orbit";
  const lite = performanceMode === "lite";
  const bg = isHero ? "#1d1c1b" : "#f0eee8";
  const ground = isHero ? "#2a2926" : "#e6e3d8";
  const gridMain = isHero ? "#4f4c37" : "#4f4c37";
  const gridSub = isHero ? "#3a3830" : "#d4d0c6";
  const start = isOrbit ? config.camera.overview : config.camera.intro;

  return (
    <Canvas
      className={className}
      dpr={lite ? [1, 1.25] : [1, 1.5]}
      gl={{
        alpha: false,
        antialias: !lite,
        powerPreference: "high-performance",
        stencil: false,
      }}
      camera={{
        position: start.position,
        fov: isHero ? 36 : 38,
        near: 0.1,
        far: 60,
      }}
      shadows={!lite}
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <color attach="background" args={[bg]} />
      <fog attach="fog" args={[bg, isHero ? 10 : 12, isHero ? 22 : 28]} />

      <ambientLight intensity={isHero ? 0.45 : 0.72} />
      <directionalLight
        castShadow={!lite}
        position={[6, 10, 4]}
        intensity={isHero ? 0.95 : 1.05}
        color="#f6f6f6"
        shadow-mapSize={lite ? [512, 512] : [1024, 1024]}
      />
      <directionalLight
        position={[-4, 3, -2]}
        intensity={isHero ? 0.35 : 0.25}
        color="#c4b79a"
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial color={ground} roughness={1} />
      </mesh>

      {!lite && (
        <gridHelper
          args={[16, 16, gridMain, gridSub]}
          position={[0, 0.01, 0]}
        />
      )}

      {isOrbit ? (
        <OrbitControlsSoft
          enabled
          target={config.camera.overview.target}
        />
      ) : (
        <CameraRig
          intro={config.camera.intro}
          overview={config.camera.overview}
          detail={config.camera.detail}
          progress={cameraProgress}
          enablePointerParallax={enablePointerParallax && !lite}
          introDuration={isHero ? 3200 : 2400}
        />
      )}

      <Suspense fallback={null}>{children}</Suspense>
    </Canvas>
  );
}
