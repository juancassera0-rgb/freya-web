"use client";

import type { RefObject } from "react";
import type { PlanRoom, UnitPlan } from "@/data/planGeometry";
import type { Project3DConfig } from "@/data/project3d";
import type { QualityTier } from "./AdaptiveQuality";
import { ArchitecturalMassing } from "./ArchitecturalMassing";
import { FloorPlate3D } from "./FloorPlate3D";
import { HotspotMarkers } from "./HotspotMarkers";
import {
  SalesCenterScene,
  type SalesStage,
  type SceneHandle,
} from "./SalesCenterScene";

type Props = {
  config: Project3DConfig;
  stage: SalesStage;
  tier: QualityTier;
  touch: boolean;
  lite: boolean;
  framing: { distance: number; fov: number; targetY: number };
  active: boolean;
  /** false en táctil hasta que el usuario toca la escena */
  interactive: boolean;
  /** Publica el handle de dolly para el pinch del contenedor */
  handleRef: RefObject<SceneHandle>;
  onContextLost: () => void;

  selectedFloor: number | null;
  hoveredFloor: number | null;
  onHoverFloor: (level: number | null) => void;
  onSelectFloor: (level: number) => void;
  extractTarget: number;
  onSelectHotspot: (id: string) => void;

  plan: UnitPlan | null;
  morph: number;
  activeRoomId: string | null;
  onHoverRoom: (id: string | null) => void;
  onSelectRoom: (room: PlanRoom) => void;
};

/**
 * ÚNICA frontera de carga del subárbol 3D del explorador comercial.
 *
 * Todos los módulos que importan `three` se agrupan acá para que el bundle
 * de la ficha de proyecto no los incluya.
 */
export default function SalesCenterCanvas({
  config,
  stage,
  tier,
  touch,
  lite,
  framing,
  active,
  interactive,
  handleRef,
  onContextLost,
  selectedFloor,
  hoveredFloor,
  onHoverFloor,
  onSelectFloor,
  extractTarget,
  onSelectHotspot,
  plan,
  morph,
  activeRoomId,
  onHoverRoom,
  onSelectRoom,
}: Props) {
  return (
    <SalesCenterScene
      stage={stage}
      focusFloor={selectedFloor}
      tier={tier}
      touch={touch}
      framing={framing}
      active={active}
      interactive={interactive}
      handleRef={handleRef}
      onContextLost={onContextLost}
    >
      {stage === "unit" && plan ? (
        <FloorPlate3D
          plan={plan}
          morph={morph}
          activeRoomId={activeRoomId}
          onHoverRoom={onHoverRoom}
          onSelectRoom={onSelectRoom}
          lite={lite}
        />
      ) : (
        <>
          <ArchitecturalMassing
            config={config}
            lite={lite}
            highlightedFloor={selectedFloor}
            hoveredFloor={hoveredFloor}
            onHoverFloor={onHoverFloor}
            onSelectFloor={onSelectFloor}
            dimOthers={selectedFloor != null}
            extract={extractTarget}
            /* Sin balanceo en táctil: en un teléfono el movimiento
               autónomo se confunde con inestabilidad. */
            idleSway={false}
          />
          {!lite && stage === "building" && (
            <HotspotMarkers
              hotspots={config.hotspots}
              activeId={null}
              onSelect={onSelectHotspot}
            />
          )}
        </>
      )}
    </SalesCenterScene>
  );
}
