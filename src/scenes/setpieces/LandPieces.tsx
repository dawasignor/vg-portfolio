import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import { MathUtils, Vector3, type Group, type Mesh } from 'three'
import { useAmbientZone } from '../../engine/ambient'
import { smoothstep } from '../../engine/blend'
import { useJourneyProgress } from '../../engine/journeyProgress'
import { seededRandom } from '../../engine/random'
import { Signpost } from '../segments/props'
import { ahead, groundPoint, trailElevation } from '../greybox/terrain'
import type { SetPieceProps } from './types'

const CANVAS = '#b8733f' // default: tent canvas
const PLASTER = '#e2dccd' // default
const TIMBER = '#6f5a44' // default
const STONE = '#8b8477' // ref GOPR2986
const GULL = '#f1f0ec' // default
const CLOTH = '#5e6b78' // default: the well figure's clothes, plain and generic
const SKIN = '#a08a78' // default: a neutral, featureless head

// Base camp, and where the years before arrive: two side trails, one from each
// side, joining the main trail just ahead (design doc §6). Their own journeys are
// the "coming soon" tabs.
export function TrailJunction({ s }: SetPieceProps) {
  const join = ahead(s, 26)
  const trails = useMemo(() => {
    const side = (dir: 1 | -1) =>
      [
        [70, 150],
        [55, 90],
        [40, 40],
        [26, 0],
      ].map(([metres, dx]) => {
        const p = groundPoint(ahead(s, metres), dir * dx)
        return p.setY(p.y + 0.3)
      })
    return [side(-1), side(1)]
  }, [s])
  const tent = useMemo(() => groundPoint(ahead(s, 12), 9), [s])

  return (
    <>
      {trails.map((points, i) => (
        <Line key={i} points={points} color="#7a5a34" lineWidth={2} />
      ))}
      <Signpost s={join} dx={-3} />
      <Signpost s={join} dx={3} />
      <mesh position={[tent.x, tent.y + 1.1, tent.z]} rotation-y={Math.PI / 4}>
        <coneGeometry args={[2, 2.2, 4]} />
        <meshStandardMaterial color={CANVAS} flatShading />
      </mesh>
    </>
  )
}

// Physicochemical Treatment of Wastewater: a windmill on the rise to the right,
// its sails turning slowly.
export function Windmill({ s }: SetPieceProps) {
  const base = useMemo(() => groundPoint(ahead(s, 58), 45), [s])
  useAmbientZone(base, 200)
  const sails = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (sails.current) sails.current.rotation.z = clock.elapsedTime * 0.8
  })

  return (
    // Turned to face back down the valley, toward the reader.
    <group position={base} rotation-y={-0.6}>
      <mesh position-y={6}>
        <cylinderGeometry args={[1.6, 2.6, 12, 8]} />
        <meshStandardMaterial color={PLASTER} flatShading />
      </mesh>
      <mesh position-y={13.2}>
        <coneGeometry args={[2.2, 2.6, 8]} />
        <meshStandardMaterial color={TIMBER} flatShading />
      </mesh>
      <group ref={sails} position={[0, 11, 2.3]}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} rotation-z={(i * Math.PI) / 2} position={[0, 0, 0]}>
            <boxGeometry args={[0.9, 13, 0.08]} />
            <meshStandardMaterial color={PLASTER} flatShading />
          </mesh>
        ))}
        <mesh rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.35, 0.35, 0.8, 8]} />
          <meshStandardMaterial color={TIMBER} />
        </mesh>
      </group>
    </group>
  )
}

// Climate Adaptation and Coastal Engineering: gulls wheeling over the land that
// falls away to the sea on the right, some drifting in, some drifting off.
export function Seagulls({ s }: SetPieceProps) {
  const centre = useMemo(() => {
    const p = groundPoint(ahead(s, 60), 70)
    return new Vector3(p.x, trailElevation(s) + 20, p.z)
  }, [s])
  useAmbientZone(centre, 300)

  const gulls = useMemo(() => {
    const random = seededRandom(57)
    return Array.from({ length: 8 }, () => ({
      radius: 14 + random() * 30,
      speed: 0.18 + random() * 0.2,
      phase: random() * Math.PI * 2,
      height: random() * 14,
      drift: 0.05 + random() * 0.08, // how fast it wanders in and out
      flap: 5 + random() * 3,
    }))
  }, [])
  const birds = useRef<(Group | null)[]>([])

  useFrame(({ clock }) => {
    const time = clock.elapsedTime
    gulls.forEach((gull, i) => {
      const bird = birds.current[i]
      if (!bird) return
      const angle = gull.phase + time * gull.speed
      // Each circle breathes in and out, so gulls arrive and leave rather than orbit.
      const radius = gull.radius * (1 + 0.6 * Math.sin(time * gull.drift + gull.phase))
      bird.position.set(
        centre.x + Math.cos(angle) * radius,
        centre.y + gull.height + Math.sin(time * 0.5 + gull.phase) * 2,
        centre.z + Math.sin(angle) * radius,
      )
      bird.rotation.y = -angle // face along the circle
      // Flap, then glide: wings beat for part of each cycle and hold still otherwise.
      const beat = Math.max(0, Math.sin(time * 0.7 + gull.phase)) * Math.sin(time * gull.flap)
      const wings = bird.children as Mesh[]
      wings[1].rotation.z = 0.25 + beat * 0.6
      wings[2].rotation.z = -0.25 - beat * 0.6
    })
  })

  return (
    <>
      {gulls.map((_, i) => (
        // Drawn larger than life (×1.8), so they read at a distance.
        <group key={i} ref={(el) => void (birds.current[i] = el)} scale={1.8}>
          <mesh scale={[0.18, 0.18, 0.6]}>
            <sphereGeometry args={[1, 6, 4]} />
            <meshStandardMaterial color={GULL} flatShading />
          </mesh>
          <mesh position-x={0.5}>
            <boxGeometry args={[1, 0.04, 0.35]} />
            <meshStandardMaterial color={GULL} flatShading />
          </mesh>
          <mesh position-x={-0.5}>
            <boxGeometry args={[1, 0.04, 0.35]} />
            <meshStandardMaterial color={GULL} flatShading />
          </mesh>
        </group>
      ))}
    </>
  )
}

const BUCKET_DOWN = -3.4 // metres below the rim when the scene opens
const BUCKET_UP = 0.9

// Groundwater Engineering: a well near the river. A figure stands at it, seen
// from behind (GDPR: a generic person, no face), and hauls the bucket up as the
// reader scrolls toward the stop.
export function Well({ s, t }: SetPieceProps) {
  const progress = useJourneyProgress()
  const well = useMemo(() => groundPoint(ahead(s, 16), -12), [s])
  const bucket = useRef<Mesh>(null)
  const rope = useRef<Mesh>(null)
  const leftArm = useRef<Group>(null)
  const rightArm = useRef<Group>(null)

  useFrame(() => {
    // 0 when the stop is ~3.5% of the journey away, 1 on arrival.
    const pull = smoothstep(t - 0.035, t, progress.current.offset)
    const y = MathUtils.lerp(BUCKET_DOWN, BUCKET_UP, pull)
    if (bucket.current) bucket.current.position.y = y
    if (rope.current) {
      const length = 2.9 - y
      rope.current.scale.y = length
      rope.current.position.y = 2.9 - length / 2
    }
    // Hand over hand: the arms reach forward to the rope and alternate as it comes up.
    const swing = Math.sin(pull * Math.PI * 8) * 0.5
    if (leftArm.current) leftArm.current.rotation.x = 1.2 + swing
    if (rightArm.current) rightArm.current.rotation.x = 1.2 - swing
  })

  return (
    <group position={well}>
      <mesh position-y={0.45}>
        <cylinderGeometry args={[1.1, 1.2, 0.9, 14, 1, true]} />
        <meshStandardMaterial color={STONE} flatShading side={2} />
      </mesh>
      {[-1.2, 1.2].map((x) => (
        <mesh key={x} position={[x, 1.5, 0]}>
          <boxGeometry args={[0.15, 3, 0.15]} />
          <meshStandardMaterial color={TIMBER} />
        </mesh>
      ))}
      <mesh position-y={2.9} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.1, 0.1, 2.6, 8]} />
        <meshStandardMaterial color={TIMBER} />
      </mesh>
      <mesh ref={rope}>
        <cylinderGeometry args={[0.02, 0.02, 1, 4]} />
        <meshStandardMaterial color="#9c8a6a" />
      </mesh>
      <mesh ref={bucket}>
        <cylinderGeometry args={[0.22, 0.18, 0.35, 10]} />
        <meshStandardMaterial color={TIMBER} flatShading />
      </mesh>

      {/* The figure: on the trail side, facing the well (-x), so the reader sees its back. */}
      <group position={[1.7, 0, 0]} rotation-y={Math.PI / 2}>
        <mesh position-y={1.05}>
          <capsuleGeometry args={[0.22, 0.8, 4, 8]} />
          <meshStandardMaterial color={CLOTH} flatShading />
        </mesh>
        <mesh position-y={1.72}>
          <sphereGeometry args={[0.16, 8, 6]} />
          <meshStandardMaterial color={SKIN} flatShading />
        </mesh>
        {/* Arms hang from the shoulders, so they swing from there. */}
        {[
          { ref: leftArm, x: -0.24 },
          { ref: rightArm, x: 0.24 },
        ].map(({ ref, x }) => (
          <group key={x} ref={ref} position={[x, 1.45, 0]}>
            <mesh position-y={-0.32}>
              <capsuleGeometry args={[0.06, 0.55, 3, 6]} />
              <meshStandardMaterial color={CLOTH} flatShading />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  )
}

