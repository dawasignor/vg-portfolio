import { BufferAttribute, Color, PlaneGeometry, Vector3 } from 'three'
import { blendColor, blendNumber, smoothstep, type Stop } from '../../engine/blend'
import type { Route } from '../../engine/journeyPath'
import { hash3 } from '../../engine/random'

// The grey-box ground: one height function that the terrain mesh, the camera
// path and every placed prop all read, so everything stands on the same ground.
// Shapes and colours follow the reference photos where they exist ("ref"),
// and are grey-box defaults where they don't yet ("default").

/** Metres from base camp to the shore. */
export const JOURNEY_LENGTH = 3000

/** Trail elevation along the journey (design doc §4.1): [progress 0–1, metres]. */
const TRAIL_ELEVATION: ReadonlyArray<Stop<number>> = [
  [0.0, 20], // base camp, in a stony bowl under the towers
  [0.1, 75], // up through the forest
  [0.21, 150],
  [0.235, 166], // over a brow, and the lake basin opens up below …
  [0.29, 150], // … the trail drops to the water's edge
  [0.35, 220], // a climb onto the ridge …
  [0.4, 236], // … then along its top, the valleys opening on the right
  [0.45, 260], // summit pass
  [0.5, 228],
  [0.62, 110], // down to the village
  [0.8, 30], // river valley
  [0.92, 5], // delta
  [1.0, 1.5], // the beach
  [1.2, -25], // under the sea
]

/** How high the valley walls rise left of the trail: tall in the mountains, low by the sea. */
const WALL_LEFT: ReadonlyArray<Stop<number>> = [
  [0.0, 120],
  [0.3, 260],
  [0.5, 260],
  [0.7, 90],
  [0.9, 15],
  [1.2, 5],
]

/** Right of the trail: the same, except along the ridge, where the ground drops away
 *  into the valleys (negative = below the trail). ref GOPR2998–3000. */
const WALL_RIGHT: ReadonlyArray<Stop<number>> = [
  [0.0, 120],
  [0.27, 220],
  [0.33, -160],
  [0.41, -160],
  [0.47, 220],
  [0.5, 260],
  [0.7, 90],
  [0.9, 15],
  [1.2, 5],
]

/** Distant peaks for the big vistas. Kept well clear of the trail. */
const PEAKS = [
  { x: -620, z: -1275, height: 520, radius: 240 },
  { x: 640, z: -930, height: 430, radius: 210 },
  { x: -560, z: -1920, height: 360, radius: 230 },
  { x: 600, z: -1620, height: 300, radius: 190 },
]

/** The alpine lake, in the basin below the brow. You only see a mountain lake from
 *  above (ref GOPR2990 looks down on the pool by the hut), so the trail climbs
 *  a brow first. Left of the trail, where the bending trail keeps it in view. */
export const LAKE = { s: 0.29, dx: -48, radius: 22 }

/** The river: runs beside the trail from the village down to the sea. */
export const RIVER = { from: 0.6, to: 1.02 }

export function trailElevation(s: number) {
  return blendNumber(TRAIL_ELEVATION, s)
}

/** Sideways wander of the trail, in metres. */
export function trailX(s: number) {
  return 70 * Math.sin(s * Math.PI * 3.2)
}

/** Half-width of the river, widening into the delta. */
export function riverWidth(s: number) {
  return 5 + 25 * smoothstep(0.8, 0.95, s)
}

/** River centre line: always far enough right that its banks never reach the trail. */
export function riverX(s: number) {
  return trailX(s) + 24 + riverWidth(s)
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

  // The river channel, carved 3 m down.
  const riverOn = smoothstep(RIVER.from, RIVER.from + 0.04, s)
  if (riverOn > 0) {
    const w = riverWidth(s)
    h -= 3 * riverOn * smoothstep(w + 6, w, Math.abs(x - riverX(s)))
  }

  // The lake bowl: blend the ground down to a flat floor near the centre.
  const toLake = Math.hypot(x - LAKE_CENTRE.x, z - LAKE_CENTRE.z)
  if (toLake < LAKE.radius) {
    h += (LAKE_FLOOR - h) * smoothstep(LAKE.radius, LAKE.radius * 0.55, toLake)
  }
  return h
}

/** True if (x, z) is in the river, the lake or the sea, so props stay out of the water. */
export function isWater(x: number, z: number) {
  const s = -z / JOURNEY_LENGTH
  if (groundHeight(x, z) < 1) return true
  if (s > RIVER.from && Math.abs(x - riverX(s)) < riverWidth(s) + 4) return true
  return Math.hypot(x - LAKE_CENTRE.x, z - LAKE_CENTRE.z) < LAKE.radius * 0.9
}

/** A point on the ground at progress s, dx metres to the side of the trail. */
export function groundPoint(s: number, dx: number) {
  const x = trailX(s) + dx
  const z = -s * JOURNEY_LENGTH
  return new Vector3(x, groundHeight(x, z), z)
}

export const greyBoxRoute: Route = {
  length: JOURNEY_LENGTH,
  lateral: trailX,
  ground: groundHeight,
}

const c = (hex: string) => new Color(hex)

/** Colour of flat ground along the journey. */
const FLAT_GROUND: ReadonlyArray<Stop<Color>> = [
  [0.0, c('#6a6358')], // ref GOPR2990: grey-brown gravel of the hut's bowl
  [0.09, c('#6a6358')],
  [0.11, c('#4a4c39')], // ref GOPR2999: shaded conifer green
  [0.2, c('#4a4c39')],
  [0.23, c('#6e735b')], // ref GOPR2999: sunlit meadow, olive and hazy
  [0.28, c('#6e735b')],
  [0.31, c('#bfb6ab')], // ref GOPR2986: pale limestone scree
  [0.48, c('#bfb6ab')],
  [0.53, c('#6e735b')], // meadows again below the pass
  [0.8, c('#6e735b')],
  [0.87, c('#7d7a5a')], // default: delta flats
  [0.93, c('#d8caa0')], // default: sand
]

/** Colour of steep ground: bare rock in the mountains, wooded slopes lower down. */
const STEEP_GROUND: ReadonlyArray<Stop<Color>> = [
  [0.0, c('#605b55')], // ref GOPR3025: warm grey rock
  [0.3, c('#8b8477')], // ref GOPR2986: sunlit rock
  [0.5, c('#7c7c7e')], // ref GOPR3025
  [0.62, c('#5b5d4a')], // default: wooded slopes
  [0.9, c('#7a715f')], // default: low cliffs by the sea
]

const SAND = c('#d8caa0')

// A flat grid bent into shape: each vertex is lifted to groundHeight, then
// coloured by where it is on the journey and how steep it is. ~12 m between vertices.
export function buildTerrainGeometry() {
  const geometry = new PlaneGeometry(1800, 4400, 150, 366)
  geometry.rotateX(-Math.PI / 2) // lie flat: the plane's y axis becomes -z
  geometry.translate(0, 0, -JOURNEY_LENGTH / 2) // centre it on the journey

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
