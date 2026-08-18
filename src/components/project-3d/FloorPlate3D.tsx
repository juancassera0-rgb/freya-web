"use client";

import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { PlanRoom, UnitPlan } from "@/data/planGeometry";
import { RoomFurniture } from "./RoomFurniture";
import { BRAND, SITE } from "./sceneTokens";
import { getConcreteMap, getConcreteNormalMap } from "./proceduralTextures";
import styles from "./FloorPlate3D.module.css";

type Props = {
  plan: UnitPlan;
  /** 0 = plano técnico plano · 1 = volumen completo. Interpolado por el slider. */
  morph: number;
  activeRoomId: string | null;
  onHoverRoom: (id: string | null) => void;
  onSelectRoom: (room: PlanRoom) => void;
  lite?: boolean;
};

/** Escala en unidades de escena para la envolvente de la unidad */
const PLATE_W = 3.2;
const WALL_H = 0.52;
const WALL_T = 0.045;

function showLabel(_id: string, hasRender: boolean, lite: boolean) {
  return lite ? hasRender : true;
}

/**
 * Colores de solado por tipo de ambiente.
 *
 * Antes eran hex sueltos en este archivo, fuera del sistema de marca. Ahora
 * salen de sceneTokens: mismos valores de familia, una sola fuente. Si se
 * cambia la paleta, la planta acompaña.
 */
const ROOM_COLORS: Record<string, string> = {
  living: SITE.soffit,
  cocina: SITE.slabFascia,
  dormitorio: SITE.soffit,
  bano: SITE.curb,
  balcon: SITE.slabFascia,
  circulacion: SITE.sidewalk,
};

/**
 * Planta volumétrica generada desde la MISMA geometría que el plano 2D.
 *
 * `morph` controla la altura de los muros: en 0 la planta se lee como
 * dibujo técnico apoyado en el piso; en 1 los muros están extruidos.
 */
export function FloorPlate3D({
  plan,
  morph,
  activeRoomId,
  onHoverRoom,
  onSelectRoom,
  lite = false,
}: Props) {
  const group = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const plateH = PLATE_W / plan.aspect;

  /**
   * MUROS: registro por Set con limpieza, no por índice incremental.
   *
   * La versión anterior usaba `wallRefs.current[wallIndex++]` con un
   * contador `let` declarado en el cuerpo del render. Eso tenía un bug
   * silencioso: React sólo vuelve a invocar el ref callback de los nodos
   * que cambian, mientras que el contador se reinicia en CADA render. Al
   * pasar el mouse por un ambiente, unos pocos callbacks se disparaban con
   * el contador en cero y sobrescribían las posiciones de otros muros; el
   * resto del array quedaba con referencias viejas. El síntoma era muros
   * que dejaban de acompañar el slider, o lo hacían a saltos.
   *
   * Un Set con función de limpieza (React 19 la soporta en ref callbacks)
   * no depende del orden ni de cuántos callbacks se disparen.
   */
  const walls = useRef<Set<THREE.Mesh>>(new Set());
  const registerWall = (n: THREE.Mesh | null) => {
    if (!n) return;
    walls.current.add(n);
    return () => {
      walls.current.delete(n);
    };
  };

  const morphNow = useRef(morph);

  const toScene = useMemo(
    () => (r: { x: number; y: number; w: number; h: number }) => ({
      cx: (r.x + r.w / 2 - 0.5) * PLATE_W,
      cz: (r.y + r.h / 2 - 0.5) * plateH,
      w: r.w * PLATE_W,
      d: r.h * plateH,
    }),
    [plateH],
  );

  /* ------------------------------------------------------------------
     MATERIALES COMPARTIDOS CON VARIANTES DE ESTADO.

     Mismo problema que tenía el edificio, y por la misma razón: los
     `<meshStandardMaterial>` estaban inline dentro del map de ambientes.
     Con seis ambientes son ~18 materiales que React reasignaba en cada
     re-render — y acá los re-renders son constantes, porque el hover sobre
     un ambiente y el arrastre del slider ambos disparan setState.

     Ahora: un material de solado por tipo de ambiente (creados una vez),
     más las variantes destacada y atenuada compartidas por todos. El
     hover elige una referencia existente.
     ------------------------------------------------------------------ */
  const mat = useMemo(() => {
    const m = (
      color: string,
      roughness: number,
      opts: Partial<THREE.MeshStandardMaterialParameters> = {},
    ) => new THREE.MeshStandardMaterial({ color, roughness, ...opts });

    /* Un solado por tipo, translúcido para que se lea el dibujo debajo */
    const floors: Record<string, THREE.MeshStandardMaterial> = {};
    for (const [kind, color] of Object.entries(ROOM_COLORS)) {
      floors[kind] = m(color, 0.9, { transparent: true, opacity: 0.75 });
    }

    /* Mismo tratamiento de hormigón que el edificio — criterio visual
       unificado entre escalas: el muro de una unidad tiene que leerse
       como el mismo material que la medianera de afuera, no otro. */
    const concreteMap = getConcreteMap();
    const concreteNormalMap = getConcreteNormalMap();
    const concreteOpts = {
      map: concreteMap,
      normalMap: concreteNormalMap,
      normalScale: new THREE.Vector2(0.6, 0.6),
      envMapIntensity: 0.35,
    };

    return {
      floors,
      floorFallback: m(SITE.sidewalk, 0.9, { transparent: true, opacity: 0.75 }),
      base: m("#e8e4dc", 0.85, concreteOpts),
      wall: m(SITE.stucco, 0.8, concreteOpts),
      wallEmph: m(SITE.soffit, 0.8, concreteOpts),
      rail: m(SITE.rail, 0.45, {
        metalness: 0.25,
        transparent: true,
        opacity: 0.55,
      }),
    };
  }, []);

  /* Solado destacado: Camo de marca — el mismo color con el que se resalta
     la losa en el edificio. La continuidad entre escalas es intencional. */
  const emphFloor = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: BRAND.camo,
        roughness: 0.9,
        transparent: true,
        opacity: 0.92,
      }),
    [],
  );

  useMemo(() => {
    return () => {
      Object.values(mat.floors).forEach((m) => m.dispose());
      mat.floorFallback.dispose();
      mat.base.dispose();
      mat.wall.dispose();
      mat.wallEmph.dispose();
      mat.rail.dispose();
      emphFloor.dispose();
    };
  }, [mat, emphFloor]);

  /* ---------- Geometrías compartidas ---------- */
  const geo = useMemo(
    () => ({
      base: new THREE.BoxGeometry(PLATE_W + 0.18, 0.06, plateH + 0.18),
    }),
    [plateH],
  );

  useMemo(() => {
    return () => Object.values(geo).forEach((g) => g.dispose());
  }, [geo]);

  useFrame((_, delta) => {
    const k = 1 - Math.exp(-6 * Math.min(delta, 0.1));
    morphNow.current += (morph - morphNow.current) * k;

    // Escala vertical de los muros desde su base
    const h = Math.max(0.001, morphNow.current);
    walls.current.forEach((wall) => {
      wall.scale.y = h;
      wall.position.y = (h * WALL_H) / 2;
    });

    if (group.current) {
      group.current.rotation.y +=
        (-0.12 - group.current.rotation.y) * (1 - Math.exp(-2.5 * delta));
    }
  });

  const wallHeight = WALL_H;

  return (
    <group ref={group} position={[0, 0, 0]}>
      {/* Losa base */}
      <mesh
        geometry={geo.base}
        material={mat.base}
        position={[0, -0.03, 0]}
        receiveShadow
        onPointerMissed={() => {
          setHovered(null);
          onHoverRoom(null);
        }}
      />

      {plan.rooms.map((room) => {
        const { cx, cz, w, d } = toScene(room);
        const isActive = activeRoomId === room.id;
        const isHovered = hovered === room.id;
        const emphasised = isActive || isHovered;
        const isBalcony = room.kind === "balcon";
        const hasRender = Boolean(room.renderSrc);

        const floorMat = emphasised
          ? emphFloor
          : (mat.floors[room.kind] ?? mat.floorFallback);
        const wallMat = emphasised ? mat.wallEmph : mat.wall;

        return (
          <group key={room.id} position={[cx, 0, cz]}>
            {/* Solado del ambiente — zona clicable */}
            <mesh
              position={[0, 0.005, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
              receiveShadow
              material={floorMat}
              onPointerDown={(e) => {
                e.stopPropagation();
                setHovered(room.id);
                onHoverRoom(room.id);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHovered(room.id);
                onHoverRoom(room.id);
              }}
              onPointerOut={() => {
                setHovered(null);
                onHoverRoom(null);
              }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectRoom(room);
              }}
            >
              <planeGeometry args={[w * 0.97, d * 0.97]} />
            </mesh>

            {/* Muros perimetrales extruidos — se elevan con el morph */}
            {!isBalcony && (
              <>
                <mesh
                  ref={registerWall}
                  position={[0, wallHeight / 2, -d / 2]}
                  castShadow
                  material={wallMat}
                >
                  <boxGeometry args={[w, wallHeight, WALL_T]} />
                </mesh>
                <mesh
                  ref={registerWall}
                  position={[-w / 2, wallHeight / 2, 0]}
                  castShadow
                  material={wallMat}
                >
                  <boxGeometry args={[WALL_T, wallHeight, d]} />
                </mesh>
              </>
            )}

            {/* Baranda del balcón */}
            {isBalcony && (
              <mesh
                ref={registerWall}
                position={[w / 2, wallHeight / 2, 0]}
                castShadow
                material={mat.rail}
              >
                <boxGeometry args={[WALL_T * 0.6, wallHeight, d]} />
              </mesh>
            )}

            {/* Mobiliario: aparece cuando los muros empiezan a levantarse,
                para que la planta se lea habitada. */}
            {!lite && morph > 0.3 && (
              <RoomFurniture
                room={room}
                w={w}
                d={d}
                visible
                dim={Boolean(activeRoomId) && !emphasised}
              />
            )}

            {/* Etiqueta del ambiente. Cada <Html> es un nodo DOM
                reposicionado por frame vía proyección de matriz. */}
            {showLabel(room.id, hasRender, lite) && morph > 0.25 && (
              <Html
                position={[0, WALL_H + 0.12, 0]}
                center
                distanceFactor={9}
                zIndexRange={[15, 0]}
                occlude={false}
                style={{ pointerEvents: "none" }}
              >
                <span
                  className={styles.tag}
                  data-active={emphasised ? "true" : "false"}
                  data-render={hasRender ? "true" : "false"}
                >
                  {room.label}
                  {hasRender ? <em className={styles.tagDot} /> : null}
                </span>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}
