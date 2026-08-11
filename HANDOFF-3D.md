# Freya Web — Handoff 3D (co-work)

Fecha: 2026-08-11  
Repo local: `C:\Users\SIMM\Projects\freya-web`  
Stack: Next.js 16 + React 19 + Three.js + `@react-three/fiber` + `@react-three/drei` + Lenis

## Qué es

Sitio inmobiliario **Freya**. Brand: Off-White `#f6f6f6`, Off-Black `#1d1c1b`, Camo `#4f4c37`, tipografía Neue Regrade.

Pivot comercial: experiencia 3D inmersiva **edificio → piso → unidad → contacto asesor**. No decoración WebGL suelta.

## Cómo verlo

```bash
npm run dev
```

- Home (hero 3D): http://localhost:3000  
- Proyecto + story + explorador: http://localhost:3000/desarrollos/beauchef-620  
- Asesor con contexto: http://localhost:3000/asesor?proyecto=beauchef-620&unidad=501&piso=5

## Reglas críticas

1. La masa 3D actual es **placeholder / esquemática**. Siempre badge de “provisional”. No venderla como el edificio real.
2. Unidades con `demo: true` son **solo UI**. No inventario comercial. Mostrar `inventoryNote`.
3. Cuando llegue el GLB oficial: setear `modelUrl` + `status: "ready"` en `src/data/project3d.ts`.
4. Brand Freya (no OCI/Illoca). Evitar look gamer/neon/purple.
5. Leer `AGENTS.md` / guías en `node_modules/next/dist/docs/` — Next 16 puede diferir del training data.
6. Preferir R3F + Drei. No inventar edificios fake como reales.

## Fases hechas (1–10)

| Fase | Qué |
|------|-----|
| 1 | Schema `project3d.ts`, `Project3DScene`, `CameraRig`, `BuildingPlaceholder`, cableado Beauchef |
| 2 | `ProjectHero3D` en home (scroll cinematic) |
| 3 | `ProjectStory3D` (capítulos + highlight de piso) |
| 4 | `BuildingExplorer` + `OrbitControlsSoft` |
| 5–6 | Selector piso → lista unidades |
| 7 | `ApartmentViewer` plano ↔ dollhouse 3D |
| 8 | `HotspotMarkers` (lobby, amenities, parking, rooftop) |
| 9 | CTA contextual → `/asesor?proyecto=&unidad=&piso=` + `AdvisorForm` lee query |
| 10 | Perf: lazy canvas, modo `lite` móvil, reduced-motion, sin WebGL fallback |

## Archivos clave

```
src/data/project3d.ts                 # schema + beauchef3d + helpers
src/data/projects.ts                  # proyectos CMS-like

src/app/page.tsx                      # home → ProjectHero3D
src/app/desarrollos/[slug]/page.tsx  # story + BuildingExplorer
src/app/asesor/page.tsx               # form asesor

src/components/AdvisorForm.tsx
src/components/SiteAtmosphere.tsx     # solo grid/grain (sin WebGL global)

src/components/project-3d/
  Project3DScene.tsx                  # Canvas compartido (cinematic | orbit, full|lite)
  CameraRig.tsx
  OrbitControlsSoft.tsx
  BuildingPlaceholder.tsx             # masa esquemática + exploded
  BuildingExplorer.tsx                # explorador interactivo
  BuildingExplorer.module.css
  BuildingViewer.tsx                  # re-export → BuildingExplorer
  ProjectHero3D.tsx + .module.css
  ProjectStory3D.tsx + .module.css
  ApartmentViewer.tsx + .module.css
  ApartmentDollhouse.tsx
  HotspotMarkers.tsx + .module.css
  useClientFlags.ts                   # media queries + WebGL via useSyncExternalStore
```

## Flujo UX actual

1. **Home**: hero sticky ~220vh, cámara intro → overview → detail por scroll, CTA al proyecto.  
2. **Ficha Beauchef**: story sticky con capítulos → `BuildingExplorer`.  
3. **Explorer**: orbitar → elegir piso → unidad → plano/3D → “Consultar unidad” → asesor con WhatsApp prearmado.

## Datos demo (Beauchef)

- `schematicFloors: 9`
- 2 unidades demo por piso (`demo: true`), tipología “4 ambientes”
- Hotspots: lobby, amenities, parking, rooftop
- `status: "placeholder"`

## Pendiente / próximo trabajo útil

- [ ] Integrar GLB real (`modelUrl`, loader, materials brand)
- [ ] Reemplazar unidades demo por inventario real (API o CMS)
- [ ] Planos oficiales por unidad (`planImage`)
- [ ] Interior GLB por tipología (reemplaza dollhouse)
- [ ] Push remoto (hoy no había `origin` / `gh` configurado en una sesión previa)
- [ ] Opcional: pausar canvas fuera de viewport en hero/story (explorer ya lazy-mount)

## Commits / git

Trabajo reciente mayormente en working tree. Si hace falta commit: pedirlo explícitamente. No force-push.

## Prompt corto para seguir en Claude

> Continuá Freya (`freya-web`). Experiencia 3D inmobiliaria ya implementada en fases 1–10. Masa y unidades son placeholders. Brand: off-white / off-black / camo. Archivos en `src/components/project-3d/` y `src/data/project3d.ts`. Siguiente prioridad: [PEGAR PRIORIDAD]. No presentar el placeholder como edificio real.
