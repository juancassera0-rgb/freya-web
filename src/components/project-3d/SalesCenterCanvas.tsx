"use client";

import type { PlanRoom, UnitPlan } from "@/data/planGeometry";
import type { Project3DConfig } from "@/data/project3d";
import type { QualityTier } from "./AdaptiveQuality";
import { ArchitecturalMassing } from "./ArchitecturalMassing";
import { FloorPlate3D } from "./FloorPlate3D";
import { HotspotMarkers } from "./HotspotMarkers";
import { SalesCenterScene, type SalesStage } from "./SalesCenterScene";

type Props = {
  config: Project3DConfig;
  stage: SalesStage;
  tier: QualityTier;
  touch: boolean;
  lite: boolean;
  active: boolean;
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
 * de la ficha de proyecto no los incluya: se descargan recién cuando la
 * sección se acerca al viewport.
 */
export default function SalesCenterCanvas({
  config,
  stage,
  tier,
  touch,
  lite,
  active,
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
      active={active}
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
