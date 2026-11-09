import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3, type Group, type Mesh } from 'three'
import { useAmbientZone } from '../../engine/ambient'
import { smoothstep } from '../../engine/blend'
import { useJourneyProgress } from '../../engine/journeyProgress'
import { ahead, groundPoint, JOURNEY_LENGTH, trailElevation, trailX } from '../greybox/terrain'
import type { SetPieceProps } from './types'

const WHITE = '#f4f2ee' // default
const WINDOWS = '#2b3440' // default
const STEEL = '#7c7f84' // default
const BALL = '#c8642c' // default

// Words over the scene are plain page elements, created and removed with the set
// piece, and moved every frame to where their 3D anchor appears on screen. They use
// the page's own fonts, so nothing is fetched from elsewhere. They live on <body>,
// outside React's #root: React must be the only one adding or removing children there.
const projected = new Vector3()
const trainTail = new Vector3()

function useOverlayWords(text: string, className: string) {
  const element = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const div = document.createElement('div')
    div.className = className
    div.textContent = text
    div.style.opacity = '0'
    document.body.appendChild(div)
    element.current = div
    return () => {
      div.remove()
      element.current = null
    }
  }, [text, className])
  return element
}

/** Places a page element over a 3D point. Returns false if the point is behind the camera. */
function placeOver(div: HTMLDivElement, point: Vector3, camera: Parameters<Vector3['project']>[0], width: number, height: number) {
  projected.copy(point).project(camera)
  const inFront = projected.z < 1
  div.style.left = `${((projected.x + 1) / 2) * width}px`
  div.style.top = `${((1 - projected.y) / 2) * height}px`
  div.style.visibility = inFront ? 'visible' : 'hidden'
  return inFront
}

/** How much of the journey a crossing takes: about 6 mouse-wheel notches. */
const CROSSING = 0.05

/** Where a scroll-linked crossing is: <0 not started, 0–1 crossing, >1 done. */
function crossing(offset: number, t: number) {
  return (offset - (t - CROSSING * 0.25)) / CROSSING
}

/** "right-to-left" (default) or "left-to-right": +1 means moving toward +x. */
function heading(params: Record<string, unknown>) {
  return params.direction === 'left-to-right' ? 1 : -1
}

// A plane crossing the sky ahead as the reader scrolls, writing words behind it
// in cloud. The words are page text laid over the scene, revealed from the side
// the plane came from, so no font files are fetched or bundled.
export function SkyWriting({ s, t, params }: SetPieceProps) {
  const text = String(params.text ?? '')
  const dir = heading(params)
  const progress = useJourneyProgress()
  const plane = useRef<Group>(null)
  const wordsRef = useOverlayWords(text, 'sky-writing')

  const sky = useMemo(() => {
    const p = groundPoint(ahead(s, 520), 0)
    p.y = trailElevation(s) + 150
    return p
  }, [s])
  const HALF_SPAN = 520

  // The words sit just under the plane's path, like a trail it has drawn.
  const anchor = useMemo(() => new Vector3(sky.x, sky.y + 4, sky.z), [sky])

  useFrame(({ camera, size }) => {
    const u = crossing(progress.current.offset, t)
    const k = Math.min(Math.max(u, 0), 1)
    if (plane.current) {
      plane.current.visible = u > 0 && u < 1.1
      plane.current.position.set(sky.x + dir * (-HALF_SPAN + 2 * HALF_SPAN * k), sky.y + 26, sky.z)
    }
    if (wordsRef.current) {
      placeOver(wordsRef.current, anchor, camera, size.width, size.height)
      const shown = smoothstep(0.1, 0.85, k) // the trail grows behind the plane
      const fade = 1 - smoothstep(1.15, 1.6, u) // and drifts away after it has gone
      wordsRef.current.style.opacity = u > 0 ? String(fade) : '0'
      const hidden = `${((1 - shown) * 100).toFixed(1)}%`
      wordsRef.current.style.clipPath = dir < 0 ? `inset(0 0 0 ${hidden})` : `inset(0 ${hidden} 0 0)`
    }
  })

  return (
    <>
      <group ref={plane} rotation-y={dir < 0 ? Math.PI : 0} scale={1.6} visible={false}>
        {/* Fuselage along +x (the nose), wings across, a tail fin. Drawn large to read at distance. */}
        <mesh rotation-z={Math.PI / 2}>
          <capsuleGeometry args={[2.4, 26, 4, 10]} />
          <meshStandardMaterial color={WHITE} flatShading />
        </mesh>
        <mesh position-x={1}>
          <boxGeometry args={[5, 0.6, 34]} />
          <meshStandardMaterial color={WHITE} flatShading />
        </mesh>
        <mesh position={[-13, 3.5, 0]}>
          <boxGeometry args={[4, 6, 0.6]} />
          <meshStandardMaterial color={WHITE} flatShading />
        </mesh>
      </group>
    </>
  )
}

const CAR_LENGTH = 24
const CARS = 4

// A bridge over the trail, and a bullet train crossing it as the reader scrolls,
// its words following behind.
export function TrainBridge({ s, t, params }: SetPieceProps) {
  const text = String(params.text ?? '')
  const dir = heading({ direction: params.direction ?? 'left-to-right' })
  const progress = useJourneyProgress()
  const train = useRef<Group>(null)
  const wordsRef = useOverlayWords(text, 'sky-writing sky-writing--small')

  const bridge = useMemo(() => {
    const at = ahead(s, 260) // far enough ahead that the crossing happens in view
    const x = trailX(at)
    const z = -at * JOURNEY_LENGTH
    // A viaduct at the height of where the reader stands, so the train crosses at eye
    // level ahead and the trail, going downhill, passes far beneath it.
    const deck = Math.max(trailElevation(at) + 24, trailElevation(s) + 14)
    const piers = [-34, 34].map((dx) => {
      const ground = groundPoint(at, dx).y
      return { x: x + dx, height: deck - ground, base: ground }
    })
    return { x, z, deck, piers }
  }, [s])
  const RUN = 200 // metres either side of the trail

  useFrame(({ camera, size }) => {
    // Starts earlier than the planes: the train crosses while the bridge is still
    // 200-400 m ahead, and the reader walks under the bridge afterwards.
    const u = (progress.current.offset - (t - CROSSING * 0.6)) / CROSSING
    const k = Math.min(Math.max(u, 0), 1)
    const x = bridge.x + dir * (-RUN + 2 * RUN * k)
    if (train.current) {
      train.current.visible = u > 0 && u < 1.05
      train.current.position.set(x, bridge.deck + 2.4, bridge.z)
    }
    if (wordsRef.current) {
      // The words ride just behind the last car.
      trainTail.set(x - dir * (CARS * (CAR_LENGTH + 1) + 30), bridge.deck + 4.5, bridge.z)
      placeOver(wordsRef.current, trainTail, camera, size.width, size.height)
      wordsRef.current.style.opacity = String(smoothstep(0.08, 0.3, u) * (1 - smoothstep(0.95, 1.2, u)))
    }
  })

  return (
    <>
      <mesh position={[bridge.x, bridge.deck, bridge.z]}>
        <boxGeometry args={[RUN * 2 + 60, 1.6, 9]} />
        <meshStandardMaterial color={STEEL} flatShading />
      </mesh>
      {bridge.piers.map((pier) => (
        <mesh key={pier.x} position={[pier.x, pier.base + pier.height / 2, bridge.z]}>
          <boxGeometry args={[3, pier.height, 5]} />
          <meshStandardMaterial color={STEEL} flatShading />
        </mesh>
      ))}
      <group ref={train} rotation-y={dir < 0 ? Math.PI : 0} visible={false}>
        {Array.from({ length: CARS }, (_, i) => (
          <group key={i} position-x={-i * (CAR_LENGTH + 1)}>
            <mesh>
              <boxGeometry args={[CAR_LENGTH, 3.6, 3.4]} />
              <meshStandardMaterial color={WHITE} flatShading />
            </mesh>
            <mesh position-y={0.5}>
              <boxGeometry args={[CAR_LENGTH - 2, 0.9, 3.5]} />
              <meshStandardMaterial color={WINDOWS} />
            </mesh>
          </group>
        ))}
        {/* The bullet nose. */}
        <mesh position-x={CAR_LENGTH / 2 + 4} rotation-z={-Math.PI / 2} scale={[1, 1, 0.95]}>
          <coneGeometry args={[1.9, 8, 10]} />
          <meshStandardMaterial color={WHITE} flatShading />
        </mesh>
      </group>
    </>
  )
}

const RIM = 3.05
const DROP_FROM = 4.6
const CYCLE = 2.6 // seconds per drop

// An easter egg, off to the side and never in focus: a basketball dropping
// through a hoop, bouncing, and dropping again.
export function Basketball({ s }: SetPieceProps) {
  const base = useMemo(() => groundPoint(ahead(s, 22), 9), [s])
  useAmbientZone(base, 90)
  const ball = useRef<Mesh>(null)

  useFrame(({ clock }) => {
    if (!ball.current) return
    const time = clock.elapsedTime % CYCLE
    const fall = Math.sqrt((2 * (DROP_FROM - 0.12)) / 9.8)
    let y: number
    if (time < fall) y = DROP_FROM - 0.5 * 9.8 * time * time // through the hoop
    else {
      const b = time - fall
      y = Math.max(0.12, 0.12 + 3.1 * b - 0.5 * 9.8 * b * b) // one bounce, then rest
    }
    ball.current.position.y = y
  })

  return (
    <group position={base}>
      <mesh position={[0.6, RIM / 2 + 0.3, 0]}>
        <cylinderGeometry args={[0.06, 0.06, RIM + 0.6, 6]} />
        <meshStandardMaterial color={STEEL} />
      </mesh>
      <mesh position={[0.5, RIM + 0.35, 0]}>
        <boxGeometry args={[0.05, 1.05, 1.8]} />
        <meshStandardMaterial color={WHITE} />
      </mesh>
      <mesh position={[0.2, RIM, 0]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.23, 0.02, 6, 16]} />
        <meshStandardMaterial color={BALL} />
      </mesh>
      <mesh ref={ball} position={[0.2, DROP_FROM, 0]}>
        <sphereGeometry args={[0.12, 12, 8]} />
        <meshStandardMaterial color={BALL} />
      </mesh>
    </group>
  )
}
