"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  buildUnitPlan,
  roomsWithRenders,
  type PlanRoom,
} from "@/data/planGeometry";
import {
  getUnitsForFloor,
  type Project3DConfig,
  type ProjectUnit,
} from "@/data/project3d";
import { PlanSVG } from "./PlanSVG";
import { RenderViewer } from "./RenderViewer";
import { SceneTouchGate } from "./SceneTouchGate";
import { usePerfFlags } from "./useClientFlags";
import { useCanvasActive } from "./useCanvasActive";
import { useSceneTouch } from "./useSceneTouch";
import { useStableStageSize } from "./useStableStageSize";
import { FRAMING, useViewportClass } from "./useViewportClass";
import type { SalesStage, SceneHandle } from "./SalesCenterScene";
import styles from "./DigitalSalesCenter.module.css";

/**
 * Todo el 3D detrás de una sola importación dinámica: Three.js y drei no
 * entran al bundle de la ficha, se descargan al acercarse la sección.
 */
const SalesCenterCanvas = dynamic(() => import("./SalesCenterCanvas"), {
  ssr: false,
  loading: () => <div className={styles.canvasLoading} />,
});

type Props = {
  config: Project3DConfig;
  projectName: string;
};

const STATUS_LABEL: Record<ProjectUnit["status"], string> = {
  disponible: "Disponible",
  reservado: "Reservado",
  vendido: "Vendido",
};

/**
 * Explorador comercial completo: edificio → piso → unidad → espacio → render.
 *
 * Una sola escena WebGL sostiene las tres etapas, por eso las transiciones
 * son continuas.
 *
 * ---------------------------------------------------------------------
 * MÓVIL — tres piezas nuevas, cada una resolviendo un síntoma concreto:
 *
 * · useSceneTouch      intercepta los gestos de iOS antes que Safari, así
 *                      el pinch acerca la cámara en vez de zoomear la
 *                      página. Es el arreglo del "se acerca solo".
 * · useStableStageSize fija la altura del contenedor, para que la barra de
 *                      direcciones no redimensione el canvas al scrollear.
 * · SceneTouchGate     hace explícito quién tiene el gesto: hasta que el
 *                      usuario toca la escena, el dedo scrollea.
 * ---------------------------------------------------------------------
 */
export function DigitalSalesCenter({ config, projectName }: Props) {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  /** Handle imperativo del dolly, publicado desde dentro del Canvas */
  const sceneHandle = useRef<SceneHandle>(null);

  const { reducedMotion, lite, touch, tier, webglOk } = usePerfFlags();
  const framing = FRAMING[useViewportClass()];

  const { mounted, active } = useCanvasActive(rootRef);
  const [stage, setStage] = useState<SalesStage>("building");
  const [hoveredFloor, setHoveredFloor] = useState<number | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [morph, setMorph] = useState(0.35);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [viewerRoom, setViewerRoom] = useState<PlanRoom | null>(null);
  const [contextLost, setContextLost] = useState(false);

  /**
   * ¿La escena tiene el gesto?
   * En puntero fino, siempre. En táctil sólo tras un tap explícito.
   */
  const [touchEngaged, setTouchEngaged] = useState(false);

  /* La escena suelta el gesto al salir del viewport: si el usuario sigue
     bajando, no queda un canvas activo capturando el dedo más arriba.

     El patch lo hacía con `useEffect(() => { if (!active) setTouchEngaged(false) })`,
     que el lint rechaza (setState síncrono en efecto). Se reemplaza por el
     ajuste de estado durante el render que React documenta para este caso
     exacto: se compara con el valor anterior y se corrige antes de pintar,
     sin pasar por un ciclo extra de commit.
     https://react.dev/learn/you-might-not-need-an-effect */
  const [prevActive, setPrevActive] = useState(active);
  if (prevActive !== active) {
    setPrevActive(active);
    if (!active && touchEngaged) setTouchEngaged(false);
  }

  const interactive = touch ? touchEngaged : true;

  const handlePinch = useCallback((factor: number) => {
    sceneHandle.current?.dolly(factor);
  }, []);

  useSceneTouch(stageRef, { interactive, onPinch: handlePinch });

  /* Altura fija sólo en táctil: en desktop no hay barra que aparezca. */
  const stageHeight = useStableStageSize(stageRef, { enabled: touch });

  const canRender3D = webglOk && !reducedMotion && !contextLost;

  const extractTarget = stage === "building" ? 0 : 1;

  const floorUnits = useMemo(
    () => (selectedFloor != null ? getUnitsForFloor(config, selectedFloor) : []),
    [config, selectedFloor],
  );

  const selectedUnit = useMemo(
    () => config.units.find((u) => u.id === selectedUnitId) ?? null,
    [config.units, selectedUnitId],
  );

  const plan = useMemo(
    () =>
      selectedUnit
        ? buildUnitPlan(selectedUnit.typology, config.roomRenders ?? {})
        : null,
    [selectedUnit, config.roomRenders],
  );

  const renderRooms = useMemo(
    () => (plan ? roomsWithRenders(plan) : []),
    [plan],
  );

  const selectFloor = useCallback((level: number) => {
    setSelectedFloor(level);
    setSelectedUnitId(null);
    setActiveRoomId(null);
    setStage("floor");
  }, []);

  const selectUnit = useCallback((id: string) => {
    setSelectedUnitId(id);
    setActiveRoomId(null);
    setMorph(0.35);
    setStage("unit");
  }, []);

  const backToBuilding = useCallback(() => {
    setStage("building");
    setSelectedFloor(null);
    setSelectedUnitId(null);
    setActiveRoomId(null);
  }, []);

  const backToFloor = useCallback(() => {
    setStage("floor");
    setSelectedUnitId(null);
    setActiveRoomId(null);
  }, []);

  const handleSelectRoom = useCallback((room: PlanRoom) => {
    setActiveRoomId(room.id);
    if (room.renderSrc) setViewerRoom(room);
  }, []);

  const openCommonRender = useCallback(
    (hotspotId: string) => {
      const found = config.commonRenders?.find((r) => r.id === hotspotId);
      const hotspot = config.hotspots.find((h) => h.id === hotspotId);
      if (!found || !hotspot) return;
      setViewerRoom({
        id: hotspot.id,
        label: hotspot.label,
        kind: "circulacion",
        x: 0,
        y: 0,
        w: 1,
        h: 1,
        renderSrc: found.src,
        renderAlt: found.alt,
      });
    },
    [config.commonRenders, config.hotspots],
  );

  const handleViewerBackToPlan = useCallback(() => {
    setViewerRoom((room) => {
      if (room) setActiveRoomId(room.id);
      return null;
    });
  }, []);

  const asesorHref = selectedUnit
    ? `/asesor?proyecto=${config.projectSlug}&unidad=${encodeURIComponent(selectedUnit.code)}&piso=${selectedUnit.floor}`
    : selectedFloor
      ? `/asesor?proyecto=${config.projectSlug}&piso=${selectedFloor}`
      : `/asesor?proyecto=${config.projectSlug}`;

  const stageLabel =
    stage === "building"
      ? "Edificio"
      : stage === "floor"
        ? `Piso ${selectedFloor}`
        : `Unidad ${selectedUnit?.code ?? ""}`;

  return (
    <section
      ref={rootRef}
      className={styles.root}
      data-stage={stage}
      aria-label={`Explorador comercial — ${projectName}`}
    >
      {/* ---------- Barra de recorrido ---------- */}
      <nav className={styles.breadcrumb} aria-label="Recorrido">
        <button
          type="button"
          onClick={backToBuilding}
          data-active={stage === "building"}
          className={styles.crumb}
        >
          <span className={styles.crumbIndex}>01</span>
          Edificio
        </button>
        <span className={styles.crumbSep} aria-hidden>→</span>
        <button
          type="button"
          onClick={selectedFloor ? backToFloor : undefined}
          disabled={!selectedFloor}
          data-active={stage === "floor"}
          className={styles.crumb}
        >
          <span className={styles.crumbIndex}>02</span>
          {selectedFloor ? `Piso ${selectedFloor}` : "Piso"}
        </button>
        <span className={styles.crumbSep} aria-hidden>→</span>
        <button
          type="button"
          disabled={!selectedUnit}
          data-active={stage === "unit"}
          className={styles.crumb}
        >
          <span className={styles.crumbIndex}>03</span>
          {selectedUnit ? `Unidad ${selectedUnit.code}` : "Unidad"}
        </button>
      </nav>

      <div className={styles.layout}>
        {/* ---------- Panel izquierdo: selector ---------- */}
        <aside className={styles.panelLeft}>
          <header className={styles.panelHead}>
            <p className={styles.eyebrow}>Explorá el proyecto</p>
            <h2 className={styles.title}>{projectName}</h2>
          </header>

          {stage === "building" && (
            <div className={styles.stageBlock}>
              <p className={styles.hint}>
                Elegí un nivel sobre el edificio o en la lista. El piso se
                separa del volumen para mostrar su planta.
              </p>
              <div className={styles.floorList} role="list">
                {[...config.floors].reverse().map((floor) => (
                  <button
                    key={floor.level}
                    type="button"
                    role="listitem"
                    className={styles.floorBtn}
                    data-hovered={hoveredFloor === floor.level}
                    onPointerEnter={() => setHoveredFloor(floor.level)}
                    onPointerLeave={() => setHoveredFloor(null)}
                    onClick={() => selectFloor(floor.level)}
                  >
                    <span className={styles.floorLevel}>
                      {String(floor.level).padStart(2, "0")}
                    </span>
                    <span className={styles.floorLabel}>{floor.label}</span>
                    <span className={styles.floorUnits}>
                      {floor.unitIds.length} unid.
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {stage === "floor" && selectedFloor != null && (
            <div className={styles.stageBlock}>
              <p className={styles.hint}>
                Unidades del piso {selectedFloor}. Elegí una para abrir su
                planta.
              </p>
              <div className={styles.unitList} role="list">
                {floorUnits.map((unit) => (
                  <button
                    key={unit.id}
                    type="button"
                    role="listitem"
                    className={styles.unitBtn}
                    data-status={unit.status}
                    onClick={() => selectUnit(unit.id)}
                  >
                    <span className={styles.unitCode}>{unit.code}</span>
                    <span className={styles.unitSpecs}>
                      {unit.typology} · {unit.surfaceM2} m²
                    </span>
                    <span className={styles.unitStatus}>
                      {STATUS_LABEL[unit.status]}
                    </span>
                    <span className={styles.unitOrient}>
                      {unit.orientation ?? "—"}
                    </span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                className={styles.backBtn}
                onClick={backToBuilding}
              >
                ← Volver al edificio
              </button>
            </div>
          )}

          {stage === "unit" && selectedUnit && plan && (
            <div className={styles.stageBlock}>
              {/* Control de morph plano ↔ volumen */}
              <div className={styles.morphBlock}>
                <div className={styles.morphHead}>
                  <span>Plano</span>
                  <span>Volumen</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={morph}
                  onChange={(e) => setMorph(Number(e.target.value))}
                  className={styles.morphSlider}
                  aria-label="Transición del plano técnico al volumen 3D"
                />
                <p className={styles.morphNote}>
                  El plano y el volumen son la misma geometría: los muros se
                  elevan a medida que avanzás.
                </p>
              </div>

              {/* Ambientes con render disponible */}
              {renderRooms.length > 0 && (
                <div className={styles.roomBlock}>
                  <p className={styles.blockLabel}>Espacios con render</p>
                  <div className={styles.roomList}>
                    {renderRooms.map((room) => (
                      <button
                        key={room.id}
                        type="button"
                        className={styles.roomBtn}
                        data-active={activeRoomId === room.id}
                        onPointerEnter={() => setActiveRoomId(room.id)}
                        onClick={() => handleSelectRoom(room)}
                      >
                        <span className={styles.roomDot} aria-hidden />
                        {room.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <dl className={styles.unitFacts}>
                <div>
                  <dt>Superficie</dt>
                  <dd>{selectedUnit.surfaceM2} m²</dd>
                </div>
                <div>
                  <dt>Tipología</dt>
                  <dd>{selectedUnit.typology}</dd>
                </div>
                <div>
                  <dt>Piso</dt>
                  <dd>{selectedUnit.floor}</dd>
                </div>
                <div>
                  <dt>Orientación</dt>
                  <dd>{selectedUnit.orientation ?? "—"}</dd>
                </div>
              </dl>

              <Link className={styles.cta} href={asesorHref}>
                Consultar por unidad {selectedUnit.code}
                <span aria-hidden>→</span>
              </Link>

              <button
                type="button"
                className={styles.backBtn}
                onClick={backToFloor}
              >
                ← Volver al piso {selectedUnit.floor}
              </button>
            </div>
          )}
        </aside>

        {/* ---------- Escena central ---------- */}
        <div
          ref={stageRef}
          className={styles.stage}
          data-cursor={lite ? undefined : "Explorar"}
          data-engaged={interactive ? "true" : "false"}
          /* Altura fija en táctil — ver useStableStageSize */
          style={stageHeight ? { height: stageHeight } : undefined}
        >
          {mounted && canRender3D ? (
            <SalesCenterCanvas
              config={config}
              stage={stage}
              tier={tier}
              touch={touch}
              lite={lite}
              framing={framing}
              active={active && !viewerRoom}
              interactive={interactive}
              handleRef={sceneHandle}
              onContextLost={() => setContextLost(true)}
              selectedFloor={selectedFloor}
              hoveredFloor={hoveredFloor}
              onHoverFloor={setHoveredFloor}
              onSelectFloor={selectFloor}
              extractTarget={extractTarget}
              onSelectHotspot={openCommonRender}
              plan={plan}
              morph={morph}
              activeRoomId={activeRoomId}
              onHoverRoom={setActiveRoomId}
              onSelectRoom={handleSelectRoom}
            />
          ) : (
            <div className={styles.fallback}>
              <p>
                {reducedMotion
                  ? "Vista 3D desactivada por preferencia de movimiento reducido. El recorrido por pisos y unidades sigue disponible en el panel."
                  : contextLost
                    ? "La escena 3D se interrumpió en este dispositivo. Podés seguir explorando pisos, unidades y planos desde el panel."
                    : !webglOk
                      ? "WebGL no disponible en este dispositivo. Podés explorar pisos, unidades y planos desde el panel."
                      : "Preparando la escena…"}
              </p>
            </div>
          )}

          {/* Gate táctil: sólo en puntero grueso y con la escena montada */}
          {touch && mounted && canRender3D && (
            <SceneTouchGate
              active={touchEngaged}
              onActivate={() => setTouchEngaged(true)}
              onRelease={() => setTouchEngaged(false)}
              label={
                stage === "building"
                  ? "Tocá para explorar el edificio"
                  : "Tocá para explorar"
              }
            />
          )}

          {/* Etiqueta de etapa sobre la escena */}
          <p className={styles.stageTag}>{stageLabel}</p>

          {/* Feedback de hover sobre el edificio — sin sentido en táctil */}
          {!touch && stage === "building" && hoveredFloor != null && (
            <p className={styles.hoverTag}>
              Piso {hoveredFloor} ·{" "}
              {getUnitsForFloor(config, hoveredFloor).length} unidades
            </p>
          )}

          <p className={styles.note}>
            Volumetría y distribución esquemáticas — pendiente documentación
            oficial de obra.
          </p>
        </div>

        {/* ---------- Panel derecho: plano técnico ---------- */}
        {stage === "unit" && selectedUnit && plan && (
          <aside className={styles.panelRight}>
            <p className={styles.blockLabel}>Plano técnico</p>
            <div className={styles.planFrame}>
              <PlanSVG
                plan={plan}
                unit={selectedUnit}
                activeRoomId={activeRoomId}
                onHoverRoom={setActiveRoomId}
                onSelectRoom={handleSelectRoom}
                fade={morph}
              />
            </div>
            <p className={styles.planHint}>
              El punto marca los ambientes con render disponible.
            </p>
          </aside>
        )}
      </div>

      {/* ---------- Render fullscreen ---------- */}
      {viewerRoom?.renderSrc ? (
        (() => {
          const isCommon = !renderRooms.some((r) => r.id === viewerRoom.id);
          const commonRooms: PlanRoom[] = (config.commonRenders ?? []).map(
            (cr) => ({
              id: cr.id,
              label:
                config.hotspots.find((h) => h.id === cr.id)?.label ?? cr.id,
              kind: "circulacion" as const,
              x: 0,
              y: 0,
              w: 1,
              h: 1,
              renderSrc: cr.src,
              renderAlt: cr.alt,
            }),
          );

          return (
            <RenderViewer
              room={viewerRoom}
              unitCode={isCommon ? projectName : (selectedUnit?.code ?? "")}
              rooms={isCommon ? commonRooms : renderRooms}
              onNavigate={(room) => {
                setViewerRoom(room);
                if (!isCommon) setActiveRoomId(room.id);
              }}
              onClose={() => setViewerRoom(null)}
              onBackToPlan={isCommon ? undefined : handleViewerBackToPlan}
            />
          );
        })()
      ) : null}
    </section>
  );
}
