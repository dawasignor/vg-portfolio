import { useFrame } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'
import { Vector3, type CatmullRomCurve3 } from 'three'

/** How far ahead along the path the traveller looks, in metres. */
const LOOK_AHEAD = 25
/** 1 = gaze follows the slope fully, 0 = gaze stays level. Softens steep climbs. */
const PITCH_FOLLOW = 0.35

// Scratch vectors reused every frame, so the render loop allocates nothing.
const tangent = new Vector3()
const target = new Vector3()

// First-person camera on rails (design doc §4.2, §12 Q5). Must sit inside
// <ScrollControls>: every frame, the scroll offset (0–1) becomes t, the camera
// stands at path(t) and looks along the direction of travel.
export function CameraRail({ path }: { path: CatmullRomCurve3 }) {
  const scroll = useScroll()

  useFrame(({ camera }) => {
    const t = scroll.offset
    path.getPointAt(t, camera.position)
    path.getTangentAt(t, tangent)
    target.copy(camera.position).addScaledVector(tangent, LOOK_AHEAD)
    target.y = camera.position.y + tangent.y * LOOK_AHEAD * PITCH_FOLLOW
    camera.lookAt(target)
  })

  return null
}
