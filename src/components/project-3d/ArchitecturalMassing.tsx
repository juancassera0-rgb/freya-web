"use client";

import { useFrame } from "@react-three/fiber";
import { Instance, Instances } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { Project3DConfig } from "@/data/project3d";

type Props = {
  config: Project3DConfig;
  /** 0 = compacto, 1 = pisos totalmente separados (exploded) */
  explode?: number;
  highlightedFloor?: number | null;
  selectedUnitId?: string | null;
  dimOthers?: boolean;
  /** Reduce detalle en móvil */
  lite?: boolean;
};

const W = 2.2;
const D = 1.55;
const FLOOR_H = 0.42;
const BASE_H = 0.42;

/**
 * Massing arquitectónico procedural: losas, montantes de fachada, núcleo
 * vertical, balcones y planta baja vidriada.
 *
 * Es una representación CONCEPTUAL de la volumetría —no la geometría real
 * del edificio— y así se comunica en la UI. Sustituible por el GLB oficial.
 *
 * Los montantes usan instancing: ~90 elementos en 1 draw call.
 */
export function ArchitecturalMassing({
  config,
  explode = 0,
  highlightedFloor = null,
  selectedUnitId = null,
  dimOthers = false,
  lite = false,
}: Props) {
  const group = useRef<THREE.Group>(null);
  const floors = config.schematicFloors;
  const gap = explode * 0.3;

  const selectedUnit = selectedUnitId
    ? config.units.find((u) => u.id === selectedUnitId)
    : null;

  // Materiales compartidos — evita recrearlos por frame
  const materials = useMemo(() => {
    const slab = new THREE.MeshStandardMaterial({
      color: "#e8e4dc",
      roughness: 0.72,
      metalness: 0.02,
    });
    const mullion = new THREE.MeshStandardMaterial({
      color: "#4f4c37",
      roughness: 0.5,
      metalness: 0.25,
    });
    const glass = new THREE.MeshStandardMaterial({
      color: "#b8c4c8",
      roughness: 0.12,
      metalness: 0.55,
      transparent: true,
      opacity: 0.42,
    });
    const core = new THREE.MeshStandardMaterial({
      color: "#d4d0c6",
      roughness: 0.88,
    });
    return { slab, mullion, glass, core };
  }, []);

  const mullionPositions = useMemo(() => {
    const cols = lite ? 5 : 8;
    const out: [number, number, number][] = [];
    for (let f = 0; f < floors; f++) {
      for (let c = 0; c <= cols; c++) {
        const x = -W / 2 + (c / cols) * W;
        out.push([x, f, D / 2 + 0.01]);
      }
    }
    return out;
  }, [floors, lite]);

  useFrame((state) => {
    if (!group.current) return;
    // Respiración mínima — presencia, no rotación de demo
    group.current.rotation.y =
      Math.sin(state.clock.elapsedTime * 0.06) * 0.012;
  });

  const floorY = (level: number) =>
    BASE_H + (level - 0.5) * FLOOR_H + gap * (level - 1);

  return (
    <group ref={group}>
      {/* Planta baja — zócalo vidriado, más alto y retranqueado */}
      <mesh position={[0, BASE_H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[W * 0.94, BASE_H, D * 0.94]} />
        <primitive object={materials.glass} attach="material" />
      </mesh>
      <mesh position={[0, BASE_H, 0]} castShadow receiveShadow>
        <boxGeometry args={[W + 0.16, 0.05, D + 0.16]} />
        <primitive object={materials.slab} attach="material" />
      </mesh>

      {/* Núcleo vertical — circulación, ancla el volumen al separarse */}
      <mesh
        position={[-W * 0.3, BASE_H + (floors * FLOOR_H) / 2, -D * 0.22]}
        castShadow
      >
        <boxGeometry
          args={[W * 0.26, floors * FLOOR_H + gap * (floors - 1), D * 0.4]}
        />
        <primitive object={materials.core} attach="material" />
      </mesh>

      {/* Losas por piso */}
      {Array.from({ length: floors }, (_, i) => {
        const level = i + 1;
        const y = floorY(level);
        const active = highlightedFloor === level;
        const isSelectedFloor = selectedUnit?.floor === level;
        const emphasised = active || isSelectedFloor;
        const dimmed = dimOthers && !emphasised;

        return (
          <group key={level} position={[0, y, 0]}>
            {/* Losa — canto expresado, gesto arquitectónico */}
            <mesh castShadow receiveShadow>
              <boxGeometry args={[W + 0.1, 0.055, D + 0.1]} />
              <meshStandardMaterial
                color={emphasised ? "#4f4c37" : "#e8e4dc"}
                roughness={0.7}
                transparent
                opacity={dimmed ? 0.22 : 1}
              />
            </mesh>

            {/* Vidriado del piso */}
            <mesh position={[0, FLOOR_H * 0.42, 0]}>
              <boxGeometry args={[W * 0.97, FLOOR_H * 0.74, D * 0.97]} />
              <meshStandardMaterial
                color={emphasised ? "#8a8663" : "#b8c4c8"}
                roughness={0.14}
                metalness={0.5}
                transparent
                opacity={dimmed ? 0.08 : emphasised ? 0.55 : 0.34}
              />
            </mesh>

            {/* Balcón al frente — sombra propia, da escala */}
            <mesh
              position={[W * 0.12, 0.03, D / 2 + 0.16]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[W * 0.5, 0.04, 0.3]} />
              <meshStandardMaterial
                color="#d4d0c6"
                roughness={0.85}
                transparent
                opacity={dimmed ? 0.2 : 0.95}
              />
            </mesh>
            {/* Baranda del balcón */}
            <mesh position={[W * 0.12, 0.13, D / 2 + 0.3]}>
              <boxGeometry args={[W * 0.5, 0.16, 0.012]} />
              <meshStandardMaterial
                color="#4f4c37"
                roughness={0.4}
                metalness={0.3}
                transparent
                opacity={dimmed ? 0.15 : 0.6}
              />
            </mesh>
          </group>
        );
      })}

      {/* Montantes de fachada — instanced, 1 draw call */}
      <Instances
        limit={mullionPositions.length}
        castShadow={!lite}
        material={materials.mullion}
      >
        <boxGeometry args={[0.022, FLOOR_H * 0.88, 0.022]} />
        {mullionPositions.map(([x, f, z], i) => (
          <Instance
            key={i}
            position={[x, floorY(f + 1) + FLOOR_H * 0.42, z]}
          />
        ))}
      </Instances>
    </group>
  );
}
