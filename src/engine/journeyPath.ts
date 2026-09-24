import { CatmullRomCurve3, Vector3 } from 'three'

/** How high the traveller's eyes are above the ground, in metres. */
export const EYE_HEIGHT = 1.7

/** Everything the engine needs to know about a landscape to walk through it. */
export type Route = {
  /** Metres from the start to the end of the journey, measured along -z. */
  length: number
  /** Sideways position of the trail at progress s (0 = start, 1 = end). */
  lateral: (s: number) => number
  /** Ground height in metres at any (x, z). */
  ground: (x: number, z: number) => number
}

// Samples the ground along the route and threads a smooth curve through the
// samples, one eye-height up. getPointAt(t) on the result moves at constant
// speed along the curve, t = 0 at the start and 1 at the end.
export function buildJourneyPath(route: Route, samples = 240): CatmullRomCurve3 {
  const points: Vector3[] = []
  for (let i = 0; i <= samples; i++) {
    const s = i / samples
    const x = route.lateral(s)
    const z = -s * route.length
    points.push(new Vector3(x, route.ground(x, z) + EYE_HEIGHT, z))
  }
  return new CatmullRomCurve3(points, false, 'centripetal')
}
