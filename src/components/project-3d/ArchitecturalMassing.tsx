"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import type { Project3DConfig } from "@/data/project3d";

type Props = {
  config: Project3DConfig;
  /** 0 = compacto, 1 = pisos separados (vista explotada) */
  explode?: number;
  /**
   * Alternativa a `explode` leída por referencia: permite que el scroll
   * mueva la vista explotada a 60fps sin re-renderizar React.
   */
  explodeRef?: RefObject<number>;
  highlightedFloor?: number | null;
  selectedUnitId?: string | null;
  dimOthers?: boolean;
  /** Reduce geometría y detalle en móvil */
  lite?: boolean;
  hoveredFloor?: number | null;
  onHoverFloor?: (level: number | null) => void;
  onSelectFloor?: (level: number) => void;
  /** Objetivo 0→1 de extracción de la losa seleccionada. Se interpola interno. */
  extract?: number;
};

/* --------------------------------------------------------------------------
   PROPORCIONES — derivadas de los renders del proyecto.
   Torre entre medianeras: frente angosto, lote profundo. El frente da a la
   calle; la medianera ciega corre por un lateral y por el fondo.
   -------------------------------------------------------------------------- */
const W = 1.62; // ancho de frente (angosto)
const D = 2.45; // profundidad (mayor que el frente)
const FLOOR_H = 0.4;
const GROUND_H = 0.62; // basamento más alto y retranqueado
const SLAB_T = 0.052; // canto de losa expresado
const CANTILEVER = 0.3; // vuelo del balcón sobre la línea de vidrio
const RAIL_H = 0.13;
const PARTY_EXTRA = 0.55; // la medianera sobrepasa la última losa

/** Paleta leída de los renders */
const COL = {
  stucco: "#efece4", // medianera / parapetos
  slabFascia: "#cfc3ac", // frente de losa, tono arena
  soffit: "#e0d6c2", // intradós del balcón
  glass: "#4a5a68", // vidriado azul-gris
  glassLit: "#e8c89a", // vidrio con luz interior cálida
  mullion: "#3a3832",
  rail: "#b9c6c4", // baranda de vidrio
  ground: "#b9b2a4",
  green: "#6d7a52", // vegetación del retiro
  accent: "#4f4c37",
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
}: Props) {
  const group = useRef<THREE.Group>(null);
  const slabRefs = useRef<Map<number, THREE.Group>>(new Map());
  const crownRef = useRef<THREE.Group>(null);
  const parapetRef = useRef<THREE.Mesh>(null);
  /** Valores interpolados — viven en refs, no disparan re-render */
  const extractNow = useRef(0);
  const explodeNow = useRef(explode);

  // Niveles con balcón: el último es penthouse retirado
  const floors = config.schematicFloors;
  const towerFloors = Math.max(1, floors - 1);

  const selectedUnit = selectedUnitId
    ? config.units.find((u) => u.id === selectedUnitId)
    : null;

  /* ---------- Materiales compartidos (una instancia para toda la escena) ---------- */
  const mat = useMemo(() => {
    const make = (
      color: string,
      roughness: number,
      opts: Partial<THREE.MeshStandardMaterialParameters> = {},
    ) => new THREE.MeshStandardMaterial({ color, roughness, ...opts });

    return {
      stucco: make(COL.stucco, 0.92),
      fascia: make(COL.slabFascia, 0.78),
      soffit: make(COL.soffit, 0.85),
      glass: make(COL.glass, 0.08, {
        metalness: 0.62,
        transparent: true,
        opacity: 0.72,
      }),
      mullion: make(COL.mullion, 0.45, { metalness: 0.35 }),
      rail: make(COL.rail, 0.06, {
        metalness: 0.15,
        transparent: true,
        opacity: 0.3,
      }),
      ground: make(COL.ground, 0.9),
      green: make(COL.green, 1),
      accent: make(COL.accent, 0.6),
    };
  }, []);

  // Libera materiales al desmontar — evita fugas entre navegaciones
  useMemo(() => {
    return () => Object.values(mat).forEach((m) => m.dispose());
  }, [mat]);

  /* ---------- Geometrías compartidas ---------- */
  const geo = useMemo(
    () => ({
      slab: new THREE.BoxGeometry(W + CANTILEVER * 2, SLAB_T, D * 0.52),
      glazing: new THREE.BoxGeometry(W * 0.94, FLOOR_H * 0.78, D * 0.42),
      rail: new THREE.BoxGeometry(W + CANTILEVER * 2 - 0.03, RAIL_H, 0.012),
      railSide: new THREE.BoxGeometry(0.012, RAIL_H, D * 0.5),
      pick: new THREE.BoxGeometry(W + CANTILEVER * 2, FLOOR_H * 0.95, D * 0.6),
    }),
    [],
  );

  const floorY = (level: number, ex: number) =>
    GROUND_H + (level - 0.5) * FLOOR_H + ex * 0.3 * (level - 1);

  const towerH = towerFloors * FLOOR_H;
  const totalH = GROUND_H + floors * FLOOR_H;

  /* ---------- Animación interna: sin setState por frame ---------- */
  useFrame((state, delta) => {
    const d = Math.min(delta, 0.1);
    const k = 1 - Math.exp(-3.2 * d);

    extractNow.current += (extract - extractNow.current) * k;

    // El scroll puede alimentar explode por ref (continuo) o por prop
    const explodeTarget = explodeRef?.current ?? explode;
    explodeNow.current += (explodeTarget - explodeNow.current) * k;
    const ex = explodeNow.current;

    const active = highlightedFloor;
    slabRefs.current.forEach((node, level) => {
      const e = active === level ? extractNow.current : 0;
      node.position.z = e * 1.05;
      node.position.y = floorY(level, ex) + e * 0.2;
    });

    // El penthouse y el remate acompañan la separación
    if (crownRef.current) {
      crownRef.current.position.y = GROUND_H + towerH + ex * 0.3 * towerFloors;
    }
    if (parapetRef.current) {
      parapetRef.current.position.y =
        GROUND_H + towerH + FLOOR_H + 0.16 + ex * 0.3 * towerFloors;
    }

    // Presencia mínima — se detiene cuando hay un piso seleccionado
    if (group.current) {
      const target =
        active == null ? Math.sin(state.clock.elapsedTime * 0.055) * 0.014 : 0;
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
        {/* Volumen vidriado retranqueado respecto de la losa superior */}
        <mesh position={[0, GROUND_H / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[W * 0.88, GROUND_H, D * 0.9]} />
          <primitive object={mat.glass} attach="material" />
        </mesh>

        {/* Columnas del retranqueo — dan el pórtico del acceso */}
        {[-1, 1].map((s) => (
          <mesh
            key={s}
            position={[s * (W / 2 - 0.055), GROUND_H / 2, D * 0.26]}
            castShadow
          >
            <boxGeometry args={[0.09, GROUND_H, 0.09]} />
            <primitive object={mat.ground} attach="material" />
          </mesh>
        ))}

        {/* Núcleo de acceso — paño macizo lateral */}
        <mesh
          position={[-W * 0.28, GROUND_H / 2, D * 0.2]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[W * 0.3, GROUND_H, 0.1]} />
          <primitive object={mat.ground} attach="material" />
        </mesh>

        {/* Gran losa de transición sobre planta baja */}
        <mesh position={[0, GROUND_H, D * 0.06]} castShadow receiveShadow>
          <boxGeometry args={[W + CANTILEVER * 2, SLAB_T * 1.5, D * 0.62]} />
          <primitive object={mat.fascia} attach="material" />
        </mesh>
      </group>

      {/* ==========================================================
          MEDIANERA CIEGA — paño macizo lateral + fondo, sin aberturas.
          Es el elemento que le da la silueta característica a la torre.
          ========================================================== */}
      <mesh
        position={[W / 2 + 0.06, (totalH + PARTY_EXTRA) / 2, -D * 0.06]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.12, totalH + PARTY_EXTRA, D * 0.98]} />
        <primitive object={mat.stucco} attach="material" />
      </mesh>
      {/* Retorno de fondo */}
      <mesh
        position={[0, (totalH + PARTY_EXTRA * 0.55) / 2, -D / 2]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[W + 0.12, totalH + PARTY_EXTRA * 0.55, 0.12]} />
        <primitive object={mat.stucco} attach="material" />
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
                /* En táctil no hay hover: el primer contacto ya marca el
                   nivel para que el usuario vea cuál va a seleccionar. */
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

            {/* Paño vidriado, retirado detrás del balcón */}
            <mesh
              geometry={geo.glazing}
              position={[0, FLOOR_H * 0.42, -D * 0.06]}
              castShadow={!lite}
            >
              <meshStandardMaterial
                color={emphasised ? COL.glassLit : COL.glass}
                roughness={0.08}
                metalness={0.6}
                transparent
                opacity={dimmed ? 0.14 : emphasised ? 0.85 : 0.72}
              />
            </mesh>

            {/* Montantes verticales del vidriado */}
            {!lite &&
              [-0.32, 0, 0.32].map((f) => (
                <mesh
                  key={f}
                  position={[f * W, FLOOR_H * 0.42, D * 0.15]}
                  castShadow={false}
                >
                  <boxGeometry args={[0.016, FLOOR_H * 0.78, 0.016]} />
                  <primitive object={mat.mullion} attach="material" />
                </mesh>
              ))}

            {/* LOSA DE BALCÓN — vuela al frente y dobla hacia el lateral.
                Es el gesto dominante de la fachada. */}
            <mesh
              geometry={geo.slab}
              position={[0, 0, D * 0.16]}
              castShadow={!lite}
              receiveShadow
            >
              <meshStandardMaterial
                color={emphasised ? COL.accent : COL.slabFascia}
                roughness={0.78}
                transparent
                opacity={dimmed ? 0.3 : 1}
              />
            </mesh>
            {/* Retorno lateral de la losa (dobla la esquina) */}
            <mesh
              position={[-(W / 2 + CANTILEVER / 2), 0, -D * 0.1]}
              castShadow={!lite}
              receiveShadow
            >
              <boxGeometry args={[CANTILEVER, SLAB_T, D * 0.4]} />
              <meshStandardMaterial
                color={emphasised ? COL.accent : COL.slabFascia}
                roughness={0.78}
                transparent
                opacity={dimmed ? 0.3 : 1}
              />
            </mesh>

            {/* Baranda de vidrio frameless sobre el borde de losa */}
            <mesh
              geometry={geo.rail}
              position={[0, RAIL_H / 2 + SLAB_T / 2, D * 0.16 + D * 0.26]}
            >
              <meshStandardMaterial
                color={COL.rail}
                roughness={0.05}
                metalness={0.12}
                transparent
                opacity={dimmed ? 0.08 : 0.32}
              />
            </mesh>
            <mesh
              geometry={geo.railSide}
              position={[
                -(W / 2 + CANTILEVER - 0.01),
                RAIL_H / 2 + SLAB_T / 2,
                -D * 0.08,
              ]}
            >
              <meshStandardMaterial
                color={COL.rail}
                roughness={0.05}
                metalness={0.12}
                transparent
                opacity={dimmed ? 0.08 : 0.32}
              />
            </mesh>
          </group>
        );
      })}

      {/* ==========================================================
          PENTHOUSE — retiro superior con parapeto y vegetación
          ========================================================== */}
      <group ref={crownRef} position={[0, GROUND_H + towerH, 0]}>
        {/* Volumen retirado respecto de la línea de fachada */}
        <mesh
          position={[0, FLOOR_H * 0.5, -D * 0.14]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[W * 0.82, FLOOR_H, D * 0.5]} />
          <primitive object={mat.stucco} attach="material" />
        </mesh>
        {/* Vidriado del penthouse */}
        <mesh position={[0, FLOOR_H * 0.5, D * 0.11]}>
          <boxGeometry args={[W * 0.78, FLOOR_H * 0.7, 0.03]} />
          <primitive object={mat.glass} attach="material" />
        </mesh>
        {/* Terraza del retiro */}
        <mesh position={[0, 0.01, D * 0.24]} receiveShadow>
          <boxGeometry args={[W * 0.9, SLAB_T * 0.7, D * 0.24]} />
          <primitive object={mat.fascia} attach="material" />
        </mesh>
        {/* Jardineras — la vegetación que desborda en los renders */}
        {!lite &&
          [-0.28, 0.02, 0.3].map((f) => (
            <mesh
              key={f}
              position={[f * W, 0.075, D * 0.3]}
              castShadow
            >
              <boxGeometry args={[W * 0.24, 0.11, 0.13]} />
              <primitive object={mat.green} attach="material" />
            </mesh>
          ))}
      </group>

      {/* Parapeto / sala de máquinas — remate macizo escalonado */}
      <mesh
        ref={parapetRef}
        position={[-W * 0.1, GROUND_H + towerH + FLOOR_H + 0.16, -D * 0.2]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[W * 0.55, 0.32, D * 0.34]} />
        <primitive object={mat.stucco} attach="material" />
      </mesh>
    </group>
  );
}
