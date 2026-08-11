"use client";

import { Html } from "@react-three/drei";
import type { ProjectHotspot } from "@/data/project3d";
import styles from "./HotspotMarkers.module.css";

type Props = {
  hotspots: ProjectHotspot[];
  activeId: string | null;
  onSelect: (id: string) => void;
};

export function HotspotMarkers({ hotspots, activeId, onSelect }: Props) {
  return (
    <group>
      {hotspots.map((h) => {
        const active = activeId === h.id;
        return (
          <Html
            key={h.id}
            position={h.position}
            center
            distanceFactor={8}
            zIndexRange={[20, 0]}
            style={{ pointerEvents: "auto" }}
          >
            <button
              type="button"
              className={styles.hotspot}
              data-active={active ? "true" : "false"}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(h.id);
              }}
            >
              <span className={styles.dot} aria-hidden />
              <span className={styles.label}>{h.label}</span>
            </button>
          </Html>
        );
      })}
    </group>
  );
}
