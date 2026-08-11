"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Project3DConfig, ProjectUnit } from "@/data/project3d";
import { getUnitsForFloor } from "@/data/project3d";
import { ArchitecturalMassing } from "./ArchitecturalMassing";
import { HotspotMarkers } from "./HotspotMarkers";
import { ApartmentViewer } from "./ApartmentViewer";
import { usePerfFlags } from "./useClientFlags";
import styles from "./BuildingExplorer.module.css";

const Project3DScene = dynamic(
  () => import("./Project3DScene").then((m) => m.Project3DScene),
  {
    ssr: false,
    loading: () => <div className={styles.loading}>Cargando escena…</div>,
  },
);

type Props = {
  config: Project3DConfig;
  projectName: string;
};

type AptMode = "plan" | "3d";

const STATUS_SHORT: Record<ProjectUnit["status"], string> = {
  disponible: "Disp.",
  reservado: "Res.",
  vendido: "Vend.",
};

/**
 * Explorador interactivo: orbit → piso → unidad → plano/3D + hotspots + CTA.
 */
export function BuildingExplorer({ config, projectName }: Props) {
  const rootRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const { reducedMotion, lite, webglOk } = usePerfFlags();

  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [exploded, setExploded] = useState(false);
  const [aptMode, setAptMode] = useState<AptMode>("plan");
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setInView(true);
      },
      { rootMargin: "120px", threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const floorUnits = useMemo(
    () =>
      selectedFloor != null ? getUnitsForFloor(config, selectedFloor) : [],
    [config, selectedFloor],
  );

  const selectedUnit = useMemo(
    () => config.units.find((u) => u.id === selectedUnitId) ?? null,
    [config.units, selectedUnitId],
  );

  const hotspot = useMemo(
    () => config.hotspots.find((h) => h.id === activeHotspot) ?? null,
    [config.hotspots, activeHotspot],
  );

  const showCanvas = inView && webglOk && !reducedMotion;

  function selectFloor(level: number) {
    setSelectedFloor((prev) => {
      if (prev === level) {
        setSelectedUnitId(null);
        return null;
      }
      setSelectedUnitId(null);
      setAptMode("plan");
      return level;
    });
    setActiveHotspot(null);
  }

  function selectUnit(id: string) {
    setSelectedUnitId(id);
    setAptMode("plan");
    setActiveHotspot(null);
  }

  const asesorBase = `/asesor?proyecto=${config.projectSlug}`;
  const asesorHref = selectedUnit
    ? `${asesorBase}&unidad=${encodeURIComponent(selectedUnit.code)}&piso=${selectedUnit.floor}`
    : selectedFloor
      ? `${asesorBase}&piso=${selectedFloor}`
      : asesorBase;

  return (
    <section
      ref={rootRef}
      className={styles.root}
      aria-label={`Explorador 3D — ${projectName}`}
    >
      <div className={styles.stage} data-cursor={lite ? undefined : "Orbitar"}>
        {showCanvas ? (
          <Project3DScene
            config={config}
            controlMode="orbit"
            variant="studio"
            performanceMode={lite ? "lite" : "full"}
            enablePointerParallax={false}
          >
            {config.status === "placeholder" || !config.modelUrl ? (
              <ArchitecturalMassing
                config={config}
                highlightedFloor={selectedFloor}
                explode={exploded ? 1 : 0}
                selectedUnitId={selectedUnitId}
                dimOthers={Boolean(selectedFloor || selectedUnitId)}
                lite={lite}
              />
            ) : null}
            {!lite && (
              <HotspotMarkers
                hotspots={config.hotspots}
                activeId={activeHotspot}
                onSelect={(id) => {
                  setActiveHotspot((prev) => (prev === id ? null : id));
                  setSelectedUnitId(null);
                }}
              />
            )}
          </Project3DScene>
        ) : (
          <div className={styles.fallback}>
            <p>
              {reducedMotion
                ? "Vista 3D desactivada por preferencia de movimiento reducido. Podés elegir piso y unidad en el panel."
                : !webglOk
                  ? "WebGL no disponible en este dispositivo. Usá el panel para explorar tipologías."
                  : "La escena 3D se carga al entrar en vista."}
            </p>
          </div>
        )}

        {config.status === "placeholder" && (
          <p className={styles.badge} role="status">
            {config.placeholderNote}
          </p>
        )}

        {hotspot && (
          <aside className={styles.hotspotPanel} aria-live="polite">
            <p className={styles.hotspotKind}>{hotspot.kind}</p>
            <h3>{hotspot.label}</h3>
            {hotspot.body ? <p>{hotspot.body}</p> : null}
            <button
              type="button"
              className={styles.hotspotClose}
              onClick={() => setActiveHotspot(null)}
            >
              Cerrar
            </button>
          </aside>
        )}

        <p className={styles.orbitHint} aria-hidden={lite ? "true" : undefined}>
          {lite ? "Tocá un piso en el panel" : "Arrastrá para orbitar · scroll para zoom"}
        </p>
      </div>

      <div className={styles.sidebar}>
        <p className={styles.eyebrow}>Explorador del proyecto</p>
        <h2 className={styles.title}>{projectName}</h2>
        <p className={styles.lead}>
          Elegí un piso, abrí una unidad y consultá con un asesor. La masa 3D es
          esquemática hasta el GLB oficial.
        </p>

        <div className={styles.tools}>
          <button
            type="button"
            className={styles.toolBtn}
            data-active={exploded ? "true" : "false"}
            onClick={() => setExploded((v) => !v)}
          >
            {exploded ? "Vista compacta" : "Vista explotada"}
          </button>
          {(selectedFloor || selectedUnitId) && (
            <button
              type="button"
              className={styles.toolBtn}
              onClick={() => {
                setSelectedFloor(null);
                setSelectedUnitId(null);
                setExploded(false);
              }}
            >
              Reiniciar
            </button>
          )}
        </div>

        <div className={styles.floors} role="list" aria-label="Pisos">
          {config.floors.map((floor) => (
            <button
              key={floor.level}
              type="button"
              role="listitem"
              className={styles.floorBtn}
              data-active={selectedFloor === floor.level ? "true" : "false"}
              onClick={() => selectFloor(floor.level)}
            >
              <span>{floor.label}</span>
              <span className={styles.floorMeta}>
                {floor.unitIds.length} unid.
              </span>
            </button>
          ))}
        </div>

        {selectedFloor != null && (
          <div className={styles.unitsBlock}>
            <p className={styles.blockLabel}>Unidades · piso {selectedFloor}</p>
            <div className={styles.units} role="list">
              {floorUnits.map((unit) => (
                <button
                  key={unit.id}
                  type="button"
                  role="listitem"
                  className={styles.unitBtn}
                  data-active={selectedUnitId === unit.id ? "true" : "false"}
                  data-status={unit.status}
                  onClick={() => selectUnit(unit.id)}
                >
                  <span className={styles.unitCode}>{unit.code}</span>
                  <span className={styles.unitMeta}>
                    {unit.surfaceM2} m² · {STATUS_SHORT[unit.status]}
                  </span>
                </button>
              ))}
            </div>
            {config.inventoryNote ? (
              <p className={styles.demoNote}>{config.inventoryNote}</p>
            ) : null}
          </div>
        )}

        {selectedUnit ? (
          <ApartmentViewer
            unit={selectedUnit}
            mode={aptMode}
            onModeChange={setAptMode}
            projectSlug={config.projectSlug}
            inventoryNote={config.inventoryNote}
          />
        ) : (
          <Link className={styles.cta} href={asesorHref}>
            {selectedFloor
              ? `Consultar piso ${selectedFloor}`
              : "Hablar con un asesor"}
            <span aria-hidden>→</span>
          </Link>
        )}
      </div>
    </section>
  );
}
