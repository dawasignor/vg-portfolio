import { BufferAttribute, Color, PlaneGeometry, Vector3 } from 'three'
import { blendColor, blendNumber, smoothstep, type Stop } from '../../engine/blend'
import type { Route } from '../../engine/journeyPath'
import { hash3 } from '../../engine/random'

// The grey-box ground: one height function that the terrain mesh, the camera
// path and every placed prop all read, so everything stands on the same ground.
// Shapes and colours follow the reference photos where they exist ("ref"),
// and are grey-box defaults where they don't yet ("default").
//
// Two countries (design doc §6): the first quarter is a foothill river valley
// (semester 1), and the rest is the mountain-to-sea world. M() places the
// mountain-to-sea world's numbers into the back three quarters, unchanged in
// shape, so its slopes and scenes stay as they were built.

/** Metres from the start to the shore. */
export const JOURNEY_LENGTH = 4000
/** Where the foothills end and the mountain begins (progress 0–1). */
export const FOOTHILLS_END = 0.25
/** Maps a position in the mountain-to-sea world (0–1) onto the journey. */
const M = (s: number) => FOOTHILLS_END + (1 - FOOTHILLS_END) * s

/** Trail elevation along the journey (design doc §4.1, §6): [progress, metres]. */
const TRAIL_ELEVATION: ReadonlyArray<Stop<number>> = [
  [0.0, 6], // foothills: a gentle climb upstream along the river …
  [0.08, 9],
  [0.16, 13],
  [M(0.0), 20], // … to the foot of the mountain, in a stony bowl under the towers
  [M(0.1), 75], // up through the forest
  [M(0.21), 150],
  [M(0.235), 166], // over a brow, and the lake basin opens up below …
  [M(0.29), 150], // … the trail drops to the water's edge
  [M(0.35), 220], // a climb onto the ridge …
  [M(0.4), 236], // … then along its top, the valleys opening on the right
  [M(0.45), 260], // summit pass
  [M(0.5), 228],
  [M(0.62), 110], // down to the village
  [M(0.8), 30], // river valley
  [M(0.92), 5], // delta
  [M(1.0), 1.5], // the beach
  [M(1.2), -25], // under the sea
]

/** How high the ground rises left of the trail: low hills, then tall in the mountains. */
const WALL_LEFT: ReadonlyArray<Stop<number>> = [
  [0.0, 50],
  [0.2, 80],
  [M(0.0), 120],
  [M(0.3), 260],
  [M(0.5), 260],
  [M(0.7), 90],
  [M(0.9), 15],
  [M(1.2), 5],
]

/** Right of the trail. In the foothills it falls away to a coast (the ocean glimpse
 *  of semester 1); along the ridge it drops into the valleys (ref GOPR2998–3000). */
const WALL_RIGHT: ReadonlyArray<Stop<number>> = [
  [0.0, 25],
  [0.12, 25],
  [0.16, -35], // down to the shore: the sea shows on the horizon …
  [0.236, -30], // … all the way to the mountain's foot
  [M(0.0), 120],
  [M(0.27), 220],
  [M(0.33), -160],
  [M(0.41), -160],
  [M(0.47), 220],
  [M(0.5), 260],
  [M(0.7), 90],
  [M(0.9), 15],
  [M(1.2), 5],
]

/** Distant peaks for the big vistas. Kept well clear of the trail. */
const PEAKS = [
  { x: -620, z: -2275, height: 520, radius: 240 },
  { x: 640, z: -1930, height: 430, radius: 210 },
  { x: -560, z: -2920, height: 360, radius: 230 },
  { x: 600, z: -2620, height: 300, radius: 190 },
]

/** The alpine lake, in the basin below the brow. You only see a mountain lake from
 *  above (ref GOPR2990 looks down on the pool by the hut), so the trail climbs
 *  a brow first. Left of the trail, where the bending trail keeps it in view. */
export const LAKE = { s: M(0.29), dx: -48, radius: 22 }

export type River = {
  from: number
  to: number
  /** +1 = right of the trail, -1 = left. */
  side: 1 | -1
  /** Half-width in metres at progress s. */
  width: (s: number) => number
}

export const RIVERS: Readonly<Record<'foothill' | 'lowland', River>> = {
  // Semester 1: you walk upstream beside it; it rises at the foot of the mountain.
  foothill: { from: -0.2, to: FOOTHILLS_END + 0.005, side: -1, width: () => 6 },
  // The mountain-to-sea world: from the village down to the sea, widening into the delta.
  lowland: { from: M(0.6), to: M(1.02), side: 1, width: (s) => 5 + 25 * smoothstep(M(0.8), M(0.95), s) },
}

export function trailElevation(s: number) {
  return blendNumber(TRAIL_ELEVATION, s)
}

/** Sideways wander of the trail, in metres. The two stretches meet smoothly at
 *  FOOTHILLS_END: same position, and the same direction of travel. */
export function trailX(s: number) {
  if (s < FOOTHILLS_END) return 37.3 * Math.sin((2 * Math.PI * s) / FOOTHILLS_END)
  return 70 * Math.sin(((s - FOOTHILLS_END) / (1 - FOOTHILLS_END)) * Math.PI * 3.2)
}

/** River centre line: always far enough to the side that its banks never reach the trail. */
export function riverX(river: River, s: number) {
  return trailX(s) + river.side * (24 + river.width(s))
}

export function riverLevel(s: number) {
  return trailElevation(s) - 1.2
}

export const LAKE_CENTRE = {
  x: trailX(LAKE.s) + LAKE.dx,
  z: -LAKE.s * JOURNEY_LENGTH,
}
export const LAKE_LEVEL = trailElevation(LAKE.s) - 1
const LAKE_FLOOR = LAKE_LEVEL - 2.5

/** 0–1: how much of a river runs at progress s, easing in at its source and out at its end. */
function riverPresence(river: River, s: number) {
  return smoothstep(river.from, river.from + 0.02, s) * smoothstep(river.to, river.to - 0.01, s)
}

export function groundHeight(x: number, z: number) {
  const s = -z / JOURNEY_LENGTH
  const side = x - trailX(s)
  // 0 on the trail, 1 far from it, so the walls, bumps and peaks leave the trail smooth.
  const away = smoothstep(25, 300, Math.abs(side))

  const walls = blendNumber(side < 0 ? WALL_LEFT : WALL_RIGHT, s) * away * away
  const bumps = 18 * Math.sin(x / 61) * Math.cos(z / 47) * away
  let peaks = 0
  for (const p of PEAKS) {
    const r2 = ((x - p.x) ** 2 + (z - p.z) ** 2) / p.radius ** 2
    peaks += p.height * Math.exp(-r2)
  }
  let h = trailElevation(s) + walls + bumps + peaks * away

  // River channels, carved 3 m down.
  for (const river of Object.values(RIVERS)) {
    const on = riverPresence(river, s)
    if (on > 0) {
      const w = river.width(s)
      h -= 3 * on * smoothstep(w + 6, w, Math.abs(x - riverX(river, s)))
    }
  }

  // The lake bowl: blend the ground down to a flat floor near the centre.
  const toLake = Math.hypot(x - LAKE_CENTRE.x, z - LAKE_CENTRE.z)
  if (toLake < LAKE.radius) {
    h += (LAKE_FLOOR - h) * smoothstep(LAKE.radius, LAKE.radius * 0.55, toLake)
  }
  return h
}

/** True if (x, z) is in a river, the lake or the sea, so props stay out of the water. */
export function isWater(x: number, z: number) {
  const s = -z / JOURNEY_LENGTH
  if (groundHeight(x, z) < 1) return true
  for (const river of Object.values(RIVERS)) {
    if (riverPresence(river, s) > 0.5 && Math.abs(x - riverX(river, s)) < river.width(s) + 4) return true
  }
  return Math.hypot(x - LAKE_CENTRE.x, z - LAKE_CENTRE.z) < LAKE.radius * 0.9
}

/** A point on the ground at progress s, dx metres to the side of the trail. */
export function groundPoint(s: number, dx: number) {
  const x = trailX(s) + dx
  const z = -s * JOURNEY_LENGTH
  return new Vector3(x, groundHeight(x, z), z)
}

/** Progress `metres` further along the journey from s. */
export function ahead(s: number, metres: number) {
  return s + metres / JOURNEY_LENGTH
}

export const greyBoxRoute: Route = {
  length: JOURNEY_LENGTH,
  lateral: trailX,
  ground: groundHeight,
}

const c = (hex: string) => new Color(hex)

/** Colour of flat ground along the journey. */
const FLAT_GROUND: ReadonlyArray<Stop<Color>> = [
  [0.0, c('#6e735b')], // ref GOPR2999: sunlit meadow, olive and hazy (foothills)
  [0.23, c('#6e735b')],
  [M(0.0), c('#6a6358')], // ref GOPR2990: grey-brown gravel of the hut's bowl
  [M(0.09), c('#6a6358')],
  [M(0.11), c('#4a4c39')], // ref GOPR2999: shaded conifer green
  [M(0.2), c('#4a4c39')],
  [M(0.23), c('#6e735b')], // ref GOPR2999: sunlit meadow
  [M(0.28), c('#6e735b')],
  [M(0.31), c('#bfb6ab')], // ref GOPR2986: pale limestone scree
  [M(0.48), c('#bfb6ab')],
  [M(0.53), c('#6e735b')], // meadows again below the pass
  [M(0.8), c('#6e735b')],
  [M(0.87), c('#7d7a5a')], // default: delta flats
  [M(0.93), c('#d8caa0')], // default: sand
]

/** Colour of steep ground: wooded slopes low down, bare rock in the mountains. */
const STEEP_GROUND: ReadonlyArray<Stop<Color>> = [
  [0.0, c('#5b5d4a')], // default: wooded foothill slopes
  [0.23, c('#5b5d4a')],
  [M(0.0), c('#605b55')], // ref GOPR3025: warm grey rock
  [M(0.3), c('#8b8477')], // ref GOPR2986: sunlit rock
  [M(0.5), c('#7c7c7e')], // ref GOPR3025
  [M(0.62), c('#5b5d4a')], // default: wooded slopes
  [M(0.9), c('#7a715f')], // default: low cliffs by the sea
]

const SAND = c('#d8caa0')

/** Terrain extent along z: a little behind the start, and past the shore. */
const TERRAIN_BEHIND = 700
const TERRAIN_BEYOND = 700

// A flat grid bent into shape: each vertex is lifted to groundHeight, then
// coloured by where it is on the journey and how steep it is. ~12 m between vertices.
export function buildTerrainGeometry() {
  const depth = TERRAIN_BEHIND + JOURNEY_LENGTH + TERRAIN_BEYOND
  const geometry = new PlaneGeometry(1800, depth, 150, Math.round(depth / 12))
  geometry.rotateX(-Math.PI / 2) // lie flat: the plane's y axis becomes -z
  geometry.translate(0, 0, TERRAIN_BEHIND - depth / 2) // from +TERRAIN_BEHIND to past the shore

  const position = geometry.attributes.position
  for (let i = 0; i < position.count; i++) {
    position.setY(i, groundHeight(position.getX(i), position.getZ(i)))
  }
  geometry.computeVertexNormals()

  const normal = geometry.attributes.normal
  const colours = new Float32Array(position.count * 3)
  const flat = new Color()
  const steep = new Color()
  const colour = new Color()
  for (let i = 0; i < position.count; i++) {
    const s = -position.getZ(i) / JOURNEY_LENGTH
    const h = position.getY(i)
    blendColor(FLAT_GROUND, s, flat)
    blendColor(STEEP_GROUND, s, steep)
    // normal.y is 1 on flat ground and falls as the slope steepens.
    colour.lerpColors(flat, steep, smoothstep(0.9, 0.6, normal.getY(i)))
    if (h < 2.5) colour.lerp(SAND, smoothstep(2.5, 1, h))
    // A little per-vertex variation, so large flat areas don't read as one sheet.
    colour.offsetHSL(0, 0, (hash3(position.getX(i), 0, position.getZ(i), 5) - 0.5) * 0.05)
    colour.toArray(colours, i * 3)
  }
  geometry.setAttribute('color', new BufferAttribute(colours, 3))
  return geometry
}
