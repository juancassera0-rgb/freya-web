"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { PlanRoom } from "@/data/planGeometry";
import { SITE } from "./sceneTokens";

type Props = {
  room: PlanRoom;
  /** Dimensiones del ambiente en unidades de escena */
  w: number;
  d: number;
  /** 0→1: acompaña la elevación de muros del morph */
  visible: boolean;
  dim: boolean;
};

/**
 * MATERIALES A NIVEL DE MÓDULO — compartidos por TODOS los ambientes.
 *
 * Dos problemas de la versión anterior, los dos con síntoma visible:
 *
 * 1. Los materiales se creaban con `useMemo` DENTRO del componente. Como
 *    hay un RoomFurniture por ambiente, cada planta creaba cinco materiales
 *    por ambiente: unos treinta materiales para mostrar sillas y camas que
 *    comparten exactamente el mismo aspecto. Ahora son cinco en total,
 *    creados la primera vez que se monta un mobiliario y reutilizados por
 *    toda la planta y por todas las unidades que se abran después.
 *
 * 2. Todos llevaban `transparent: true` de forma permanente, sólo para
 *    poder atenuarlos cuando otro ambiente está seleccionado. Un material
 *    transparente sale del camino rápido del renderer: se ordena por
 *    profundidad en cada frame y no escribe en el depth buffer. Estaba
 *    pagando ese costo el 100% del tiempo para una atenuación que ocurre
 *    parte del tiempo. Ahora hay dos juegos —opaco y atenuado— y se elige
 *    por referencia.
 *
 * Además desaparece la mutación de materiales durante el render
 * (`mats.forEach(m => m.opacity = op)`), que además de ser un efecto
 * secundario en el cuerpo del render, al compartirse los materiales habría
 * hecho que el último ambiente en renderizar impusiera su opacidad a todos.
 */
type FurnitureMats = {
  soft: THREE.MeshStandardMaterial;
  wood: THREE.MeshStandardMaterial;
  light: THREE.MeshStandardMaterial;
  accent: THREE.MeshStandardMaterial;
  plant: THREE.MeshStandardMaterial;
};

let SOLID: FurnitureMats | null = null;
let DIMMED: FurnitureMats | null = null;

function buildMats(dim: boolean): FurnitureMats {
  const m = (color: string, roughness = 0.85) =>
    new THREE.MeshStandardMaterial({
      color,
      roughness,
      transparent: dim,
      opacity: dim ? 0.25 : 1,
      depthWrite: !dim,
    });
  return {
    soft: m(SITE.slabFascia), // tapizados, colchón
    wood: m(SITE.trunk, 0.7), // maderas
    light: m(SITE.stucco), // ropa de cama, mesada
    accent: m(SITE.glass, 0.4), // detalles
    plant: m(SITE.foliageMid, 0.9), // verde de interior
  };
}

function getMats(dim: boolean): FurnitureMats {
  if (dim) {
    DIMMED ??= buildMats(true);
    return DIMMED;
  }
  SOLID ??= buildMats(false);
  return SOLID;
}

/**
 * GEOMETRÍAS COMPARTIDAS.
 *
 * El mobiliario son cajas escaladas. Antes cada mueble declaraba su propio
 * `<boxGeometry args={[...]}>`, así que una planta de seis ambientes creaba
 * unas cuarenta geometrías distintas para dibujar cuarenta cajas. Ahora
 * todas usan UNA caja unitaria y un cilindro unitario, y las dimensiones
 * pasan a ser `scale`. El resultado es idéntico en pantalla y el renderer
 * puede reutilizar el buffer.
 */
const BOX = new THREE.BoxGeometry(1, 1, 1);
const CYL = new THREE.CylinderGeometry(1, 1, 1, 10);
const SPH = new THREE.SphereGeometry(1, 8, 6);

/**
 * Mobiliario esquemático por ambiente.
 *
 * No busca detalle: busca que la planta se lea HABITADA. Un living con un
 * sofá y una mesa comunica escala y uso mucho mejor que un rectángulo
 * vacío, y de paso hace creíble la superficie declarada.
 */
export function RoomFurniture({ room, w, d, visible, dim }: Props) {
  const mats = useMemo(() => getMats(dim), [dim]);

  if (!visible) return null;

  const H = 0.02; // altura base de piso

  /** Caja: posición + dimensiones, sobre la geometría unitaria compartida */
  const box = (
    key: string | number,
    pos: [number, number, number],
    size: [number, number, number],
    material: THREE.Material,
    shadow = true,
  ) => (
    <mesh
      key={key}
      geometry={BOX}
      material={material}
      position={pos}
      scale={size}
      castShadow={shadow}
    />
  );

  switch (room.kind) {
    case "living":
      return (
        <group>
          {/* Sofá en L contra el muro */}
          {box("sofa", [-w * 0.2, H + 0.045, -d * 0.22], [w * 0.42, 0.09, d * 0.2], mats.soft)}
          {box("sofa-b", [-w * 0.2, H + 0.1, -d * 0.31], [w * 0.42, 0.09, 0.03], mats.soft)}
          {/* Mesa ratona */}
          {box("coffee", [-w * 0.2, H + 0.03, 0], [w * 0.22, 0.025, d * 0.14], mats.wood)}
          {/* Mesa de comedor + cuatro sillas */}
          {box("table", [w * 0.24, H + 0.055, d * 0.16], [w * 0.3, 0.028, d * 0.24], mats.wood)}
          {[
            [-0.11, 0.09],
            [0.11, 0.09],
            [-0.11, -0.09],
            [0.11, -0.09],
          ].map(([ox, oz], i) =>
            box(
              `chair-${i}`,
              [w * 0.24 + ox * w, H + 0.035, d * 0.16 + oz * d],
              [0.07, 0.07, 0.07],
              mats.soft,
            ),
          )}
          {/* Alfombra */}
          {box(
            "rug",
            [-w * 0.2, H + 0.001, -d * 0.02],
            [w * 0.46, 0.004, d * 0.3],
            mats.light,
            false,
          )}
          {/* Planta de interior */}
          <mesh
            geometry={SPH}
            material={mats.plant}
            position={[w * 0.4, H + 0.07, -d * 0.3]}
            scale={0.06}
            castShadow
          />
        </group>
      );

    case "dormitorio":
      return (
        <group>
          {/* Cama */}
          {box("bed", [0, H + 0.038, -d * 0.06], [w * 0.44, 0.076, d * 0.5], mats.soft)}
          {/* Almohadas */}
          {box("pillow", [0, H + 0.085, -d * 0.26], [w * 0.4, 0.022, d * 0.09], mats.light)}
          {/* Respaldo */}
          {box("head", [0, H + 0.09, -d * 0.33], [w * 0.48, 0.11, 0.02], mats.wood)}
          {/* Mesa de luz */}
          {box("night", [w * 0.3, H + 0.03, -d * 0.28], [0.07, 0.06, 0.07], mats.wood)}
          {/* Placard */}
          {box("closet", [-w * 0.36, H + 0.11, d * 0.22], [w * 0.16, 0.22, d * 0.28], mats.light)}
        </group>
      );

    case "cocina":
      return (
        <group>
          {/* Mesada corrida */}
          {box("counter", [0, H + 0.05, -d * 0.28], [w * 0.72, 0.1, d * 0.16], mats.light)}
          {/* Alacena */}
          {box("upper", [0, H + 0.2, -d * 0.32], [w * 0.6, 0.09, d * 0.1], mats.wood)}
          {/* Isla / desayunador */}
          {box("island", [0, H + 0.045, d * 0.12], [w * 0.36, 0.09, d * 0.14], mats.wood)}
          {/* Banquetas */}
          {[-0.1, 0.1].map((ox, i) => (
            <mesh
              key={`stool-${i}`}
              geometry={CYL}
              material={mats.accent}
              position={[ox * w, H + 0.03, d * 0.3]}
              scale={[0.028, 0.06, 0.028]}
              castShadow
            />
          ))}
        </group>
      );

    case "bano":
      return (
        <group>
          {/* Bañera */}
          {box("tub", [-w * 0.22, H + 0.03, 0], [w * 0.3, 0.06, d * 0.55], mats.light)}
          {/* Vanitory */}
          {box("vanity", [w * 0.26, H + 0.04, -d * 0.18], [w * 0.26, 0.08, d * 0.16], mats.wood)}
          {/* Inodoro */}
          {box("wc", [w * 0.26, H + 0.03, d * 0.22], [0.07, 0.06, 0.09], mats.light)}
        </group>
      );

    case "balcon":
      return (
        <group>
          {/* Mesa exterior */}
          <mesh
            geometry={CYL}
            material={mats.wood}
            position={[0, H + 0.035, -d * 0.15]}
            scale={[0.07, 0.05, 0.07]}
            castShadow
          />
          {/* Sillas */}
          {[-0.12, 0.12].map((oz, i) =>
            box(
              `out-chair-${i}`,
              [0, H + 0.03, -d * 0.15 + oz * d],
              [0.06, 0.06, 0.06],
              mats.accent,
            ),
          )}
          {/* Macetas — el verde que se ve desde afuera */}
          {[-0.3, 0.28].map((oz, i) => (
            <mesh
              key={`pot-${i}`}
              geometry={SPH}
              material={mats.plant}
              position={[0, H + 0.06, oz * d]}
              scale={0.055}
              castShadow
            />
          ))}
        </group>
      );

    default:
      return null;
  }
}
