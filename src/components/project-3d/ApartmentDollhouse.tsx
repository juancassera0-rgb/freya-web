"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { ProjectUnit } from "@/data/project3d";
import * as THREE from "three";

type Props = {
  unit: ProjectUnit;
};

/** Maqueta isométrica del departamento — placeholder hasta GLB interior. */
export function ApartmentDollhouse({ unit }: Props) {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!group.current) return;
    group.current.rotation.y =
      Math.PI * 0.2 + Math.sin(state.clock.elapsedTime * 0.2) * 0.08;
  });

  const depth = unit.surfaceM2 > 180 ? 1.35 : 1.15;

  return (
    <group ref={group} position={[0, 0.2, 0]} rotation={[0.35, 0.4, 0]}>
      {/* Placa base */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <boxGeometry args={[2.2, 0.06, depth]} />
        <meshStandardMaterial color="#e6e3d8" roughness={0.9} />
      </mesh>
      {/* Muros bajos estilo dollhouse */}
      <mesh position={[0, 0.35, -depth / 2]}>
        <boxGeometry args={[2.2, 0.7, 0.05]} />
        <meshStandardMaterial color="#4f4c37" transparent opacity={0.55} />
      </mesh>
      <mesh position={[-1.1, 0.35, 0]}>
        <boxGeometry args={[0.05, 0.7, depth]} />
        <meshStandardMaterial color="#4f4c37" transparent opacity={0.4} />
      </mesh>
      {/* Divisiones: living / dorms */}
      <mesh position={[0.15, 0.32, 0.1]}>
        <boxGeometry args={[0.04, 0.55, depth * 0.7]} />
        <meshStandardMaterial color="#c4b79a" transparent opacity={0.7} />
      </mesh>
      <mesh position={[-0.35, 0.28, 0.05]}>
        <boxGeometry args={[0.9, 0.08, 0.7]} />
        <meshStandardMaterial color="#d4d0c6" />
      </mesh>
      {/* Balcón */}
      <mesh position={[0, 0.12, depth / 2 + 0.18]}>
        <boxGeometry args={[1.4, 0.05, 0.35]} />
        <meshStandardMaterial color="#c4b79a" transparent opacity={0.8} />
      </mesh>
    </group>
  );
}
