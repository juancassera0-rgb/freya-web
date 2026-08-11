"use client";

import { Canvas } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import { ACESFilmicToneMapping } from "three";
import { Suspense, type ReactNode, type RefObject } from "react";
import { AdaptiveQuality, type QualityTier } from "./AdaptiveQuality";
import { WebGLGuard } from "./WebGLGuard";
import { CameraRig } from "./CameraRig";
import { OrbitControlsSoft } from "./OrbitControlsSoft";
import type { Project3DConfig } from "@/data/project3d";

type Props = {
  config: Project3DConfig;
  children: ReactNode;
  className?: string;
  /** Progreso de scroll por referencia — no re-renderiza React */
  cameraProgressRef?: RefObject<number>;
  /** hero = atmósfera Oscura Brand; studio = Off-White para explorador */
  variant?: "hero" | "studio";
  enablePointerParallax?: boolean;
  /** cinematic = CameraRig; orbit = OrbitControls suave */
  controlMode?: "cinematic" | "orbit";
  /** Baja densidades en móvil / coarse pointer */
  performanceMode?: "full" | "lite";
  /** Nivel de calidad: controla DPR, sombras y luces secundarias */
  tier?: QualityTier;
  /** Puntero grueso: abre el FOV para que el edificio entre completo */
  touch?: boolean;
  /** false detiene el render loop (fuera de viewport o pestaña oculta) */
  active?: boolean;
};

export function Project3DScene({
  config,
  children,
  className,
  cameraProgressRef,
  variant = "studio",
  enablePointerParallax = true,
  controlMode = "cinematic",
  performanceMode = "full",
  tier = "high",
  touch = false,
  active = true,
}: Props) {
  const isHero = variant === "hero";
  const isOrbit = controlMode === "orbit";
  const lite = performanceMode === "lite";
  const low = tier === "low";
  const high = tier === "high";
  const bg = isHero ? "#1d1c1b" : "#f0eee8";
  const ground = isHero ? "#2a2926" : "#e6e3d8";
  const gridMain = isHero ? "#4f4c37" : "#4f4c37";
  const gridSub = isHero ? "#3a3830" : "#d4d0c6";
  const start = isOrbit ? config.camera.overview : config.camera.intro;

  return (
    <Canvas
      className={className}
      frameloop={active ? "always" : "never"}
      dpr={low ? [1, 1.15] : high ? [1, 1.9] : [1, 1.5]}
      gl={{
        alpha: false,
        antialias: high,
        powerPreference: low ? "low-power" : "high-performance",
        stencil: false,
      }}
      camera={{
        position: start.position,
        /* En pantallas angostas se abre el FOV: la torre es alta y estrecha,
           con el encuadre de desktop quedaría cortada o diminuta. */
        fov: touch ? (isHero ? 46 : 44) : isHero ? 36 : 38,
        near: 0.1,
        far: 48,
      }}
      shadows={low ? false : "soft"}
      onCreated={({ gl }) => {
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = isHero ? 1.08 : 1.15;
      }}
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <color attach="background" args={[bg]} />
      <fog attach="fog" args={[bg, isHero ? 10 : 12, isHero ? 22 : 28]} />

      {/* Luz clave — sol bajo, arquitectónico */}
      <directionalLight
        castShadow={!low}
        position={[6, 9, 4]}
        intensity={isHero ? 1.5 : 1.7}
        color="#fff6e8"
        shadow-mapSize={high ? [1024, 1024] : [512, 512]}
        shadow-bias={-0.0015}
      />
      {/* Luz de relleno fría — abre sombras sin aplanar */}
      <directionalLight
        position={[-5, 4, -3]}
        intensity={isHero ? 0.28 : 0.22}
        color="#aab6c4"
      />
      {/* Rim light sutil — se omite en gama baja */}
      {!low && (
        <directionalLight
          position={[-2, 2.5, 5]}
          intensity={isHero ? 0.3 : 0.18}
          color="#e8dcc4"
        />
      )}
      <ambientLight intensity={isHero ? 0.22 : 0.32} color="#e4ded0" />
      <hemisphereLight args={["#f4f1e8", ground, isHero ? 0.35 : 0.45]} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial color={ground} roughness={1} />
      </mesh>

      {!low && !isHero && (
        <ContactShadows
          position={[0, 0.005, 0]}
          opacity={0.28}
          scale={14}
          blur={2.4}
          far={4.5}
          resolution={256}
          frames={60}
          color="#1d1c1b"
        />
      )}

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
          progressRef={cameraProgressRef}
          enablePointerParallax={enablePointerParallax && !lite}
          introDuration={isHero ? 3200 : 2400}
        />
      )}

      <AdaptiveQuality enabled={!high} />
      <WebGLGuard />

      <Suspense fallback={null}>{children}</Suspense>
    </Canvas>
  );
}
