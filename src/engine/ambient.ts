import { useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type { Vector3 } from 'three'

// The page only draws while it's scrolling (frameloop="demand"). Some things
// move by themselves, though: a water wheel, a windmill, gulls. Each registers a
// zone; while the camera is inside one, the ticker asks for frames at ~30 fps.
// Far from every zone, the page goes still again and costs nothing.

type Zone = { position: Vector3; radius: number }

const zones = new Set<Zone>()

/** Keeps frames coming while the camera is within `radius` metres of `position`. */
export function useAmbientZone(position: Vector3, radius: number) {
  useEffect(() => {
    const zone = { position, radius }
    zones.add(zone)
    return () => {
      zones.delete(zone)
    }
  }, [position, radius])
}

const FRAME_MS = 1000 / 30
/** One pending request at a time, so scrolling and ambient frames never stack up. */
let pending = false

export function AmbientTicker() {
  const invalidate = useThree((state) => state.invalidate)
  useFrame(({ camera }) => {
    if (pending) return
    for (const zone of zones) {
      if (camera.position.distanceTo(zone.position) < zone.radius) {
        pending = true
        setTimeout(() => {
          pending = false
          invalidate()
        }, FRAME_MS)
        return
      }
    }
  })
  return null
}
