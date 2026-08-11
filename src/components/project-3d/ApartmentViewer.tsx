"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ACESFilmicToneMapping } from "three";
import type { ProjectUnit } from "@/data/project3d";
import { ApartmentDollhouse } from "./ApartmentDollhouse";
import { FloorPlanViewer } from "./FloorPlanViewer";
import styles from "./ApartmentViewer.module.css";

const Canvas = dynamic(
  () => import("@react-three/fiber").then((m) => m.Canvas),
  { ssr: false },
);

type Mode = "plan" | "3d";

type Props = {
  unit: ProjectUnit;
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  projectSlug: string;
  inventoryNote?: string;
};

const STATUS_LABEL: Record<ProjectUnit["status"], string> = {
  disponible: "Disponible",
  reservado: "Reservado",
  vendido: "Vendido",
};

export function ApartmentViewer({
  unit,
  mode,
  onModeChange,
  projectSlug,
  inventoryNote,
}: Props) {
  const asesorHref = `/asesor?proyecto=${projectSlug}&unidad=${encodeURIComponent(unit.code)}&piso=${unit.floor}`;

  return (
    <div className={styles.root}>
      <div className={styles.head}>
        <div>
          <p className={styles.eyebrow}>Unidad {unit.code}</p>
          <h3 className={styles.title}>
            Piso {unit.floor} · {unit.typology}
          </h3>
        </div>
        <div className={styles.toggle} role="group" aria-label="Vista">
          <button
            type="button"
            data-active={mode === "plan" ? "true" : "false"}
            onClick={() => onModeChange("plan")}
          >
            Plano
          </button>
          <button
            type="button"
            data-active={mode === "3d" ? "true" : "false"}
            onClick={() => onModeChange("3d")}
          >
            3D
          </button>
        </div>
      </div>

      <div className={styles.stage} data-mode={mode} key={mode}>
        {mode === "plan" ? (
          <FloorPlanViewer unit={unit} />
        ) : (
          <Canvas
            dpr={[1, 1.5]}
            camera={{ position: [2.4, 2.2, 2.8], fov: 40 }}
            gl={{ antialias: true, powerPreference: "high-performance" }}
            shadows
            onCreated={({ gl }) => {
              gl.toneMapping = ACESFilmicToneMapping;
              gl.toneMappingExposure = 1.05;
            }}
          >
            <color attach="background" args={["#f0eee8"]} />
            <ambientLight intensity={0.55} />
            <directionalLight
              position={[3, 5, 2]}
              intensity={1.15}
              color="#fff8ee"
              castShadow
              shadow-mapSize={[512, 512]}
            />
            <directionalLight position={[-2, 1.5, -2]} intensity={0.3} color="#c4b79a" />
            <ApartmentDollhouse unit={unit} />
          </Canvas>
        )}
      </div>

      <dl className={styles.facts}>
        <div>
          <dt>Superficie</dt>
          <dd>{unit.surfaceM2} m²</dd>
        </div>
        <div>
          <dt>Orientación</dt>
          <dd>{unit.orientation ?? "—"}</dd>
        </div>
        <div>
          <dt>Estado</dt>
          <dd data-status={unit.status}>{STATUS_LABEL[unit.status]}</dd>
        </div>
      </dl>

      {unit.demo && inventoryNote ? (
        <p className={styles.demoNote}>{inventoryNote}</p>
      ) : null}

      <Link className={styles.cta} href={asesorHref}>
        Consultar por unidad {unit.code}
        <span aria-hidden>→</span>
      </Link>
    </div>
  );
}
