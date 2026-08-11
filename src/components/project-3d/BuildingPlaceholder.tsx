"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { Project3DConfig } from "@/data/project3d";

type Props = {
  config: Project3DConfig;
  highlightedFloor?: number | null;
  exploded?: boolean;
  selectedUnitId?: string | null;
  dimOthers?: boolean;
};

/**
 * Masa esquemática — NO es el edificio real.
 * Soporta highlight de piso, exploded view y unidad seleccionada.
 */
export function BuildingPlaceholder({
  config,
  highlightedFloor = null,
  exploded = false,
  selectedUnitId = null,
  dimOthers = false,
}: Props) {
  const group = useRef<THREE.Group>(null);
  const floorCount = config.schematicFloors;
  const floorHeight = 0.42;
  const baseHeight = 0.35;
  const width = 2.2;
  const depth = 1.55;
  const gap = exploded ? 0.28 : 0;

  const selectedUnit = selectedUnitId
    ? config.units.find((u) => u.id === selectedUnitId)
    : null;

  const edges = useMemo(() => {
    const totalH = baseHeight + floorCount * floorHeight;
    return new THREE.EdgesGeometry(new THREE.BoxGeometry(width, totalH, depth));
  }, [floorCount, floorHeight, baseHeight, width, depth]);

  useFrame((state) => {
    if (!group.current) return;
    group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.08) * 0.015;
  });

  const totalH = baseHeight + floorCount * floorHeight + gap * (floorCount - 1);

  return (
    <group ref={group} position={[0, 0, 0]}>
      {!exploded && (
        <>
          <mesh position={[0, totalH / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[width, totalH, depth]} />
            <meshStandardMaterial
              color="#e8e4dc"
              roughness={0.85}
              metalness={0.05}
              transparent
              opacity={dimOthers ? 0.35 : 0.92}
            />
          </mesh>
          <lineSegments position={[0, totalH / 2, 0]} geometry={edges}>
            <lineBasicMaterial color="#4f4c37" transparent opacity={0.55} />
          </lineSegments>
        </>
      )}

      {Array.from({ length: floorCount }, (_, i) => {
        const level = i + 1;
        const y =
          baseHeight +
          (level - 0.5) * floorHeight +
          gap * (level - 1);
        const active = highlightedFloor === level;
        const isSelectedFloor = selectedUnit?.floor === level;

        return (
          <group key={level} position={[0, y, 0]}>
            <mesh>
              <boxGeometry
                args={[
                  width + (exploded ? 0.08 : 0.02),
                  exploded ? floorHeight * 0.85 : 0.03,
                  depth + (exploded ? 0.08 : 0.02),
                ]}
              />
              <meshStandardMaterial
                color={
                  isSelectedFloor || active ? "#4f4c37" : exploded ? "#ebe8df" : "#c4b79a"
                }
                transparent
                opacity={
                  dimOthers && !isSelectedFloor && !active
                    ? 0.18
                    : active || isSelectedFloor
                      ? 0.9
                      : exploded
                        ? 0.75
                        : 0.35
                }
                roughness={0.7}
              />
            </mesh>

            {/* Unidades demo en exploded: dos volúmenes por piso */}
            {exploded &&
              config.units
                .filter((u) => u.floor === level)
                .map((unit, ui) => {
                  const selected = unit.id === selectedUnitId;
                  const x = ui === 0 ? -0.45 : 0.45;
                  return (
                    <mesh key={unit.id} position={[x, 0, 0.15]}>
                      <boxGeometry args={[0.85, floorHeight * 0.7, depth * 0.7]} />
                      <meshStandardMaterial
                        color={selected ? "#4f4c37" : "#d4d0c6"}
                        transparent
                        opacity={
                          selectedUnitId && !selected ? 0.2 : selected ? 0.95 : 0.65
                        }
                        roughness={0.65}
                      />
                    </mesh>
                  );
                })}
          </group>
        );
      })}

      <mesh position={[0, baseHeight / 2, 0.08]}>
        <boxGeometry args={[width + 0.25, baseHeight, depth + 0.2]} />
        <meshStandardMaterial color="#d4d0c6" roughness={0.9} />
      </mesh>
    </group>
  );
}
