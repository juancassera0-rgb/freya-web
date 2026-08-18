"use client";

import { Canvas } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import { ACESFilmicToneMapping } from "three";
import { Suspense, type ReactNode, type RefObject } from "react";
import { AdaptiveQuality, type QualityTier } from "./AdaptiveQuality";
import { WebGLGuard } from "./WebGLGuard";
import { SkyDome } from "./SkyDome";
import { SiteContext } from "./SiteContext";
import { NeighbourContext } from "./NeighbourContext";
import { ProceduralEnvironment } from "./ProceduralEnvironment";
import { PostFX } from "./PostFX";
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
      dpr={low ? [1, 1.15] : high ? [1, 2] : [1, 1.5]}
      resize={{ scroll: false, debounce: { scroll: 0, resize: 180 } }}
      gl={{
        alpha: false,
        /* AA sólo se apagaba fuera de "high", pero "medium" cubre a la
           mayoría de los dispositivos reales (todo el móvil y notebooks de
           menos de 8 núcleos): eran justo los que más se beneficiaban, y
           los que más aliasing mostraban en mullones y barandas finas.
           "low" lo sigue evitando — ahí el costo no se justifica. */
        antialias: tier !== "low",
        powerPreference: low ? "low-power" : "high-performance",
        stencil: false,
      }}
      camera={{
        position: [
          start.position[0] * framing.distance,
          start.position[1] * framing.distance,
          start.position[2] * framing.distance,
        ],
        fov: isHero ? framing.fov - 2 : framing.fov,
        /* near 0.35 y far 34: rango de profundidad ajustado a la escena
           real. Con near 0.1 y far 48 se desperdiciaba precisión de
           z-buffer en un rango que nada ocupa, y eso se veía como
           parpadeo entre losas y barandas en ángulos rasantes. */
        near: 0.35,
        far: 34,
      }}
      /* "soft" (PCFSoftShadowMap) está deprecado en esta versión de three —
         el renderer lo degrada en silencio a sombras duras (PCF) sin avisar
         más que por consola. "variance" (VSMShadowMap) es el reemplazo
         vigente: sombra realmente suave, sin el aviso de deprecación. */
      shadows={low ? false : "variance"}
      onCreated={({ gl }) => {
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = isHero ? 1.08 : 1.15;
      }}
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <color attach="background" args={[mood.horizon]} />
      <fog attach="fog" args={[mood.horizon, mood.fogNear, mood.fogFar]} />

      {/* Cielo procedural con halo solar — también alimenta los reflejos
          del vidriado a través de ProceduralEnvironment */}
      <SkyDome mood={sceneMood} clouds={!low} detail={tier} />
      {!low && <ProceduralEnvironment mood={sceneMood} />}

      {/* Luz clave: sol. Su dirección coincide con SUN[mood].dir, que es
          donde SkyDome dibuja el halo: si se desincronizan, el resplandor
          queda de un lado y las sombras caen del otro. */}
      <directionalLight
        castShadow={!low}
        position={isHero ? [7, 5.5, 5] : [6, 9, 4]}
        intensity={mood.keyIntensity}
        color={mood.key}
        shadow-mapSize={high ? [1024, 1024] : [512, 512]}
        shadow-bias={-0.0012}
        shadow-normalBias={0.02}
        /* Radio del blur de VSM — perfil suave sin lavar el contacto
           losa/vidrio, que es donde la sombra tiene que leer volumen. */
        shadow-radius={4}
      >
        {/* Cámara de sombra ajustada al volumen (torre de ~4.2 sobre una
            vereda de 3). Antes cubría ±8 unidades para un objeto de 4:
            más de la mitad del shadow map caía en vacío. Acotarla sube
            ~2.5× la densidad de la sombra sin agrandar el mapa. */}
        <orthographicCamera attach="shadow-camera" args={[-5, 5, 6, -3, 1, 20]} />
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

      {/* Rebote cálido del suelo hacia intradoses y bajo-losas: es donde
          una escena sin iluminación global se ve muerta. */}
      {!low && (
        <directionalLight
          position={[0.5, -2.5, 3]}
          intensity={isHero ? 0.2 : 0.16}
          color={mood.bounce}
        />
      )}

      <ambientLight intensity={mood.ambientIntensity} color={mood.ambient} />
      <hemisphereLight args={[mood.horizon, SITE.grass, isHero ? 0.35 : 0.42]} />

      {/* Emplazamiento: vereda, cordón, calzada, canteros y arbolado */}
      <SiteContext mood={sceneMood} detail={tier} />
      {/* Manzana vecina: profundidad urbana detrás del lote */}
      <NeighbourContext detail={tier} />

      {!low && (
        <ContactShadows
          position={[0, 0.06, 0]}
          opacity={isHero ? 0.42 : 0.32}
          scale={14}
          blur={2.4}
          far={4.5}
          resolution={high ? 512 : 256}
          frames={60}
          color={BRAND.offBlack}
        />
      )}

      {isOrbit ? (
        <OrbitControlsSoft enabled target={config.camera.overview.target} touch={touch} />
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

      {/* Sólo en el hardware que sobra: ver PostFX para el porqué del gate */}
      {high && !touch && <PostFX />}
    </Canvas>
  );
}
