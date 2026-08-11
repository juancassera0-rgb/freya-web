"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import { ACESFilmicToneMapping } from "three";
import { Suspense, useEffect, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { WebGLGuard } from "./WebGLGuard";
import { AdaptiveQuality, type QualityTier } from "./AdaptiveQuality";

export type SalesStage = "building" | "floor" | "unit";

type Props = {
  stage: SalesStage;
  focusFloor: number | null;
  tier: QualityTier;
  /** Puntero grueso: encuadres más lejanos y FOV mayor */
  touch?: boolean;
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
  orbitRef,
}: {
  stage: SalesStage;
  focusFloor: number | null;
  touch: boolean;
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
    targetPos.current.set(...s.position);
    targetLook.current.set(...s.target);

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
  }, [stage, focusFloor, touch, orbitRef, invalidate]);

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
      gl={{
        alpha: false,
        antialias: high,
        powerPreference: low ? "low-power" : "high-performance",
        stencil: false,
        depth: true,
      }}
      camera={{
        position: shots.building.position,
        fov: touch ? 44 : 38,
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
      <color attach="background" args={["#f0eee8"]} />
      <fog attach="fog" args={["#f0eee8", 14, 32]} />

      {/* Luz clave — única que proyecta sombra */}
      <directionalLight
        castShadow={!low}
        position={[6, 9, 4]}
        intensity={1.7}
        color="#fff6e8"
        shadow-mapSize={high ? [1024, 1024] : [512, 512]}
        shadow-bias={-0.0015}
      >
        <orthographicCamera attach="shadow-camera" args={[-7, 7, 7, -7, 0.5, 24]} />
      </directionalLight>

      {/* Relleno y rim: sin sombra, coste despreciable */}
      <directionalLight position={[-5, 4, -3]} intensity={0.24} color="#aab6c4" />
      {!low && (
        <directionalLight position={[-2, 2.5, 5]} intensity={0.2} color="#e8dcc4" />
      )}
      <ambientLight intensity={low ? 0.46 : 0.34} color="#e4ded0" />
      <hemisphereLight args={["#f4f1e8", "#e6e3d8", 0.45]} />

      {!isUnit && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow={!low}>
          <planeGeometry args={[28, 28]} />
          <meshStandardMaterial color="#e6e3d8" roughness={1} />
        </mesh>
      )}

      {/* ContactShadows con frames finitos: se calcula y se congela */}
      {!low && (
        <ContactShadows
          position={[0, isUnit ? -0.04 : 0.005, 0]}
          opacity={0.32}
          scale={isUnit ? 8 : 15}
          blur={2.6}
          far={5}
          resolution={high ? 512 : 256}
          frames={60}
          color="#1d1c1b"
        />
      )}

      <OrbitControls
        ref={orbitRef}
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={touch ? 0.12 : 0.07}
        rotateSpeed={touch ? 0.55 : 0.42}
        zoomSpeed={0.5}
        enableZoom={!touch}
        touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_ROTATE }}
        minDistance={isUnit ? 3.2 : 3.6}
        maxDistance={isUnit ? 8 : 13}
        minPolarAngle={Math.PI * (isUnit ? 0.08 : 0.2)}
        maxPolarAngle={Math.PI * (isUnit ? 0.42 : 0.49)}
      />

      <DirectedCamera
        stage={stage}
        focusFloor={focusFloor}
        touch={touch}
        orbitRef={orbitRef}
      />

      {!low && <FrozenShadows signature={`${stage}:${focusFloor ?? "-"}`} />}
      <AdaptiveQuality enabled={!high} />
      <WebGLGuard onLost={onContextLost} />

      <Suspense fallback={null}>{children}</Suspense>
    </Canvas>
  );
}

export { SHOTS as SALES_SHOTS };
