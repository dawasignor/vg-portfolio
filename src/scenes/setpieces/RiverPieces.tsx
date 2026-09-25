import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, Object3D, Vector3, type Group, type InstancedMesh } from 'three'
import { useAmbientZone } from '../../engine/ambient'
import { seededRandom } from '../../engine/random'
import { Building } from '../segments/props'
import { ahead, groundPoint, JOURNEY_LENGTH, RIVERS, riverLevel, riverX } from '../greybox/terrain'
import type { SetPieceProps } from './types'

const RIVER = RIVERS.foothill
/** How fast the foothill river runs, in metres per second. */
const FLOW = 1.2

const SEDIMENT_COLOURS = ['#6b5b47', '#7d6e5a', '#5c554c', '#8a7a62'].map((hex) => new Color(hex))
// Scratch object reused every frame, so the loop allocates nothing.
const dummy = new Object3D()

// Contaminant Transport Modelling: rocks and sediment carried down the river
// toward the reader, some sinking and settling as they travel, then new ones
// arriving from upstream. Placed where the camera looks when it turns left.
export function SedimentFlow({ s }: SetPieceProps) {
  const mesh = useRef<InstancedMesh>(null)
  const count = 50
  const centre = ahead(s, 35)
  const reach = 70 / JOURNEY_LENGTH // travel from 70 m upstream to 70 m downstream
  const zone = useMemo(() => groundPoint(centre, -30), [centre])
  useAmbientZone(zone, 160)

  const grains = useMemo(() => {
    const random = seededRandom(91)
    return Array.from({ length: count }, () => ({
      phase: random(),
      lane: (random() - 0.5) * 1.2, // across the stream, in river half-widths
      size: 0.45 + random() ** 2 * 0.8,
      sinks: random() < 0.4, // some settle out before they leave the stretch
      spin: random() * 3,
    }))
  }, [])

  useLayoutEffect(() => {
    const rocks = mesh.current
    if (!rocks) return
    grains.forEach((_, i) => rocks.setColorAt(i, SEDIMENT_COLOURS[i % SEDIMENT_COLOURS.length]))
    if (rocks.instanceColor) rocks.instanceColor.needsUpdate = true
  }, [grains])

  useFrame(({ clock }) => {
    const rocks = mesh.current
    if (!rocks) return
    const time = clock.elapsedTime
    const span = 2 * reach * JOURNEY_LENGTH
    grains.forEach((grain, i) => {
      const travelled = (time * FLOW + grain.phase * span) % span // metres downstream
      const along = centre + reach - travelled / JOURNEY_LENGTH
      const x = riverX(RIVER, along) + grain.lane * RIVER.width(along)
      const sink = grain.sinks ? Math.min(travelled / span, 1) * 1.4 : 0
      const y = riverLevel(along) + 0.1 - sink + Math.sin(time * 2 + grain.phase * 9) * 0.1
      dummy.position.set(x, y, -along * JOURNEY_LENGTH)
      dummy.rotation.set(time * grain.spin, grain.phase * 6, time * 0.5)
      dummy.scale.setScalar(grain.size)
      dummy.updateMatrix()
      rocks.setMatrixAt(i, dummy.matrix)
    })
    rocks.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial flatShading />
    </instancedMesh>
  )
}

const VILLAGE = [
  { metres: 20, dx: -52, rotation: 0.3 },
  { metres: 32, dx: -66, rotation: -0.2 },
  { metres: 48, dx: -58, rotation: 0.1 },
  { metres: 60, dx: -80, rotation: 0.5 },
  { metres: 70, dx: -14, rotation: -0.1 },
]

const WHEEL_RADIUS = 3.4
const WOOD = '#8a6d4d' // default

// Sustainable River Basin Management: a village along the river, and a mill
// whose wheel turns at the speed of the water (ω = flow / radius).
export function RiverVillage({ s }: SetPieceProps) {
  const at = ahead(s, 38)
  const wheelCentre = useMemo(() => {
    const x = riverX(RIVER, at) + RIVER.width(at) - 0.8 // just inside the near bank
    return new Vector3(x, riverLevel(at) + WHEEL_RADIUS - 1.2, -at * JOURNEY_LENGTH)
  }, [at])
  useAmbientZone(wheelCentre, 150)

  const wheel = useRef<Group>(null)
  useFrame(({ clock }) => {
    // The bottom of the wheel moves with the current, toward the reader (+z).
    if (wheel.current) wheel.current.rotation.x = -clock.elapsedTime * (FLOW / WHEEL_RADIUS)
  })

  return (
    <>
      <group position={wheelCentre}>
        <group ref={wheel}>
          {/* The rim, standing upright across the current. */}
          <mesh rotation-y={Math.PI / 2}>
            <torusGeometry args={[WHEEL_RADIUS, 0.18, 6, 24]} />
            <meshStandardMaterial color={WOOD} flatShading />
          </mesh>
          {Array.from({ length: 8 }, (_, i) => (
            <mesh key={i} rotation-x={(i / 8) * Math.PI}>
              <boxGeometry args={[1.6, 0.1, WHEEL_RADIUS * 2]} />
              <meshStandardMaterial color={WOOD} flatShading />
            </mesh>
          ))}
        </group>
        {/* The axle, into the mill. */}
        <mesh position-x={2.2} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.2, 0.2, 4.4, 8]} />
          <meshStandardMaterial color={WOOD} />
        </mesh>
      </group>
      <Building s={at} dx={-17.5} width={6} depth={5} height={4.5} rotation={0} />
      {VILLAGE.map((house) => (
        <Building
          key={house.metres}
          s={ahead(s, house.metres)}
          dx={house.dx}
          width={8}
          depth={6}
          height={5}
          rotation={house.rotation}
        />
      ))}
    </>
  )
}
