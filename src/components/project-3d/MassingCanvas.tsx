"use client";

import type { RefObject } from "react";
import type { Project3DConfig } from "@/data/project3d";
import type { QualityTier } from "./AdaptiveQuality";
import { ArchitecturalMassing } from "./ArchitecturalMassing";
import { Project3DScene } from "./Project3DScene";

type Props = {
  config: Project3DConfig;
  variant: "hero" | "studio";
  tier: QualityTier;
  touch: boolean;
  lite: boolean;
  framing?: { distance: number; fov: number; targetY: number };
  active: boolean;
  cameraProgressRef?: RefObject<number>;
  explodeRef?: RefObject<number>;
  highlightedFloor?: number | null;
  dimOthers?: boolean;
  enablePointerParallax?: boolean;
};

/**
 * ÚNICA frontera de carga del subárbol 3D para hero, story y recorrido.
 *
 * Todo lo que importa `three` vive detrás de este módulo, que se carga con
 * `dynamic({ ssr: false })`. Antes `ArchitecturalMassing` se importaba de
 * forma estática desde las secciones, lo que arrastraba Three.js (~860 KB)
 * al bundle de la página aunque el canvas nunca llegara a montarse.
 */
export default function MassingCanvas({
  config,
  variant,
  tier,
  touch,
  lite,
  framing,
  active,
  cameraProgressRef,
  explodeRef,
  highlightedFloor = null,
  dimOthers = false,
  enablePointerParallax = true,
}: Props) {
  return (
    <Project3DScene
      config={config}
      variant={variant}
      controlMode="cinematic"
      cameraProgressRef={cameraProgressRef}
      performanceMode={lite ? "lite" : "full"}
      tier={tier}
      touch={touch}
      framing={framing}
      enablePointerParallax={enablePointerParallax}
      active={active}
    >
      <ArchitecturalMassing
        config={config}
        lite={lite}
        explodeRef={explodeRef}
        highlightedFloor={highlightedFloor}
        dimOthers={dimOthers}
        idleSway={false}
      />
    </Project3DScene>
  );
}
