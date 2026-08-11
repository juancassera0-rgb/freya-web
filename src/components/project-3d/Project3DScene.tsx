"use client";

import { Canvas } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import { ACESFilmicToneMapping } from "three";
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
      shadows={!lite ? "soft" : false}
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
        castShadow={!lite}
        position={[6, 9, 4]}
        intensity={isHero ? 1.5 : 1.7}
        color="#fff6e8"
        shadow-mapSize={lite ? [512, 512] : [1536, 1536]}
        shadow-bias={-0.0015}
      >
        <orthographicCamera attach="shadow-camera" args={[-6, 6, 6, -6, 0.5, 22]} />
      </directionalLight>
      {/* Luz de relleno fría — abre sombras sin aplanar */}
      <directionalLight
        position={[-5, 4, -3]}
        intensity={isHero ? 0.28 : 0.22}
        color="#aab6c4"
      />
      {/* Rim light sutil — separa el volumen del fondo */}
      <directionalLight
        position={[-2, 2.5, 5]}
        intensity={isHero ? 0.3 : 0.18}
        color="#e8dcc4"
      />
      <ambientLight intensity={isHero ? 0.22 : 0.32} color="#e4ded0" />
      <hemisphereLight args={["#f4f1e8", ground, isHero ? 0.35 : 0.45]} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial color={ground} roughness={1} />
      </mesh>

      {!lite && (
        <ContactShadows
          position={[0, 0.005, 0]}
          opacity={isHero ? 0.38 : 0.3}
          scale={14}
          blur={2.6}
          far={4.5}
          resolution={512}
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
          progress={cameraProgress}
          enablePointerParallax={enablePointerParallax && !lite}
          introDuration={isHero ? 3200 : 2400}
        />
      )}

      <Suspense fallback={null}>{children}</Suspense>
    </Canvas>
  );
}
