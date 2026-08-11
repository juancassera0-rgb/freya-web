"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import { ACESFilmicToneMapping } from "three";
import { Suspense, useRef, type ReactNode } from "react";
import * as THREE from "three";
import type { Project3DConfig } from "@/data/project3d";

export type SalesStage = "building" | "floor" | "unit";

type Props = {
  config: Project3DConfig;
  stage: SalesStage;
  /** Nivel enfocado — mueve el target de la cámara a su altura */
  focusFloor: number | null;
  lite: boolean;
  children: ReactNode;
};

/** Encuadres por etapa: posición y punto de mira de la cámara. */
const SHOTS: Record<
  SalesStage,
  { position: [number, number, number]; target: [number, number, number] }
> = {
  building: { position: [4.6, 2.9, 6.4], target: [0, 1.9, 0] },
  floor: { position: [3.4, 2.2, 4.4], target: [0, 1.9, 0] },
  unit: { position: [0, 4.4, 4.0], target: [0, 0.2, 0] },
};

/**
 * Cámara dirigida: interpola hacia el encuadre de la etapa activa.
 * Movimiento lento y amortiguado — nunca corta ni salta.
 */
function DirectedCamera({
  stage,
  focusFloor,
  floorCount,
  orbitRef,
}: {
  stage: SalesStage;
  focusFloor: number | null;
  floorCount: number;
  orbitRef: React.RefObject<{ target: THREE.Vector3; update: () => void } | null>;
}) {
  const { camera } = useThree();
  const shot = SHOTS[stage];

  const targetPos = useRef(new THREE.Vector3(...shot.position));
  const targetLook = useRef(new THREE.Vector3(...shot.target));

  useFrame((_, delta) => {
    const s = SHOTS[stage];
    targetPos.current.set(...s.position);
    targetLook.current.set(...s.target);

    // En etapa "floor" la cámara sube a la altura del piso elegido
    if (stage === "floor" && focusFloor != null) {
      const y = 0.42 + (focusFloor - 0.5) * 0.42;
      targetLook.current.y = y;
      targetPos.current.y = y + 1.1;
    }

    // Amortiguación independiente del framerate
    const k = 1 - Math.exp(-2.1 * delta);
    camera.position.lerp(targetPos.current, k);

    const controls = orbitRef.current;
    if (controls) {
      controls.target.lerp(targetLook.current, k);
      controls.update();
    } else {
      camera.lookAt(targetLook.current);
    }
  });

  void floorCount;
  return null;
}

/**
 * Canvas compartido del explorador comercial. Un solo contexto WebGL para
 * todas las etapas — el edificio, la planta y la unidad viven en la misma
 * escena, por eso las transiciones son continuas.
 */
export function SalesCenterScene({
  config,
  stage,
  focusFloor,
  lite,
  children,
}: Props) {
  const orbitRef = useRef<React.ComponentRef<typeof OrbitControls> | null>(null);
  const isUnit = stage === "unit";

  return (
    <Canvas
      dpr={lite ? [1, 1.25] : [1, 1.6]}
      gl={{
        alpha: false,
        antialias: !lite,
        powerPreference: "high-performance",
        stencil: false,
      }}
      camera={{ position: SHOTS.building.position, fov: 38, near: 0.1, far: 60 }}
      shadows={!lite ? "soft" : false}
      onCreated={({ gl }) => {
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.15;
      }}
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <color attach="background" args={["#f0eee8"]} />
      <fog attach="fog" args={["#f0eee8", 14, 32]} />

      {/* Luz clave arquitectónica */}
      <directionalLight
        castShadow={!lite}
        position={[6, 9, 4]}
        intensity={1.7}
        color="#fff6e8"
        shadow-mapSize={lite ? [512, 512] : [1536, 1536]}
        shadow-bias={-0.0015}
      >
        <orthographicCamera attach="shadow-camera" args={[-7, 7, 7, -7, 0.5, 24]} />
      </directionalLight>
      <directionalLight position={[-5, 4, -3]} intensity={0.24} color="#aab6c4" />
      <directionalLight position={[-2, 2.5, 5]} intensity={0.2} color="#e8dcc4" />
      <ambientLight intensity={0.34} color="#e4ded0" />
      <hemisphereLight args={["#f4f1e8", "#e6e3d8", 0.45]} />

      {/* Suelo — se retira en la etapa de unidad para leer la planta aislada */}
      {!isUnit && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[28, 28]} />
          <meshStandardMaterial color="#e6e3d8" roughness={1} />
        </mesh>
      )}

      {!lite && (
        <ContactShadows
          position={[0, isUnit ? -0.04 : 0.005, 0]}
          opacity={0.32}
          scale={isUnit ? 8 : 15}
          blur={2.6}
          far={5}
          resolution={512}
          color="#1d1c1b"
        />
      )}

      <OrbitControls
        ref={orbitRef}
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.07}
        rotateSpeed={0.42}
        zoomSpeed={0.5}
        minDistance={isUnit ? 3.2 : 3.6}
        maxDistance={isUnit ? 8 : 12}
        minPolarAngle={Math.PI * (isUnit ? 0.08 : 0.2)}
        maxPolarAngle={Math.PI * (isUnit ? 0.42 : 0.49)}
      />

      <DirectedCamera
        stage={stage}
        focusFloor={focusFloor}
        floorCount={config.schematicFloors}
        orbitRef={orbitRef}
      />

      <Suspense fallback={null}>{children}</Suspense>
    </Canvas>
  );
}
