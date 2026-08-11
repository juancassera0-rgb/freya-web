"use client";

import { Canvas } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import { ACESFilmicToneMapping } from "three";
import { Suspense, type ReactNode, type RefObject } from "react";
import { AdaptiveQuality, type QualityTier } from "./AdaptiveQuality";
import { WebGLGuard } from "./WebGLGuard";
import { SkyDome } from "./SkyDome";
import { SiteContext } from "./SiteContext";
import { ProceduralEnvironment } from "./ProceduralEnvironment";
import { BRAND, MOOD, SITE, type SceneMood } from "./sceneTokens";
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
  /** Ajuste de encuadre por clase de pantalla */
  framing?: { distance: number; fov: number; targetY: number };
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
  framing = { distance: 1, fov: 38, targetY: 1 },
  active = true,
}: Props) {
  const isHero = variant === "hero";
  const isOrbit = controlMode === "orbit";
  const lite = performanceMode === "lite";
  const low = tier === "low";
  const high = tier === "high";
  /* El hero representa el atardecer (como el render del proyecto); el
     recorrido y el explorador, luz de día plena. */
  const sceneMood: SceneMood = isHero ? "dusk" : "day";
  const mood = {
    ...MOOD[sceneMood],
    horizon: sceneMood === "dusk" ? SITE.skyHorizonDusk : SITE.skyHorizonDay,
  };
  const start = isOrbit ? config.camera.overview : config.camera.intro;

  return (
    <Canvas
      className={className}
      frameloop={active ? "always" : "never"}
      dpr={low ? [1, 1.15] : high ? [1, 1.9] : [1, 1.5]}
      resize={{ scroll: false, debounce: { scroll: 0, resize: 180 } }}
      gl={{
        alpha: false,
        antialias: high,
        powerPreference: low ? "low-power" : "high-performance",
        stencil: false,
      }}
      camera={{
        position: [
          start.position[0] * framing.distance,
          start.position[1] * framing.distance,
          start.position[2] * framing.distance,
        ],
        /* FOV por clase de pantalla: la torre es alta y estrecha, así que
           en viewports angostos o bajos hay que abrir el ángulo o queda
           cortada. El hero usa un ángulo levemente más cerrado. */
        fov: isHero ? framing.fov - 2 : framing.fov,
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
      <color attach="background" args={[mood.horizon]} />
      <fog attach="fog" args={[mood.horizon, mood.fogNear, mood.fogFar]} />

      {/* Cielo procedural — también alimenta los reflejos del vidriado */}
      <SkyDome mood={sceneMood} clouds={!low} />
      {!low && <ProceduralEnvironment mood={sceneMood} />}

      {/* Luz clave: sol. Su color e intensidad siguen la hora representada */}
      <directionalLight
        castShadow={!low}
        position={isHero ? [7, 5.5, 5] : [6, 9, 4]}
        intensity={mood.keyIntensity}
        color={mood.key}
        shadow-mapSize={high ? [1024, 1024] : [512, 512]}
        shadow-bias={-0.0015}
      >
        <orthographicCamera attach="shadow-camera" args={[-8, 8, 8, -8, 0.5, 26]} />
      </directionalLight>

      {/* Relleno — rebote del cielo */}
      <directionalLight position={[-5, 4, -3]} intensity={0.24} color={mood.fill} />

      {/* Rim: separa el volumen del fondo. Se omite en gama baja */}
      {!low && (
        <directionalLight
          position={[-2, 2.5, 5]}
          intensity={isHero ? 0.3 : 0.18}
          color={mood.fill}
        />
      )}
      <ambientLight intensity={mood.ambientIntensity} color={mood.ambient} />
      <hemisphereLight args={[mood.horizon, SITE.grass, isHero ? 0.35 : 0.42]} />

      {/* Emplazamiento: vereda, cordón, calzada, canteros, arbolado y vecinos */}
      <SiteContext mood={sceneMood} detail={tier} />

      {!low && (
        <ContactShadows
          position={[0, 0.06, 0]}
          opacity={isHero ? 0.42 : 0.32}
          scale={14}
          blur={2.4}
          far={4.5}
          resolution={256}
          frames={60}
          color={BRAND.offBlack}
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

      <AdaptiveQuality enabled={!high && !touch} />
      <WebGLGuard />

      <Suspense fallback={null}>{children}</Suspense>
    </Canvas>
  );
}
