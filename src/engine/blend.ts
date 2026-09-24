import type { Color } from 'three'

/** A value pinned to a point along the journey: [where (0–1), value]. */
export type Stop<T> = readonly [at: number, value: T]

export function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1)
  return t * t * (3 - 2 * t)
}

/**
 * Finds the two stops either side of `at` and how far (0–1, eased) we are
 * between them. Before the first stop or after the last, holds that value.
 */
export function bracket<T>(stops: ReadonlyArray<Stop<T>>, at: number): [T, T, number] {
  if (at <= stops[0][0]) return [stops[0][1], stops[0][1], 0]
  for (let i = 1; i < stops.length; i++) {
    if (at <= stops[i][0]) {
      return [stops[i - 1][1], stops[i][1], smoothstep(stops[i - 1][0], stops[i][0], at)]
    }
  }
  const last = stops[stops.length - 1][1]
  return [last, last, 0]
}

export function blendNumber(stops: ReadonlyArray<Stop<number>>, at: number) {
  const [a, b, u] = bracket(stops, at)
  return a + (b - a) * u
}

export function blendColor(stops: ReadonlyArray<Stop<Color>>, at: number, out: Color) {
  const [a, b, u] = bracket(stops, at)
  return out.lerpColors(a, b, u)
}
