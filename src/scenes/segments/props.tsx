import { useLayoutEffect, useMemo, useRef } from 'react'
import {
  CatmullRomCurve3,
  Color,
  type BufferGeometry,
  CylinderGeometry,
  Object3D,
  TubeGeometry,
  Vector3,
  type InstancedMesh,
} from 'three'
import { hash3, seededRandom } from '../../engine/random'
import { within, type Segment } from '../../engine/segments'
import { groundHeight, groundPoint, isWater, JOURNEY_LENGTH, trailElevation, trailX } from '../greybox/terrain'
import { buildTreeGeometry, pickSpecies, SPECIES, type Species } from './trees'

// Reusable grey-box props. Shapes and colours follow the reference photos
// ("ref") where they exist; everything is a placeholder for the v0.6 art pass.

const LIMESTONE = '#b3ab9e' // ref GOPR2986, GOPR3025: pale, warm grey towers
const HUT_WALL = '#d9d2c3' // ref GOPR2917
const HUT_ROOF = '#3a3d3e' // ref GOPR2990
const VILLAGE_ROOF = '#8a5a44' // default
const BIVOUAC_METAL = '#505256' // ref GOPR3001
const CROSS_WOOD = '#27241d' // ref GOPR2915
const BOULDER = '#645d55' // ref GOPR2915
const DEAD_WOOD = '#1d1a17' // ref GOPR2958: roots in silhouette
const ROCK_LIGHT = '#8b8477' // ref GOPR2986
const ROCK_DARK = '#605b55' // ref GOPR3025
const SIGN_POST = '#8a8070' // ref GOPR2997
const SIGN_BOARD = '#e8e4dc' // ref GOPR2997
const SIGN_STRIPE = '#b23a2e' // ref GOPR2997: red-and-white trail marks

/** One limestone tower: where it stands (u through its segment, dx from the trail) and its size. */
export type SpireSpec = { u: number; dx: number; height: number; radius: number; lean?: number }

// A tapered column with every vertex nudged by a stable hash, so the faces
// break up into the fractured, vertical look of limestone towers.
function spireGeometry({ height, radius, lean = 0 }: SpireSpec, seed: number) {
  const geometry = new CylinderGeometry(radius * 0.18, radius, height, 7, 10)
  geometry.translate(0, height / 2, 0)
  const p = geometry.attributes.position
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i)
    const y = p.getY(i)
    const z = p.getZ(i)
    const k = y / height // 0 at the base, 1 at the tip
    const jag = radius * 0.3 * (0.35 + k)
    p.setXYZ(
      i,
      x + (hash3(x, y, z, seed) - 0.5) * jag + lean * k * height,
      y + (hash3(z, x, y, seed + 1) - 0.5) * height * 0.04,
      z + (hash3(y, z, x, seed + 2) - 0.5) * jag,
    )
  }
  geometry.computeVertexNormals()
  return geometry
}

export function Spires({ segment, specs, seed }: { segment: Segment; specs: ReadonlyArray<SpireSpec>; seed: number }) {
  const spires = useMemo(
    () =>
      specs.map((spec, i) => {
        const position = groundPoint(within(segment, spec.u), spec.dx)
        position.y -= 6 // sunk a little so the base never floats on a slope
        return { geometry: spireGeometry(spec, seed + i * 3), position }
      }),
    [segment, specs, seed],
  )
  return (
    <>
      {spires.map(({ geometry, position }, i) => (
        <mesh key={i} geometry={geometry} position={position}>
          <meshStandardMaterial color={LIMESTONE} flatShading />
        </mesh>
      ))}
    </>
  )
}

type BuildingProps = {
  s: number
  dx: number
  width: number
  depth: number
  height: number
  rotation?: number
  roof?: string
}

// A box with a hipped roof: the mountain hut, or a village house.
export function Building({ s, dx, width, depth, height, rotation = 0, roof = VILLAGE_ROOF }: BuildingProps) {
  const position = useMemo(() => groundPoint(s, dx), [s, dx])
  const roofHeight = Math.min(width, depth) * 0.45
  return (
    <group position={position} rotation-y={rotation}>
      <mesh position-y={height / 2 - 1}>
        <boxGeometry args={[width, height + 2, depth]} />
        <meshStandardMaterial color={HUT_WALL} flatShading />
      </mesh>
      {/* A four-sided cone, turned 45° and stretched to the footprint. */}
      <group position-y={height - 1 + roofHeight / 2} scale={[width / depth, 1, 1]}>
        <mesh rotation-y={Math.PI / 4}>
          <coneGeometry args={[(depth / Math.SQRT2) * 1.1, roofHeight, 4]} />
          <meshStandardMaterial color={roof} flatShading />
        </mesh>
      </group>
    </group>
  )
}

export function MountainHut({ s, dx, rotation }: { s: number; dx: number; rotation?: number }) {
  return <Building s={s} dx={dx} width={22} depth={12} height={14} rotation={rotation} roof={HUT_ROOF} />
}

// The metal-clad bivouac on the ridge: a steep four-sided pyramid.
export function Bivouac({ s, dx }: { s: number; dx: number }) {
  const position = useMemo(() => groundPoint(s, dx), [s, dx])
  return (
    <mesh position={[position.x, position.y + 4, position.z]} rotation-y={Math.PI / 4}>
      <coneGeometry args={[4.5, 9, 4]} />
      <meshStandardMaterial color={BIVOUAC_METAL} metalness={0.6} roughness={0.4} flatShading />
    </mesh>
  )
}

export function SummitCross({ s, dx }: { s: number; dx: number }) {
  const position = useMemo(() => groundPoint(s, dx), [s, dx])
  return (
    <group position={position}>
      <mesh position-y={0.8}>
        <dodecahedronGeometry args={[2.2]} />
        <meshStandardMaterial color={BOULDER} flatShading />
      </mesh>
      <mesh position-y={4.5}>
        <boxGeometry args={[0.18, 5.5, 0.18]} />
        <meshStandardMaterial color={CROSS_WOOD} />
      </mesh>
      <mesh position-y={5.6}>
        <boxGeometry args={[2.4, 0.18, 0.18]} />
        <meshStandardMaterial color={CROSS_WOOD} />
      </mesh>
    </group>
  )
}

export function Signpost({ s, dx }: { s: number; dx: number }) {
  const position = useMemo(() => groundPoint(s, dx), [s, dx])
  return (
    <group position={position} rotation-y={0.4}>
      <mesh position-y={1.2}>
        <cylinderGeometry args={[0.06, 0.07, 2.4, 6]} />
        <meshStandardMaterial color={SIGN_POST} />
      </mesh>
      {[1.9, 1.65, 1.4].map((y, i) => (
        <group key={y} position-y={y} rotation-y={i % 2 ? 0.5 : -0.3}>
          <mesh position-x={0.45}>
            <boxGeometry args={[0.9, 0.16, 0.03]} />
            <meshStandardMaterial color={SIGN_BOARD} />
          </mesh>
          <mesh position-x={0.86}>
            <boxGeometry args={[0.12, 0.16, 0.035]} />
            <meshStandardMaterial color={SIGN_STRIPE} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// Gnarled dead roots: a few thick, twisting branches from one stump.
export function DeadRoots({ s, dx, seed }: { s: number; dx: number; seed: number }) {
  const { position, branches } = useMemo(() => {
    const random = seededRandom(seed)
    const branches = []
    for (let b = 0; b < 5; b++) {
      let angle = random() * Math.PI * 2
      const point = new Vector3()
      const points = [point.clone()]
      for (let k = 0; k < 5; k++) {
        angle += (random() - 0.5) * 1.2
        point.x += Math.cos(angle) * 0.5
        point.z += Math.sin(angle) * 0.5
        point.y += 0.25 + random() * 0.55
        points.push(point.clone())
      }
      branches.push(new TubeGeometry(new CatmullRomCurve3(points), 20, 0.2 - b * 0.025, 5))
    }
    return { position: groundPoint(s, dx), branches }
  }, [s, dx, seed])

  return (
    <group position={position}>
      <mesh position-y={0.3}>
        <cylinderGeometry args={[0.3, 0.45, 0.8, 6]} />
        <meshStandardMaterial color={DEAD_WOOD} flatShading />
      </mesh>
      {branches.map((geometry, i) => (
        <mesh key={i} geometry={geometry}>
          <meshStandardMaterial color={DEAD_WOOD} flatShading />
        </mesh>
      ))}
    </group>
  )
}

type ConiferProps = {
  from: number
  to: number
  count: number
  seed: number
  /** Trees only grow between these heights, in metres relative to the trail. */
  band?: readonly [below: number, above: number]
  minOffset?: number
  maxOffset?: number
}

// A mixed mountain forest: each tree's species comes from its elevation (see
// trees.ts), and each species is one InstancedMesh, so a forest of hundreds of
// trees is five draw calls. Every tree gets its own position, size, turn and shade.
export function Conifers({ from, to, count, seed, band = [-40, 140], minOffset = 28, maxOffset = 380 }: ConiferProps) {
  const meshes = useRef<Partial<Record<Species, InstancedMesh | null>>>({})
  const shapes = useMemo(() => Object.fromEntries(SPECIES.map((sp) => [sp, buildTreeGeometry(sp)])) as Record<Species, BufferGeometry>, [])

  useLayoutEffect(() => {
    const random = seededRandom(seed)
    const dummy = new Object3D()
    const shade = new Color()
    const placed: Record<Species, number> = { 'norway-spruce': 0, 'silver-fir': 0, larch: 0, 'scots-pine': 0, 'mountain-pine': 0 }
    let total = 0
    for (let attempt = 0; attempt < count * 4 && total < count; attempt++) {
      const s = from + (to - from) * random()
      const side = random() < 0.5 ? -1 : 1
      const dx = side * (minOffset + (maxOffset - minOffset) * random() ** 1.5)
      const x = trailX(s) + dx
      const z = -s * JOURNEY_LENGTH
      const y = groundHeight(x, z)
      const height = y - trailElevation(s)
      if (height < band[0] || height > band[1] || isWater(x, z)) continue
      const species = pickSpecies(y, random())
      const trees = meshes.current[species]
      if (!trees) continue
      const size = 0.7 + random() * 0.7
      dummy.position.set(x, y - 0.3, z)
      dummy.scale.set(size, size * (0.9 + random() * 0.3), size)
      dummy.rotation.y = random() * Math.PI * 2
      dummy.updateMatrix()
      trees.setMatrixAt(placed[species], dummy.matrix)
      // A small tint per tree, multiplied into the species' own colours.
      const v = 0.88 + random() * 0.24
      trees.setColorAt(placed[species], shade.setRGB(v, v, v))
      placed[species]++
      total++
    }
    for (const sp of SPECIES) {
      const trees = meshes.current[sp]
      if (!trees) continue
      trees.count = placed[sp]
      trees.instanceMatrix.needsUpdate = true
      if (trees.instanceColor) trees.instanceColor.needsUpdate = true
    }
  }, [from, to, count, seed, band, minOffset, maxOffset])

  return (
    <>
      {SPECIES.map((sp) => (
        <instancedMesh
          key={sp}
          ref={(el) => void (meshes.current[sp] = el)}
          args={[shapes[sp], undefined, count]}
        >
          <meshStandardMaterial vertexColors flatShading />
        </instancedMesh>
      ))}
    </>
  )
}

type BoulderProps = { from: number; to: number; count: number; seed: number; maxOffset?: number }

// Scree and boulders, densest beside the trail: the foreground of almost every
// reference photo (ref GOPR2956–2961, GOPR2997, GOPR3025). One draw call.
export function Boulders({ from, to, count, seed, maxOffset = 120 }: BoulderProps) {
  const mesh = useRef<InstancedMesh>(null)

  useLayoutEffect(() => {
    const rocks = mesh.current
    if (!rocks) return
    const random = seededRandom(seed)
    const dummy = new Object3D()
    const light = new Color(ROCK_LIGHT)
    const dark = new Color(ROCK_DARK)
    const shade = new Color()
    let placed = 0
    for (let attempt = 0; attempt < count * 3 && placed < count; attempt++) {
      const s = from + (to - from) * random()
      const size = 0.3 + random() ** 3 * 2.6
      const side = random() < 0.5 ? -1 : 1
      const dx = side * (2 + size + (maxOffset - size) * random() ** 2) // keeps the trail clear
      const x = trailX(s) + dx
      const z = -s * JOURNEY_LENGTH
      if (isWater(x, z)) continue
      dummy.position.set(x, groundHeight(x, z) - size * 0.3, z)
      dummy.scale.set(size * (0.8 + random() * 0.5), size * (0.6 + random() * 0.4), size * (0.8 + random() * 0.5))
      dummy.rotation.set(random() * 3, random() * 3, random() * 3)
      dummy.updateMatrix()
      rocks.setMatrixAt(placed, dummy.matrix)
      rocks.setColorAt(placed, shade.lerpColors(light, dark, random()))
      placed++
    }
    rocks.count = placed
    rocks.instanceMatrix.needsUpdate = true
    if (rocks.instanceColor) rocks.instanceColor.needsUpdate = true
  }, [from, to, count, seed, maxOffset])

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial flatShading />
    </instancedMesh>
  )
}
