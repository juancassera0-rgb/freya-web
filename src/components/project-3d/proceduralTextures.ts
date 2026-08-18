import * as THREE from "three";

/**
 * TEXTURAS PROCEDURALES — sin assets, sin red, sin UV especial.
 *
 * El problema visual concreto: MeshStandardMaterial con un color plano y
 * roughness uniforme se lee como plástico, no como hormigón.
 *
 * Primer intento: grano fino + juntas de un píxel, sólo como roughnessMap.
 * No se notaba en absoluto: el mipmapping (necesario para que no titile a
 * distancia) borra el detalle de alta frecuencia primero, y además el
 * roughness por sí solo casi no se percibe bajo luz difusa — el ojo lee
 * color antes que brillo. La solución real combina dos cosas:
 *
 * 1. Señal de BAJA frecuencia — paneles anchos con una variación de tono
 *    suave entre ellos, como la junta de un panel prefabricado. Sobrevive
 *    cualquier nivel de mip porque no depende de un detalle de pocos
 *    píxeles.
 * 2. La MISMA textura se usa como color (`map`, module el tono base real)
 *    y no sólo como roughness — es lo que la hace visible en cualquier
 *    ángulo de luz, no sólo donde pega un highlight especular.
 *
 * El grano fino y las manchas quedan como capa secundaria, para cuando la
 * cámara sí está cerca (el explorador).
 *
 * Todo se genera una sola vez y se cachea en memoria de módulo.
 */

let albedoCanvas: HTMLCanvasElement | null = null;
let mapTexture: THREE.CanvasTexture | null = null;
let roughnessTexture: THREE.CanvasTexture | null = null;
let normalTexture: THREE.CanvasTexture | null = null;
let floorMapTexture: THREE.CanvasTexture | null = null;
let floorNormalTexture: THREE.CanvasTexture | null = null;

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

/** Campo de altura — fuente única de la que salen el tono y el relieve. */
function buildHeightField(size: number): Float32Array {
  const rand = seededRandom(1337);
  const height = new Float32Array(size * size);

  /* Paneles — bandas verticales anchas, tono base distinto entre una y la
     siguiente, con un borde de transición suave (no una línea de un
     píxel). Da la lectura de "hormigón articulado en paños", visible a
     cualquier distancia. */
  const panelCount = 4 + Math.floor(rand() * 2);
  const panelTone: number[] = [];
  for (let p = 0; p < panelCount; p += 1) panelTone.push((rand() - 0.5) * 68);

  const edgeSoft = size / (panelCount * 5); // ancho del degradé en la junta

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const t = (x / size) * panelCount;
      const p = Math.min(panelCount - 1, Math.floor(t));
      const distToEdge = Math.min(t - p, p + 1 - t) * (size / panelCount);
      const edgeFactor = Math.min(1, distToEdge / edgeSoft);
      const neighbour =
        t - p < 0.5
          ? panelTone[(p - 1 + panelCount) % panelCount]
          : panelTone[(p + 1) % panelCount];
      const tone = panelTone[p] * edgeFactor + neighbour * (1 - edgeFactor);
      height[y * size + x] = tone;
    }
  }

  // Grano fino — sutil, sólo se nota de cerca (explorador); a distancia
  // se promedia solo, no debe competir con la lectura de paneles.
  for (let i = 0; i < height.length; i += 1) {
    height[i] += (rand() - 0.5) * 9;
  }

  // Manchas grandes y suaves — variación de humedad / colada.
  for (let i = 0; i < 14; i += 1) {
    const r = 22 + rand() * 64;
    const cx = rand() * size;
    const cy = rand() * size;
    const amt = (rand() - 0.5) * 20;
    const r2 = r * r;
    const x0 = Math.max(0, Math.floor(cx - r));
    const x1 = Math.min(size, Math.ceil(cx + r));
    const y0 = Math.max(0, Math.floor(cy - r));
    const y1 = Math.min(size, Math.ceil(cy + r));
    for (let y = y0; y < y1; y += 1) {
      for (let x = x0; x < x1; x += 1) {
        const dx = x - cx;
        const dy = y - cy;
        const d2 = dx * dx + dy * dy;
        if (d2 > r2) continue;
        height[y * size + x] += amt * (1 - d2 / r2);
      }
    }
  }

  return height;
}

function getAlbedoCanvas(): HTMLCanvasElement {
  if (albedoCanvas) return albedoCanvas;

  const size = 256;
  const height = buildHeightField(size);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const img = ctx.createImageData(size, size);
  for (let i = 0; i < height.length; i += 1) {
    /* Este mismo canvas alimenta dos texturas (color y roughness), así
       que el promedio se mantiene alto — cerca de blanco — para no correr
       ni el tono ni el roughness reales del material: sólo module, en un
       rango realista de variación de paño de hormigón (~±20%). */
    const v = THREE.MathUtils.clamp(233 + height[i] * 1.05, 178, 255);
    img.data[i * 4] = v;
    img.data[i * 4 + 1] = v;
    img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);

  albedoCanvas = canvas;
  return canvas;
}

/** Para `map` — module el color base del material. Espacio de color sRGB. */
export function getConcreteMap(): THREE.CanvasTexture {
  if (mapTexture) return mapTexture;
  const texture = new THREE.CanvasTexture(getAlbedoCanvas());
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  texture.anisotropy = 8;
  texture.colorSpace = THREE.SRGBColorSpace;
  mapTexture = texture;
  return texture;
}

/** Para `roughnessMap` — mapa de datos, sin espacio de color. */
export function getConcreteRoughnessMap(): THREE.CanvasTexture {
  if (roughnessTexture) return roughnessTexture;
  const texture = new THREE.CanvasTexture(getAlbedoCanvas());
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  texture.anisotropy = 8;
  texture.colorSpace = THREE.NoColorSpace;
  roughnessTexture = texture;
  return texture;
}

/** Variante para paños grandes (piso del sales center: ~28×28 unidades) —
 *  mismo mapa, repeat mucho más alto para que el panel no se vea
 *  estirado a esa escala. */
export function getConcreteFloorMap(): THREE.CanvasTexture {
  if (floorMapTexture) return floorMapTexture;
  const texture = new THREE.CanvasTexture(getAlbedoCanvas());
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(14, 14);
  texture.anisotropy = 8;
  texture.colorSpace = THREE.SRGBColorSpace;
  floorMapTexture = texture;
  return texture;
}

function buildNormalCanvas(): HTMLCanvasElement {
  const size = 256;
  const height = buildHeightField(size);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(size, size);

  const at = (x: number, y: number) =>
    height[((y + size) % size) * size + ((x + size) % size)];

  // Gradiente de altura → normal en espacio tangente.
  const strength = 0.06;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      const n = new THREE.Vector3(-dx, -dy, 1).normalize();
      const idx = (y * size + x) * 4;
      img.data[idx] = (n.x * 0.5 + 0.5) * 255;
      img.data[idx + 1] = (n.y * 0.5 + 0.5) * 255;
      img.data[idx + 2] = (n.z * 0.5 + 0.5) * 255;
      img.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

let normalCanvas: HTMLCanvasElement | null = null;
function getNormalCanvas(): HTMLCanvasElement {
  if (!normalCanvas) normalCanvas = buildNormalCanvas();
  return normalCanvas;
}

export function getConcreteNormalMap(): THREE.CanvasTexture {
  if (normalTexture) return normalTexture;
  const texture = new THREE.CanvasTexture(getNormalCanvas());
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  texture.anisotropy = 8;
  normalTexture = texture;
  return texture;
}

export function getConcreteFloorNormalMap(): THREE.CanvasTexture {
  if (floorNormalTexture) return floorNormalTexture;
  const texture = new THREE.CanvasTexture(getNormalCanvas());
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(14, 14);
  texture.anisotropy = 8;
  floorNormalTexture = texture;
  return texture;
}
