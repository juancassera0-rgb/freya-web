"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import type { Project3DConfig } from "@/data/project3d";
import { BRAND, SITE } from "./sceneTokens";
import {
  getConcreteMap,
  getConcreteNormalMap,
  getConcreteRoughnessMap,
} from "./proceduralTextures";
import { SITE_DIMS } from "./siteDims";

type Props = {
  config: Project3DConfig;
  /** 0 = compacto, 1 = pisos separados (vista explotada) */
  explode?: number;
  explodeRef?: RefObject<number>;
  highlightedFloor?: number | null;
  selectedUnitId?: string | null;
  dimOthers?: boolean;
  /** Reduce geometría y detalle en móvil */
  lite?: boolean;
  hoveredFloor?: number | null;
  onHoverFloor?: (level: number | null) => void;
  onSelectFloor?: (level: number) => void;
  extract?: number;
  /**
   * Balanceo de presencia. Se apaga en táctil: en un teléfono compite con
   * el gesto del usuario y hace que la escena parezca inestable justo
   * cuando se la está tocando.
   */
  idleSway?: boolean;
};

/* --------------------------------------------------------------------------
   PROPORCIONES — derivadas de los renders del proyecto (ver siteDims.ts).
   -------------------------------------------------------------------------- */
const { W, D, FLOOR_H, GROUND_H, SLAB_T, CANTILEVER } = SITE_DIMS;
const RAIL_H = 0.13;
const PARTY_EXTRA = 0.55;

const COL = {
  stucco: SITE.stucco,
  slabFascia: SITE.slabFascia,
  soffit: SITE.soffit,
  glass: SITE.glass,
  glassLit: SITE.glassLit,
  mullion: SITE.mullion,
  rail: SITE.rail,
  railCap: SITE.railCap,
  ground: SITE.groundFloor,
  green: SITE.foliage,
  accent: BRAND.camo,
  interior: SITE.interior,
  interiorLit: SITE.interiorLit,
  party: SITE.party,
};

export function ArchitecturalMassing({
  config,
  explode = 0,
  explodeRef,
  highlightedFloor = null,
  selectedUnitId = null,
  dimOthers = false,
  lite = false,
  hoveredFloor = null,
  onHoverFloor,
  onSelectFloor,
  extract = 0,
  idleSway = false,
}: Props) {
  const group = useRef<THREE.Group>(null);
  const slabRefs = useRef<Map<number, THREE.Group>>(new Map());
  const crownRef = useRef<THREE.Group>(null);
  const parapetRef = useRef<THREE.Mesh>(null);
  const extractNow = useRef(0);
  const explodeNow = useRef(explode);

  const floors = config.schematicFloors;
  const towerFloors = Math.max(1, floors - 1);

  const selectedUnit = selectedUnitId
    ? config.units.find((u) => u.id === selectedUnitId)
    : null;

  /* ------------------------------------------------------------------
     MATERIALES COMPARTIDOS — incluidas las VARIANTES DE ESTADO.

     Éste era el problema de rendimiento más caro del explorador y no se
     veía a simple vista.

     La versión anterior declaraba `<meshStandardMaterial>` inline dentro
     del map de pisos: vidriado, losa, retorno de losa y dos barandas por
     nivel. Con nueve niveles eso son ~45 materiales distintos, y como
     estaban en el JSX se REASIGNABAN EN CADA RE-RENDER de React. El
     hover sobre un piso es un setState, o sea que pasar el mouse por la
     torre reconstruía 45 materiales por movimiento, cada uno con su
     propio juego de uniforms y sin posibilidad de agrupar draw calls.
     Ése era el tirón al recorrer los pisos con el mouse.

     Ahora hay tres variantes por rol —base, destacada y atenuada— creadas
     una sola vez. El hover pasa a ser elegir una referencia ya existente:
     cero asignaciones, y Three puede reutilizar el programa entre pisos.
     ------------------------------------------------------------------ */
  const mat = useMemo(() => {
    const make = (
      color: string,
      roughness: number,
      opts: Partial<THREE.MeshStandardMaterialParameters> = {},
    ) => new THREE.MeshStandardMaterial({ color, roughness, ...opts });

    /* Hormigón visto — variación de paño procedural + envMap contenido.
       Tres correcciones sobre la versión anterior, todas apuntando al
       mismo síntoma ("se ve de plástico"):
       1. `map` module el tono base ~±20% en paneles anchos — el color es
          lo que el ojo lee primero, mucho antes que el brillo, así que es
          la pieza que realmente rompe la uniformidad en una captura.
       2. `roughnessMap` (mismo patrón, sin espacio de color) evita que la
          superficie responda de forma pareja a la luz especular.
       3. envMapIntensity por default es 1: un mate real no refleja el
          entorno a intensidad plena. Bajarlo a 0.35 saca el lustre que no
          le corresponde a una superficie rugosa. */
    const concreteMap = getConcreteMap();
    const concreteRoughnessMap = getConcreteRoughnessMap();
    const concreteNormalMap = getConcreteNormalMap();
    const concrete = (color: string, roughness: number) =>
      make(color, roughness, {
        map: concreteMap,
        roughnessMap: concreteRoughnessMap,
        normalMap: concreteNormalMap,
        normalScale: new THREE.Vector2(1.05, 1.05),
        envMapIntensity: 0.22,
      });

    const glass = (
      color: string,
      opacity: number,
      metalness: number,
    ) =>
      new THREE.MeshPhysicalMaterial({
        color,
        roughness: 0.045,
        metalness,
        envMapIntensity: 2.1,
        transparent: true,
        opacity,
        clearcoat: 1,
        clearcoatRoughness: 0.06,
        ior: 1.45,
        specularIntensity: 1,
        thickness: 0.08,
      });

    return {
      stucco: concrete(COL.stucco, 0.88),
      fascia: concrete(COL.slabFascia, 0.72),
      soffit: concrete(COL.soffit, 0.9),
      mullion: make(COL.mullion, 0.28, {
        metalness: 0.82,
        envMapIntensity: 0.9,
      }),
      railCap: make(COL.railCap, 0.32, {
        metalness: 0.78,
        envMapIntensity: 0.7,
      }),
      ground: concrete(COL.ground, 0.86),
      party: concrete(COL.party, 0.9),
      green: make(COL.green, 1),
      accent: make(COL.accent, 0.6),

      interior: make(COL.interior, 0.97, { envMapIntensity: 0.05 }),
      interiorLit: make(COL.interiorLit, 0.92, { envMapIntensity: 0.12 }),

      glassBase: glass(COL.glass, 0.42, 0.1),
      glassEmph: glass(COL.glassLit, 0.55, 0.06),
      glassDim: glass(COL.glass, 0.16, 0.1),

      slabBase: concrete(COL.slabFascia, 0.72),
      slabEmph: make(COL.accent, 0.7),
      slabDim: make(COL.slabFascia, 0.78, { transparent: true, opacity: 0.3 }),

      railBase: glass(COL.rail, 0.38, 0.08),
      railDim: glass(COL.rail, 0.1, 0.08),
    };
  }, []);

  // Libera materiales al desmontar — evita fugas entre navegaciones
  useEffect(() => {
    return () => Object.values(mat).forEach((m) => m.dispose());
  }, [mat]);

  /* ---------- Geometrías compartidas ---------- */
  const geo = useMemo(
    () => ({
      slab: new THREE.BoxGeometry(W + CANTILEVER * 2, SLAB_T, D * 0.52),
      slabReturn: new THREE.BoxGeometry(CANTILEVER, SLAB_T, D * 0.4),
      soffit: new THREE.BoxGeometry(W + CANTILEVER * 2 - 0.04, 0.01, D * 0.5),
      slabEdge: new THREE.BoxGeometry(W + CANTILEVER * 2, SLAB_T * 1.15, 0.028),
      /* Vidrio FINO, no un bloque: el paño grueso anterior se leía como
         masa blanca. Profundidad real = interior recedido + revel. */
      glazing: new THREE.BoxGeometry(W * 0.86, FLOOR_H * 0.64, 0.02),
      interior: new THREE.BoxGeometry(W * 0.9, FLOOR_H * 0.72, D * 0.28),
      revealH: new THREE.BoxGeometry(W * 0.9, 0.018, 0.05),
      revealV: new THREE.BoxGeometry(0.018, FLOOR_H * 0.68, 0.05),
      transom: new THREE.BoxGeometry(W * 0.86, 0.012, 0.018),
      mullion: new THREE.BoxGeometry(0.014, FLOOR_H * 0.64, 0.018),
      rail: new THREE.BoxGeometry(W + CANTILEVER * 2 - 0.03, RAIL_H, 0.01),
      railSide: new THREE.BoxGeometry(0.01, RAIL_H, D * 0.5),
      railCap: new THREE.BoxGeometry(W + CANTILEVER * 2 - 0.02, 0.008, 0.016),
      pick: new THREE.BoxGeometry(W + CANTILEVER * 2, FLOOR_H * 0.95, D * 0.6),
    }),
    [],
  );

  useEffect(() => {
    return () => Object.values(geo).forEach((g) => g.dispose());
  }, [geo]);

  const floorY = (level: number, ex: number) =>
    GROUND_H + (level - 0.5) * FLOOR_H + ex * 0.3 * (level - 1);

  const towerH = towerFloors * FLOOR_H;
  const totalH = GROUND_H + floors * FLOOR_H;

  /* ---------- Animación interna: sin setState por frame ---------- */
  useFrame((state, delta) => {
    const d = Math.min(delta, 0.1);
    const k = 1 - Math.exp(-3.2 * d);

    extractNow.current += (extract - extractNow.current) * k;

    const explodeTarget = explodeRef?.current ?? explode;
    explodeNow.current += (explodeTarget - explodeNow.current) * k;
    const ex = explodeNow.current;

    const active = highlightedFloor;
    slabRefs.current.forEach((node, level) => {
      const e = active === level ? extractNow.current : 0;
      node.position.z = e * 1.05;
      node.position.y = floorY(level, ex) + e * 0.2;
    });

    if (crownRef.current) {
      crownRef.current.position.y = GROUND_H + towerH + ex * 0.3 * towerFloors;
    }
    if (parapetRef.current) {
      parapetRef.current.position.y =
        GROUND_H + towerH + FLOOR_H + 0.16 + ex * 0.3 * towerFloors;
    }

    if (group.current) {
      const target =
        idleSway && active == null
          ? Math.sin(state.clock.elapsedTime * 0.055) * 0.014
          : 0;
      group.current.rotation.y +=
        (target - group.current.rotation.y) * (1 - Math.exp(-1.8 * d));
    }
  });

  return (
    <group ref={group}>
      {/* ==========================================================
          BASAMENTO — planta baja retranqueada, acceso y cochera
          ========================================================== */}
      <group>
        {/* Masa de PB: revoque, no un bloque de vidrio. El paño vidriado
           es una fachada fina al frente. */}
        <mesh
          position={[0, GROUND_H / 2, -D * 0.08]}
          castShadow
          receiveShadow
          material={mat.ground}
        >
          <boxGeometry args={[W * 0.92, GROUND_H, D * 0.78]} />
        </mesh>

        <mesh
          position={[0, GROUND_H * 0.48, D * 0.28]}
          material={mat.interiorLit}
        >
          <boxGeometry args={[W * 0.7, GROUND_H * 0.7, 0.08]} />
        </mesh>

        <mesh
          position={[0, GROUND_H * 0.5, D * 0.34]}
          castShadow
          material={mat.glassBase}
        >
          <boxGeometry args={[W * 0.72, GROUND_H * 0.78, 0.02]} />
        </mesh>

        {[-1, 1].map((s) => (
          <mesh
            key={s}
            position={[s * (W / 2 - 0.05), GROUND_H / 2, D * 0.32]}
            castShadow
            material={mat.mullion}
          >
            <boxGeometry args={[0.04, GROUND_H, 0.04]} />
          </mesh>
        ))}

        <mesh
          position={[-W * 0.28, GROUND_H / 2, D * 0.22]}
          castShadow
          receiveShadow
          material={mat.ground}
        >
          <boxGeometry args={[W * 0.3, GROUND_H, 0.1]} />
        </mesh>

        <mesh
          position={[0, GROUND_H, D * 0.06]}
          castShadow
          receiveShadow
          material={mat.fascia}
        >
          <boxGeometry args={[W + CANTILEVER * 2, SLAB_T * 1.5, D * 0.62]} />
        </mesh>
      </group>

      {/* ==========================================================
          MEDIANERA CIEGA — silueta característica de la torre
          ========================================================== */}
      <mesh
        position={[W / 2 + 0.06, (totalH + PARTY_EXTRA) / 2, -D * 0.06]}
        castShadow
        receiveShadow
        material={mat.party}
      >
        <boxGeometry args={[0.12, totalH + PARTY_EXTRA, D * 0.98]} />
      </mesh>
      <mesh
        position={[0, (totalH + PARTY_EXTRA * 0.55) / 2, -D / 2]}
        castShadow
        receiveShadow
        material={mat.party}
      >
        <boxGeometry args={[W + 0.12, totalH + PARTY_EXTRA * 0.55, 0.12]} />
      </mesh>

      {/* ==========================================================
          NIVELES CON BALCÓN
          ========================================================== */}
      {Array.from({ length: towerFloors }, (_, i) => {
        const level = i + 1;
        const active = highlightedFloor === level;
        const isSelectedFloor = selectedUnit?.floor === level;
        const isHovered = hoveredFloor === level;
        const emphasised = active || isSelectedFloor || isHovered;
        const dimmed = dimOthers && !emphasised;

        /* Selección de material: referencias ya existentes, sin crear nada.
           Esto es lo que hace que el hover no cueste. */
        const glassMat = dimmed
          ? mat.glassDim
          : emphasised
            ? mat.glassEmph
            : mat.glassBase;
        const slabMat = dimmed
          ? mat.slabDim
          : emphasised
            ? mat.slabEmph
            : mat.slabBase;
        const railMat = dimmed ? mat.railDim : mat.railBase;

        return (
          <group
            key={level}
            ref={(node) => {
              if (node) slabRefs.current.set(level, node);
              else slabRefs.current.delete(level);
            }}
            position={[0, floorY(level, explode), 0]}
          >
            {/* Captura de hover/click del nivel */}
            {onSelectFloor ? (
              <mesh
                geometry={geo.pick}
                position={[0, FLOOR_H * 0.35, D * 0.1]}
                visible={false}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onHoverFloor?.(level);
                }}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  onHoverFloor?.(level);
                }}
                onPointerOut={() => onHoverFloor?.(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectFloor(level);
                }}
              />
            ) : null}

            {/* Volumen interior recedido — oscuro, da profundidad al paño */}
            <mesh
              geometry={geo.interior}
              position={[0, FLOOR_H * 0.4, -D * 0.18]}
              material={emphasised ? mat.interiorLit : mat.interior}
              castShadow={false}
              receiveShadow
            />

            {/* Revel de ventana: el canto que separa revoque y vidrio */}
            {!lite && (
              <>
                <mesh
                  geometry={geo.revealH}
                  position={[0, FLOOR_H * 0.74, D * 0.02]}
                  material={mat.stucco}
                />
                <mesh
                  geometry={geo.revealH}
                  position={[0, FLOOR_H * 0.08, D * 0.02]}
                  material={mat.stucco}
                />
                {[-0.44, 0.44].map((f) => (
                  <mesh
                    key={`rv-${f}`}
                    geometry={geo.revealV}
                    position={[f * W, FLOOR_H * 0.41, D * 0.02]}
                    material={mat.stucco}
                  />
                ))}
              </>
            )}

            {/* Paño de vidrio fino, retirado detrás del balcón */}
            <mesh
              geometry={geo.glazing}
              position={[0, FLOOR_H * 0.42, D * 0.04]}
              material={glassMat}
            />

            {/* Montantes + travesaño: carpintería metálica oscura */}
            {!lite &&
              [-0.29, 0, 0.29].map((f) => (
                <mesh
                  key={f}
                  geometry={geo.mullion}
                  position={[f * W, FLOOR_H * 0.42, D * 0.052]}
                  material={mat.mullion}
                />
              ))}
            {!lite && (
              <mesh
                geometry={geo.transom}
                position={[0, FLOOR_H * 0.58, D * 0.052]}
                material={mat.mullion}
              />
            )}

            {/* LOSA DE BALCÓN — gesto dominante de la fachada */}
            <mesh
              geometry={geo.slab}
              position={[0, 0, D * 0.16]}
              castShadow={!lite}
              receiveShadow
              material={slabMat}
            />
            <mesh
              geometry={geo.slabEdge}
              position={[0, 0, D * 0.16 + D * 0.26]}
              castShadow={!lite}
              material={mat.soffit}
            />
            <mesh
              geometry={geo.slabReturn}
              position={[-(W / 2 + CANTILEVER / 2), 0, -D * 0.1]}
              castShadow={!lite}
              receiveShadow
              material={slabMat}
            />
            {/* Intradós: la losa deja de ser un plano de papel */}
            {!lite && (
              <mesh
                geometry={geo.soffit}
                position={[0, -SLAB_T / 2 - 0.006, D * 0.14]}
                material={mat.soffit}
              />
            )}

            {/* Baranda de vidrio tintado + pasamano metálico */}
            <mesh
              geometry={geo.rail}
              position={[0, RAIL_H / 2 + SLAB_T / 2, D * 0.16 + D * 0.26]}
              material={railMat}
            />
            <mesh
              geometry={geo.railCap}
              position={[0, RAIL_H + SLAB_T / 2, D * 0.16 + D * 0.26]}
              material={mat.railCap}
            />
            <mesh
              geometry={geo.railSide}
              position={[
                -(W / 2 + CANTILEVER - 0.01),
                RAIL_H / 2 + SLAB_T / 2,
                -D * 0.08,
              ]}
              material={railMat}
            />
          </group>
        );
      })}

      {/* ==========================================================
          PENTHOUSE — retiro superior con parapeto y vegetación
          ========================================================== */}
      <group ref={crownRef} position={[0, GROUND_H + towerH, 0]}>
        <mesh
          position={[0, FLOOR_H * 0.5, -D * 0.14]}
          castShadow
          receiveShadow
          material={mat.stucco}
        >
          <boxGeometry args={[W * 0.82, FLOOR_H, D * 0.5]} />
        </mesh>
        <mesh
          position={[0, FLOOR_H * 0.5, D * 0.11]}
          material={mat.glassBase}
        >
          <boxGeometry args={[W * 0.72, FLOOR_H * 0.62, 0.02]} />
        </mesh>
        <mesh position={[0, 0.01, D * 0.24]} receiveShadow material={mat.fascia}>
          <boxGeometry args={[W * 0.9, SLAB_T * 0.7, D * 0.24]} />
        </mesh>
        {/* Jardineras — la vegetación que desborda en los renders */}
        {!lite &&
          [-0.28, 0.02, 0.3].map((f) => (
            <mesh
              key={f}
              position={[f * W, 0.075, D * 0.3]}
              castShadow
              material={mat.green}
            >
              <boxGeometry args={[W * 0.24, 0.11, 0.13]} />
            </mesh>
          ))}
      </group>

      {/* Parapeto / sala de máquinas — remate macizo escalonado */}
      <mesh
        ref={parapetRef}
        position={[-W * 0.1, GROUND_H + towerH + FLOOR_H + 0.16, -D * 0.2]}
        castShadow
        receiveShadow
        material={mat.stucco}
      >
        <boxGeometry args={[W * 0.55, 0.32, D * 0.34]} />
      </mesh>
    </group>
  );
}
