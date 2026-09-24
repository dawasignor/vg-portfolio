import { BufferAttribute, Color, PlaneGeometry } from 'three'
import type { Route } from '../../engine/journeyPath'

// Grey-box world for v0.2: one height function that both the terrain mesh and
// the camera path read, so the traveller always stands on the ground.
// TODO(v0.3): split into scene segments (MountainBase, ForestSlope, …), each with its own look.

/** Metres from base camp to the shore. */
export const JOURNEY_LENGTH = 2000

type Stops = ReadonlyArray<readonly [number, number]>

/** Trail elevation along the journey (design doc §4.1): [progress 0–1, metres]. */
const TRAIL_ELEVATION: Stops = [
  [0.0, 20], // base camp
  [0.15, 90], // forest slopes
  [0.32, 210], // high country
  [0.45, 260], // summit pass
  [0.6, 120], // down to the villages
  [0.75, 45], // river valley
  [0.9, 8], // delta
  [1.0, 1.5], // the beach
  [1.2, -25], // under the sea
]

/** How high the valley walls rise beside the trail: tall in the mountains, low by the sea. */
const WALL_HEIGHT: Stops = [
  [0.0, 120],
  [0.3, 260],
  [0.5, 260],
  [0.7, 90],
  [0.9, 15],
  [1.2, 5],
]

/** Distant peaks for the big vistas. Kept well clear of the trail. */
const PEAKS = [
  { x: -620, z: -850, height: 520, radius: 240 },
  { x: 640, z: -620, height: 430, radius: 210 },
  { x: -560, z: -1280, height: 360, radius: 230 },
  { x: 600, z: -1080, height: 300, radius: 190 },
]

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1)
  return t * t * (3 - 2 * t)
}

/** Smoothly blends between stops, holding the end values outside them. */
function blend(stops: Stops, s: number) {
  if (s <= stops[0][0]) return stops[0][1]
  for (let i = 1; i < stops.length; i++) {
    const [s1, v1] = stops[i]
    if (s <= s1) {
      const [s0, v0] = stops[i - 1]
      return v0 + (v1 - v0) * smoothstep(s0, s1, s)
    }
  }
  return stops[stops.length - 1][1]
}

/** Sideways wander of the trail, in metres. */
export function trailX(s: number) {
  return 70 * Math.sin(s * Math.PI * 3.2)
}

export function groundHeight(x: number, z: number) {
  const s = -z / JOURNEY_LENGTH
  const fromTrail = Math.abs(x - trailX(s))
  // 0 on the trail, 1 far from it, so every feature below leaves the trail smooth.
  const away = smoothstep(25, 300, fromTrail)

  const walls = blend(WALL_HEIGHT, s) * away * away
  const bumps = 18 * Math.sin(x / 61) * Math.cos(z / 47) * away
  let peaks = 0
  for (const p of PEAKS) {
    const r2 = ((x - p.x) ** 2 + (z - p.z) ** 2) / p.radius ** 2
    peaks += p.height * Math.exp(-r2)
  }
  return blend(TRAIL_ELEVATION, s) + walls + bumps + peaks * away
}

export const greyBoxRoute: Route = {
  length: JOURNEY_LENGTH,
  lateral: trailX,
  ground: groundHeight,
}

/** Colour bands by height: [metres, colour]. */
const BANDS: ReadonlyArray<readonly [number, Color]> = [
  [-10, new Color('#c9b98f')], // wet sand
  [4, new Color('#d8caa0')], // beach
  [12, new Color('#8fa77c')], // meadow
  [140, new Color('#6f8a62')], // forest
  [260, new Color('#8b877e')], // rock
  [420, new Color('#f1f1ee')], // snow
]

function colourForHeight(h: number, out: Color) {
  if (h <= BANDS[0][0]) return out.copy(BANDS[0][1])
  for (let i = 1; i < BANDS.length; i++) {
    const [h1, c1] = BANDS[i]
    if (h <= h1) {
      const [h0, c0] = BANDS[i - 1]
      return out.lerpColors(c0, c1, (h - h0) / (h1 - h0))
    }
  }
  return out.copy(BANDS[BANDS.length - 1][1])
}

// A flat grid bent into shape: each vertex is lifted to groundHeight and
// coloured by its height. ~8 m between vertices.
export function buildTerrainGeometry() {
  const width = 1800
  const depth = 3200
  const geometry = new PlaneGeometry(width, depth, 225, 400)
  geometry.rotateX(-Math.PI / 2) // lie flat: the plane's y axis becomes -z
  geometry.translate(0, 0, -JOURNEY_LENGTH / 2) // centre it on the journey

  const position = geometry.attributes.position
  const colours = new Float32Array(position.count * 3)
  const colour = new Color()
  for (let i = 0; i < position.count; i++) {
    const h = groundHeight(position.getX(i), position.getZ(i))
    position.setY(i, h)
    colourForHeight(h, colour).toArray(colours, i * 3)
  }
  geometry.setAttribute('color', new BufferAttribute(colours, 3))
  geometry.computeVertexNormals()
  return geometry
}
