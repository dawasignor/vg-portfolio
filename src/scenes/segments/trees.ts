import {
  BufferAttribute,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DodecahedronGeometry,
  type BufferGeometry,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { blendNumber, type Stop } from '../../engine/blend'

// The trees of the Dolomites, from the owner's list (sources: guidedolomiti.com,
// "Trees of the Dolomites"; Britannica, "Italy: Plant life"). Each species is one
// low-poly shape built from a few cones, cylinders and rounded blobs, coloured per
// part (trunk vs. foliage), so one instanced mesh draws every tree of that species.

export type Species = 'norway-spruce' | 'silver-fir' | 'larch' | 'scots-pine' | 'mountain-pine'
export const SPECIES: ReadonlyArray<Species> = ['norway-spruce', 'silver-fir', 'larch', 'scots-pine', 'mountain-pine']

const BARK = '#4a3a2c' // default
const PINE_BARK = '#a0623a' // default: Scots pine's orange upper bark
const SPRUCE = '#2e4631' // default: dark, dense green
const FIR = '#3d5a4b' // default: bluer, with a silvery cast
const LARCH_GOLD = '#c49a3c' // default: larch in autumn, before the needles drop
const PINE_CROWN = '#4a5d36' // default
const MOUNTAIN_PINE = '#34482c' // default

/** One part of a tree: a primitive, coloured, scaled and moved into place. */
function part(geometry: BufferGeometry, hex: string, y: number, x = 0, z = 0, scaleY = 1) {
  const g = geometry.toNonIndexed()
  g.scale(1, scaleY, 1)
  g.translate(x, y, z)
  const colour = new Color(hex)
  const colours = new Float32Array(g.attributes.position.count * 3)
  for (let i = 0; i < colours.length; i += 3) colour.toArray(colours, i)
  g.setAttribute('color', new BufferAttribute(colours, 3))
  return g
}

const trunk = (radius: number, height: number, hex = BARK) =>
  part(new CylinderGeometry(radius * 0.7, radius, height, 6), hex, height / 2)
const tier = (radius: number, height: number, y: number, hex: string) =>
  part(new ConeGeometry(radius, height, 7), hex, y)
const blob = (radius: number, hex: string, y: number, x = 0, z = 0, squash = 1) =>
  part(new DodecahedronGeometry(radius, 0), hex, y, x, z, squash)

/** Tree shapes, base at the origin, roughly to scale in metres. */
export function buildTreeGeometry(species: Species): BufferGeometry {
  const parts: BufferGeometry[] = (() => {
    switch (species) {
      case 'norway-spruce': // tall and narrow, drooping tiers: lower and middle slopes
        return [
          trunk(0.25, 2.5),
          tier(3.0, 5.0, 4.0, SPRUCE),
          tier(2.4, 4.4, 6.6, SPRUCE),
          tier(1.8, 4.0, 9.0, SPRUCE),
          tier(1.1, 3.6, 11.3, SPRUCE),
        ]
      case 'silver-fir': // broader, flatter tiers, a blunt top
        return [
          trunk(0.3, 3),
          tier(3.5, 3.8, 4.6, FIR),
          tier(2.8, 3.4, 7.0, FIR),
          tier(1.9, 3.0, 9.2, FIR),
          tier(0.9, 2.0, 10.9, FIR),
        ]
      case 'larch': // airy and open, golden in autumn: higher slopes
        return [
          trunk(0.22, 4),
          part(new ConeGeometry(2.3, 9.5, 5), LARCH_GOLD, 7.6),
          part(new ConeGeometry(1.6, 6, 5), LARCH_GOLD, 9.6, 0.4, -0.3),
        ]
      case 'scots-pine': // a tall bare orange trunk under a rounded crown
        return [
          trunk(0.3, 9, PINE_BARK),
          blob(2.6, PINE_CROWN, 9.6, 0, 0, 0.55),
          blob(1.9, PINE_CROWN, 10.8, 0.9, 0.5, 0.6),
          blob(1.6, PINE_CROWN, 10.4, -1.0, -0.4, 0.6),
        ]
      case 'mountain-pine': // low, sprawling shrub on rock and scree
        return [
          blob(1.5, MOUNTAIN_PINE, 1.0, 0, 0, 0.7),
          blob(1.2, MOUNTAIN_PINE, 0.9, 1.4, 0.4, 0.7),
          blob(1.1, MOUNTAIN_PINE, 0.8, -1.2, -0.6, 0.7),
          blob(0.9, MOUNTAIN_PINE, 1.6, 0.3, -0.2, 0.7),
        ]
    }
  })()
  const merged = mergeGeometries(parts)
  if (!merged) throw new Error(`Could not build ${species}`)
  return merged
}

// How common each species is by ground elevation (metres). Spruce and fir own the
// lower and middle slopes; larch rises above them; mountain pine takes the high,
// rocky ground; Scots pine grows on the dry, lower ground.
const MIX: Record<Species, ReadonlyArray<Stop<number>>> = {
  'norway-spruce': [[0, 0.35], [80, 0.45], [160, 0.3], [230, 0.05]],
  'silver-fir': [[0, 0.15], [80, 0.35], [160, 0.15], [230, 0.0]],
  larch: [[0, 0.05], [80, 0.1], [160, 0.35], [230, 0.35]],
  'scots-pine': [[0, 0.45], [80, 0.1], [160, 0.05], [230, 0.05]],
  'mountain-pine': [[0, 0.0], [80, 0.0], [160, 0.15], [230, 0.55]],
}

/** Picks a species for ground at `elevation`, given a random number 0–1. */
export function pickSpecies(elevation: number, roll: number): Species {
  const weights = SPECIES.map((sp) => blendNumber(MIX[sp], elevation))
  const total = weights.reduce((a, b) => a + b, 0)
  let r = roll * total
  for (let i = 0; i < SPECIES.length; i++) {
    r -= weights[i]
    if (r <= 0) return SPECIES[i]
  }
  return SPECIES[0]
}
