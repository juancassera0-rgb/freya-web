"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import { ACESFilmicToneMapping } from "three";
import { Suspense, useEffect, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { WebGLGuard } from "./WebGLGuard";
import { AdaptiveQuality, type QualityTier } from "./AdaptiveQuality";
import { SkyDome } from "./SkyDome";
import { SiteContext } from "./SiteContext";
import { ProceduralEnvironment } from "./ProceduralEnvironment";
import { BRAND, MOOD, SITE } from "./sceneTokens";

export type SalesStage = "building" | "floor" | "unit";

type Props = {
  stage: SalesStage;
  focusFloor: number | null;
  tier: QualityTier;
  /** Puntero grueso: encuadres más lejanos y FOV mayor */
  touch?: boolean;
  /** Ajuste de encuadre por clase de pantalla */
  framing?: { distance: number; fov: number; targetY: number };
  active?: boolean;
  onContextLost?: () => void;
  children: ReactNode;
};

/**
 * Encuadres calibrados a la volumetría real (torre angosta, ~4.2 de alto).
 * En pantallas angostas la cámara se aleja y abre el FOV para que el
 * edificio entre completo sin quedar cortado ni minúsculo.
 */
const SHOTS: Record<
  SalesStage,
  { position: [number, number, number]; target: [number, number, number] }
> = {
  building: { position: [4.9, 3.1, 6.1], target: [0, 2.05, 0] },
  floor: { position: [3.6, 2.4, 4.6], target: [0, 2.0, 0] },
  unit: { position: [0, 4.4, 4.0], target: [0, 0.2, 0] },
};

const SHOTS_TOUCH: typeof SHOTS = {
  building: { position: [5.4, 3.4, 7.4], target: [0, 2.0, 0] },
  floor: { position: [4.2, 2.6, 5.6], target: [0, 2.0, 0] },
  unit: { position: [0, 4.9, 4.6], target: [0, 0.2, 0] },
};

/** Umbral bajo el cual se considera que la cámara llegó al encuadre */
const SETTLE_EPS = 0.012;

/** Superficie de OrbitControls que usa el rig de cámara */
type OrbitHandle = React.ComponentRef<typeof OrbitControls> | null;

/**
 * Cámara dirigida con propiedad EXCLUSIVA.
 *
 * Sólo un sistema escribe la cámara en cada momento:
 *  - durante una transición de etapa, manda este rig y OrbitControls queda
 *    deshabilitado;
 *  - al llegar al encuadre, el rig se apaga por completo y la cámara pasa
 *    a ser del usuario vía OrbitControls.
 *
 * Antes ambos escribían cada frame y se peleaban: al orbitar, el rig
 * devolvía la cámara al encuadre y producía jitter.
 */
function DirectedCamera({
  stage,
  focusFloor,
  touch,
  framing,
  orbitRef,
}: {
  stage: SalesStage;
  focusFloor: number | null;
  touch: boolean;
  framing: { distance: number; targetY: number };
  orbitRef: React.RefObject<OrbitHandle>;
}) {
  const { camera, invalidate } = useThree();
  const targetPos = useRef(new THREE.Vector3());
  const targetLook = useRef(new THREE.Vector3());
  /** true mientras el rig manda; false = la cámara es del usuario */
  const transitioning = useRef(false);

  // Cada cambio de etapa o de piso reabre una transición
  useEffect(() => {
    const shots = touch ? SHOTS_TOUCH : SHOTS;
    const s = shots[stage];
    // El encuadre base se escala según la clase de pantalla
    targetPos.current.set(
      s.position[0] * framing.distance,
      s.position[1] * framing.distance,
      s.position[2] * framing.distance,
    );
    targetLook.current.set(
      s.target[0],
      s.target[1] * framing.targetY,
      s.target[2],
    );

    if (stage === "floor" && focusFloor != null) {
      // Debe coincidir con floorY() de ArchitecturalMassing
      const y = 0.62 + (focusFloor - 0.5) * 0.4;
      targetLook.current.y = y;
      targetPos.current.y = y + 1.0;
    }

    transitioning.current = true;
    const controls = orbitRef.current;
    if (controls) controls.enabled = false;
    invalidate();
  }, [
    stage,
    focusFloor,
    touch,
    framing.distance,
    framing.targetY,
    orbitRef,
    invalidate,
  ]);

  useFrame((_, delta) => {
    if (!transitioning.current) return;

    const controls = orbitRef.current;
    const k = 1 - Math.exp(-3.4 * Math.min(delta, 0.1));

    camera.position.lerp(targetPos.current, k);
    if (controls) {
      controls.target.lerp(targetLook.current, k);
      controls.update();
    } else {
      camera.lookAt(targetLook.current);
    }

    // ¿Llegó? Entonces el rig suelta la cámara.
    const done =
      camera.position.distanceToSquared(targetPos.current) < SETTLE_EPS &&
      (!controls ||
        controls.target.distanceToSquared(targetLook.current) < SETTLE_EPS);

    if (done) {
      camera.position.copy(targetPos.current);
      if (controls) {
        controls.target.copy(targetLook.current);
        controls.update();
        controls.enabled = true;
      }
      transitioning.current = false;
    }
  });

  return null;
}

/**
 * Congela el shadow map de una escena estática.
 *
 * Las sombras se recalculan en cada frame por defecto. Acá la geometría
 * casi no cambia, así que se renderizan un puñado de frames y después se
 * apaga la actualización automática — es de los ahorros de GPU más
 * grandes de toda la escena.
 */
function FrozenShadows({ signature }: { signature: string }) {
  const frames = useRef(0);
  const lastSignature = useRef<string | null>(null);

  useFrame((state) => {
    const shadowMap = state.gl.shadowMap;

    // Cualquier cambio relevante reabre una ventana de recálculo
    if (lastSignature.current !== signature) {
      lastSignature.current = signature;
      frames.current = 0;
      shadowMap.autoUpdate = true;
      shadowMap.needsUpdate = true;
      return;
    }

    if (!shadowMap.autoUpdate) return;
    frames.current += 1;
    // Tras unos frames la sombra ya está resuelta: se congela
    if (frames.current > 20) shadowMap.autoUpdate = false;
  });

  return null;
}

export function SalesCenterScene({
  stage,
  focusFloor,
  tier,
  touch = false,
  framing = { distance: 1, fov: 38, targetY: 1 },
  active = true,
  onContextLost,
  children,
}: Props) {
  const orbitRef = useRef<OrbitHandle>(null);
  const isUnit = stage === "unit";
  const low = tier === "low";
  const high = tier === "high";
  const shots = touch ? SHOTS_TOUCH : SHOTS;

  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      /* DPR por tier: en pantallas densas renderizar a 3x es tirar GPU */
      dpr={low ? [1, 1.15] : high ? [1, 1.9] : [1, 1.5]}
      /* Resize amortiguado y desacoplado del scroll: en móvil la barra del
         navegador dispara resizes constantes al scrollear, y recalcular el
         canvas en cada uno provocaba saltos de encuadre. */
      resize={{ scroll: false, debounce: { scroll: 0, resize: 180 } }}
      gl={{
        alpha: false,
        antialias: high,
        powerPreference: low ? "low-power" : "high-performance",
        stencil: false,
        depth: true,
      }}
      camera={{
        position: shots.building.position,
        fov: framing.fov,
        near: 0.1,
        far: 48,
      }}
      shadows={low ? false : "soft"}
      onCreated={({ gl }) => {
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.12;
      }}
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <color attach="background" args={[SITE.skyHorizonDay]} />
      <fog attach="fog" args={[SITE.skyHorizonDay, MOOD.day.fogNear, MOOD.day.fogFar]} />

      {/* En la etapa de unidad se aísla la planta: sin cielo ni entorno,
          para leer la distribución sin distracciones. */}
      {!isUnit && <SkyDome mood="day" clouds={!low} />}
      {!low && <ProceduralEnvironment mood="day" />}

      {/* Luz clave — única que proyecta sombra */}
      <directionalLight
        castShadow={!low}
        position={[6, 9, 4]}
        intensity={MOOD.day.keyIntensity}
        color={MOOD.day.key}
        shadow-mapSize={high ? [1024, 1024] : [512, 512]}
        shadow-bias={-0.0015}
      >
        <orthographicCamera attach="shadow-camera" args={[-8, 8, 8, -8, 0.5, 26]} />
      </directionalLight>

      {/* Relleno y rim: sin sombra, coste despreciable */}
      <directionalLight position={[-5, 4, -3]} intensity={0.24} color={MOOD.day.fill} />
      {!low && (
        <directionalLight position={[-2, 2.5, 5]} intensity={0.2} color={MOOD.day.fill} />
      )}
      <ambientLight
        intensity={low ? 0.46 : MOOD.day.ambientIntensity}
        color={MOOD.day.ambient}
      />
      <hemisphereLight args={[SITE.skyHorizonDay, SITE.grass, 0.42]} />

      {/* Emplazamiento urbano — sólo con el edificio en escena */}
      {!isUnit && <SiteContext mood="day" detail={tier} />}

      {/* Piso neutro para la planta aislada */}
      {isUnit && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]} receiveShadow={!low}>
          <planeGeometry args={[28, 28]} />
          <meshStandardMaterial color={SITE.sidewalk} roughness={1} />
        </mesh>
      )}

      {/* ContactShadows con frames finitos: se calcula y se congela */}
      {!low && (
        <ContactShadows
          position={[0, isUnit ? -0.06 : 0.062, 0]}
          opacity={0.32}
          scale={isUnit ? 8 : 15}
          blur={2.6}
          far={5}
          resolution={high ? 512 : 256}
          frames={60}
          color={BRAND.offBlack}
        />
      )}

      {/* Controles.
          En táctil: UN dedo rota y NADA MÁS. El pinch queda desactivado
          por completo (enableZoom=false + TWO: NONE) porque era la vía
          por la que la escena se acercaba sola: el navegador entrega
          eventos de dos dedos mezclados con el scroll de la página y
          OrbitControls los interpretaba como dolly continuo.
          El encuadre en móvil ya viene resuelto por SHOTS_TOUCH, así que
          el usuario no necesita zoom para ver el edificio completo. */}
      <OrbitControls
        ref={orbitRef}
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={touch ? 0.1 : 0.07}
        rotateSpeed={touch ? 0.4 : 0.42}
        zoomSpeed={0.5}
        enableZoom={!touch}
        touches={
          touch
            ? { ONE: THREE.TOUCH.ROTATE, TWO: undefined as unknown as THREE.TOUCH }
            : { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_ROTATE }
        }
        minDistance={isUnit ? 3.2 : 3.6}
        maxDistance={isUnit ? 8 : 13}
        minPolarAngle={Math.PI * (isUnit ? 0.08 : 0.2)}
        maxPolarAngle={Math.PI * (isUnit ? 0.42 : 0.49)}
      />

      <DirectedCamera
        stage={stage}
        focusFloor={focusFloor}
        touch={touch}
        framing={framing}
        orbitRef={orbitRef}
      />

      {!low && <FrozenShadows signature={`${stage}:${focusFloor ?? "-"}`} />}
      {/* En táctil no se mide FPS: cambiar el DPR en medio de los resizes
          constantes del navegador móvil era parte del comportamiento
          errático. El tier ya fija una resolución conservadora. */}
      <AdaptiveQuality enabled={!high && !touch} />
      <WebGLGuard onLost={onContextLost} />

      <Suspense fallback={null}>{children}</Suspense>
    </Canvas>
  );
}

export { SHOTS as SALES_SHOTS };
