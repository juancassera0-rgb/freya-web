"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import { ACESFilmicToneMapping } from "three";
import { Suspense, useEffect, useRef, type ReactNode, type RefObject } from "react";
import * as THREE from "three";
import { WebGLGuard } from "./WebGLGuard";
import { AdaptiveQuality, type QualityTier } from "./AdaptiveQuality";
import { SkyDome } from "./SkyDome";
import { SiteContext } from "./SiteContext";
import { NeighbourContext } from "./NeighbourContext";
import { ProceduralEnvironment } from "./ProceduralEnvironment";
import { BRAND, MOOD, SITE } from "./sceneTokens";
import { getConcreteFloorMap, getConcreteFloorNormalMap } from "./proceduralTextures";

export type SalesStage = "building" | "floor" | "unit";

/** Control imperativo del dolly — lo usa el pinch táctil del contenedor. */
export type SceneHandle = { dolly: (factor: number) => void } | null;

type Props = {
  stage: SalesStage;
  focusFloor: number | null;
  tier: QualityTier;
  /** Puntero grueso: encuadres más lejanos y FOV mayor */
  touch?: boolean;
  /** Ajuste de encuadre por clase de pantalla */
  framing?: { distance: number; fov: number; targetY: number };
  active?: boolean;
  /**
   * En táctil, false = la escena no toma el gesto (el dedo scrollea).
   * En puntero fino es siempre true.
   */
  interactive?: boolean;
  /** El padre recibe acá el handle para traducir pinch → dolly */
  handleRef?: RefObject<SceneHandle>;
  onContextLost?: () => void;
  children: ReactNode;
};

/**
 * Encuadres calibrados a la volumetría real (torre angosta, ~4.2 de alto).
 */
const SHOTS: Record<
  SalesStage,
  { position: [number, number, number]; target: [number, number, number] }
> = {
  building: { position: [4.9, 3.1, 6.1], target: [0, 2.05, 0] },
  floor: { position: [3.6, 2.4, 4.6], target: [0, 2.0, 0] },
  unit: { position: [0, 4.4, 4.0], target: [0, 0.2, 0] },
};

/**
 * Encuadre táctil.
 *
 * Antes se alejaba la cámara para garantizar que el edificio entrara
 * completo, y el resultado era una torre diminuta en el centro de una
 * pantalla de teléfono: técnicamente correcto, comercialmente inútil.
 *
 * Ahora se acerca y se sube un poco el punto de mira. El edificio ocupa la
 * pantalla, y como el pinch vuelve a funcionar (ver useSceneTouch), el
 * usuario puede alejarse si quiere la silueta completa.
 */
const SHOTS_TOUCH: typeof SHOTS = {
  building: { position: [4.4, 2.9, 5.9], target: [0, 2.15, 0] },
  floor: { position: [3.5, 2.3, 4.5], target: [0, 2.05, 0] },
  unit: { position: [0, 4.5, 4.1], target: [0, 0.2, 0] },
};

/** Umbral bajo el cual se considera que la cámara llegó al encuadre */
const SETTLE_EPS = 0.012;

/** Límites de distancia por etapa — el pinch los respeta */
const DOLLY_RANGE: Record<SalesStage, [number, number]> = {
  building: [3.4, 13],
  floor: [2.8, 11],
  unit: [2.6, 8],
};

type OrbitHandle = React.ComponentRef<typeof OrbitControls> | null;

/**
 * Traduce el pinch táctil en un dolly acotado.
 *
 * Vive dentro del Canvas para tener acceso a cámara y controles, y publica
 * su función en `handleRef` para que el contenedor DOM —que es quien recibe
 * los eventos touch— la llame. Es la pieza que devuelve el zoom en móvil
 * sin dejar que el gesto llegue a Safari.
 */
function PinchDolly({
  handleRef,
  range,
}: {
  handleRef?: RefObject<SceneHandle>;
  range: [number, number];
}) {
  const { camera, controls, invalidate } = useThree();
  const offset = useRef(new THREE.Vector3());

  useEffect(() => {
    if (!handleRef) return;
    handleRef.current = {
      dolly(factor: number) {
        const orbit = controls as unknown as {
          target?: THREE.Vector3;
          update?: () => void;
        } | null;
        const target = orbit?.target ?? new THREE.Vector3(0, 2, 0);

        offset.current.copy(camera.position).sub(target);
        const len = offset.current.length();
        if (len === 0) return;

        const next = THREE.MathUtils.clamp(len / factor, range[0], range[1]);
        offset.current.multiplyScalar(next / len);
        camera.position.copy(target).add(offset.current);
        orbit?.update?.();
        invalidate();
      },
    };
    return () => {
      handleRef.current = null;
    };
  }, [handleRef, camera, controls, invalidate, range]);

  return null;
}

/**
 * Cámara dirigida con propiedad EXCLUSIVA.
 *
 * Sólo un sistema escribe la cámara en cada momento: durante una transición
 * manda este rig y OrbitControls queda deshabilitado; al llegar al encuadre
 * el rig se apaga y la cámara pasa a ser del usuario.
 */
function DirectedCamera({
  stage,
  focusFloor,
  touch,
  framing,
  orbitRef,
  interactive,
}: {
  stage: SalesStage;
  focusFloor: number | null;
  touch: boolean;
  framing: { distance: number; targetY: number };
  orbitRef: RefObject<OrbitHandle>;
  interactive: boolean;
}) {
  const { camera, invalidate } = useThree();
  const targetPos = useRef(new THREE.Vector3());
  const targetLook = useRef(new THREE.Vector3());
  const transitioning = useRef(false);

  useEffect(() => {
    const shots = touch ? SHOTS_TOUCH : SHOTS;
    const s = shots[stage];
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

    const done =
      camera.position.distanceToSquared(targetPos.current) < SETTLE_EPS &&
      (!controls ||
        controls.target.distanceToSquared(targetLook.current) < SETTLE_EPS);

    if (done) {
      camera.position.copy(targetPos.current);
      if (controls) {
        controls.target.copy(targetLook.current);
        controls.update();
        /* Sólo se devuelve el control si la escena tiene el gesto. En
           táctil sin activar, los controles quedan apagados: así el dedo
           scrollea sin rotar el edificio por accidente. */
        controls.enabled = interactive;
      }
      transitioning.current = false;
    }
  });

  return null;
}

/**
 * Congela el shadow map de una escena estática — de los ahorros de GPU más
 * grandes de toda la escena.
 */
function FrozenShadows({ signature }: { signature: string }) {
  const frames = useRef(0);
  const lastSignature = useRef<string | null>(null);

  useFrame((state) => {
    const shadowMap = state.gl.shadowMap;

    if (lastSignature.current !== signature) {
      lastSignature.current = signature;
      frames.current = 0;
      shadowMap.autoUpdate = true;
      shadowMap.needsUpdate = true;
      return;
    }

    if (!shadowMap.autoUpdate) return;
    frames.current += 1;
    if (frames.current > 20) shadowMap.autoUpdate = false;
  });

  return null;
}

/** Sincroniza el enable de OrbitControls con el gate táctil. */
function ControlsGate({
  orbitRef,
  interactive,
}: {
  orbitRef: RefObject<OrbitHandle>;
  interactive: boolean;
}) {
  useEffect(() => {
    const c = orbitRef.current;
    if (c) c.enabled = interactive;
  }, [orbitRef, interactive]);
  return null;
}

export function SalesCenterScene({
  stage,
  focusFloor,
  tier,
  touch = false,
  framing = { distance: 1, fov: 38, targetY: 1 },
  active = true,
  interactive = true,
  handleRef,
  onContextLost,
  children,
}: Props) {
  const orbitRef = useRef<OrbitHandle>(null);
  const isUnit = stage === "unit";
  const low = tier === "low";
  const high = tier === "high";
  const shots = touch ? SHOTS_TOUCH : SHOTS;
  const range = DOLLY_RANGE[stage];

  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={low ? [1, 1.15] : high ? [1, 2] : [1, 1.5]}
      /* Resize amortiguado y desacoplado del scroll. La altura del
         contenedor además se fija desde useStableStageSize, así que en
         móvil la barra del navegador ya no llega a mover el canvas. */
      resize={{ scroll: false, debounce: { scroll: 0, resize: 180 } }}
      gl={{
        alpha: false,
        /* "medium" es donde vive la mayoría de los usuarios reales
           (móvil + notebooks livianas): sin AA ahí, los mullones y
           barandas del explorador se veían dentados justo en el
           dispositivo más común. "low" lo sigue evitando. */
        antialias: tier !== "low",
        powerPreference: low ? "low-power" : "high-performance",
        stencil: false,
        depth: true,
      }}
      camera={{
        position: shots.building.position,
        fov: framing.fov,
        near: 0.35,
        /* far 34, no 48: nada de la escena está más lejos que el domo de
           cielo, y un rango de profundidad más corto da precisión de
           z-buffer donde importa. Menos z-fighting en las losas. */
        far: 34,
      }}
      /* "soft" (PCFSoftShadowMap) está deprecado en esta versión de three
         y se degrada en silencio a sombras duras. "variance" (VSMShadowMap)
         es el reemplazo vigente. */
      shadows={low ? false : "variance"}
      onCreated={({ gl }) => {
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.12;
      }}
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <color attach="background" args={[SITE.skyHorizonDay]} />
      <fog attach="fog" args={[SITE.skyHorizonDay, MOOD.day.fogNear, MOOD.day.fogFar]} />

      {!isUnit && <SkyDome mood="day" clouds={!low} detail={tier} />}
      {!low && <ProceduralEnvironment mood="day" />}

      {/* Luz clave — única que proyecta sombra.
          La cámara de sombra se ajustó al volumen real (torre de ~4.2 de
          alto sobre una vereda de 3 de profundidad). Antes cubría ±8, o
          sea 16 unidades para un objeto de 4: más de la mitad del shadow
          map se gastaba en vacío. Acotarla multiplica por ~2.5 la densidad
          de la sombra SIN cambiar el tamaño del mapa — sombras más nítidas
          y más baratas a la vez. */}
      <directionalLight
        castShadow={!low}
        position={[6, 9, 4]}
        intensity={MOOD.day.keyIntensity}
        color={MOOD.day.key}
        /* El explorador congela el shadow map apenas la cámara se
           asienta (FrozenShadows más abajo), así que el costo de un mapa
           más grande en "medium" es prácticamente único, no por frame —
           vale la pena para sombras más nítidas en el dispositivo más
           común. */
        shadow-mapSize={high ? [1024, 1024] : [768, 768]}
        shadow-bias={-0.0012}
        shadow-normalBias={0.02}
        shadow-radius={4}
      >
        <orthographicCamera attach="shadow-camera" args={[-5, 5, 6, -3, 1, 20]} />
      </directionalLight>

      {/* Relleno y rim: sin sombra, coste despreciable */}
      <directionalLight position={[-5, 4, -3]} intensity={0.24} color={MOOD.day.fill} />
      {!low && (
        <directionalLight position={[-2, 2.5, 5]} intensity={0.2} color={MOOD.day.fill} />
      )}
      {/* Rebote cálido del suelo hacia los intradoses de balcón: es lo que
          saca al edificio del gris y le da la calidez de los renders. */}
      {!low && (
        <directionalLight
          position={[0.5, -2.5, 3]}
          intensity={0.16}
          color={MOOD.day.bounce}
        />
      )}
      <ambientLight
        intensity={low ? 0.46 : MOOD.day.ambientIntensity}
        color={MOOD.day.ambient}
      />
      <hemisphereLight args={[SITE.skyHorizonDay, SITE.grass, 0.42]} />

      {!isUnit && <SiteContext mood="day" detail={tier} />}
      {!isUnit && <NeighbourContext detail={tier} />}

      {isUnit && (
        /* Piso del sales center — antes un gris de vereda sin variación
           que dominaba todo el encuadre (superficie enorme, un solo tono
           plano bajo luz difusa se lee muy oscura y sin vida). El mismo
           hormigón procedural que el edificio, a escala de paño grande. */
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]} receiveShadow={!low}>
          <planeGeometry args={[28, 28]} />
          <meshStandardMaterial
            color="#efece4"
            roughness={0.88}
            map={getConcreteFloorMap()}
            normalMap={getConcreteFloorNormalMap()}
            normalScale={new THREE.Vector2(0.5, 0.5)}
            envMapIntensity={0.35}
          />
        </mesh>
      )}

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

      {/* CONTROLES.
          En táctil: UN dedo rota. El pinch NO lo maneja OrbitControls —
          lo maneja useSceneTouch en el contenedor DOM y llega acá como
          dolly acotado vía PinchDolly. Razón: OrbitControls no puede
          impedir el zoom de página de Safari; el listener no pasivo del
          contenedor sí. Ver el comentario largo en useSceneTouch.ts.

          `enabled` sigue al gate táctil: sin activar, el dedo scrollea. */}
      <OrbitControls
        ref={orbitRef}
        makeDefault
        enabled={interactive}
        enablePan={false}
        enableDamping
        dampingFactor={touch ? 0.11 : 0.07}
        rotateSpeed={touch ? 0.42 : 0.42}
        zoomSpeed={0.5}
        enableZoom={!touch}
        touches={{
          ONE: THREE.TOUCH.ROTATE,
          /* NONE no existe en THREE.TOUCH; -1 es el valor que OrbitControls
             interpreta como "sin acción" y es la forma correcta de anular
             el gesto de dos dedos sin pasar undefined. */
          TWO: -1 as unknown as THREE.TOUCH,
        }}
        minDistance={range[0]}
        maxDistance={range[1]}
        minPolarAngle={Math.PI * (isUnit ? 0.08 : 0.2)}
        maxPolarAngle={Math.PI * (isUnit ? 0.42 : 0.49)}
      />

      <ControlsGate orbitRef={orbitRef} interactive={interactive} />
      <PinchDolly handleRef={handleRef} range={range} />

      <DirectedCamera
        stage={stage}
        focusFloor={focusFloor}
        touch={touch}
        framing={framing}
        orbitRef={orbitRef}
        interactive={interactive}
      />

      {!low && <FrozenShadows signature={`${stage}:${focusFloor ?? "-"}`} />}
      <AdaptiveQuality enabled={!high && !touch} />
      <WebGLGuard onLost={onContextLost} />

      <Suspense fallback={null}>{children}</Suspense>
    </Canvas>
  );
}

export { SHOTS as SALES_SHOTS };
