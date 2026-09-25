import { useFrame } from '@react-three/fiber'
import { MathUtils, PerspectiveCamera, Vector3, type CatmullRomCurve3 } from 'three'
import type { MoveSample, Transition } from './cameraMove'
import { useJourneyProgress } from './journeyProgress'

/** The camera's normal field of view, in degrees. Camera moves zoom relative to this. */
export const BASE_FOV = 60
/** How far ahead along the path the traveller looks, in metres. */
const LOOK_AHEAD = 25
/** 1 = gaze follows the slope fully, 0 = gaze stays level. Softens steep climbs. */
const PITCH_FOLLOW = 0.35

// Scratch values reused every frame, so the render loop allocates nothing.
const tangent = new Vector3()
const target = new Vector3()
const sample: MoveSample = { fov: 1, yaw: 0, pitch: 0, roll: 0 }
const toRad = MathUtils.degToRad

type CameraRailProps = {
  path: CatmullRomCurve3
  transitions?: ReadonlyArray<Transition>
}

// First-person camera on rails (design doc §4.2, §12 Q5). Must sit inside
// <JourneyScroll>: every frame, the scroll offset (0–1) becomes t, the camera
// stands at path(t) and looks along the direction of travel. Where t falls
// inside a transition, that transition's camera move is layered on top.
export function CameraRail({ path, transitions = [] }: CameraRailProps) {
  const progress = useJourneyProgress()

  useFrame(({ camera }) => {
    const t = progress.current.offset
    path.getPointAt(t, camera.position)
    path.getTangentAt(t, tangent)
    target.copy(camera.position).addScaledVector(tangent, LOOK_AHEAD)
    target.y = camera.position.y + tangent.y * LOOK_AHEAD * PITCH_FOLLOW
    camera.lookAt(target)

    let zoom = 1
    let yaw = 0
    let pitch = 0
    let roll = 0
    for (const transition of transitions) {
      const u = (t - (transition.at - transition.span / 2)) / transition.span
      if (u <= 0 || u >= 1) continue
      const strength = transition.strength ?? 1
      transition.move(u, sample)
      zoom *= 1 + (sample.fov - 1) * strength
      yaw += sample.yaw * transition.side * strength
      pitch += sample.pitch * strength
      roll += sample.roll * transition.side * strength
    }
    // Turn the head after looking along the path: pan (y), glance up (x), tilt (z).
    // Negative yaw turns right, because three.js measures turns anticlockwise.
    camera.rotateY(toRad(-yaw))
    camera.rotateX(toRad(pitch))
    camera.rotateZ(toRad(-roll))

    if (camera instanceof PerspectiveCamera) {
      const fov = BASE_FOV * zoom
      if (Math.abs(camera.fov - fov) > 1e-4) {
        camera.fov = fov
        camera.updateProjectionMatrix()
      }
    }
  })

  return null
}
