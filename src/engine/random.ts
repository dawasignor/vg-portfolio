/**
 * A small seeded random generator (mulberry32). Same seed, same sequence, so
 * procedural scenery lands in the same place on every load.
 */
export function seededRandom(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** A stable 0–1 value for a point in space; equal points get equal values. */
export function hash3(x: number, y: number, z: number, seed: number) {
  const h = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719 + seed * 0.618) * 43758.5453
  return h - Math.floor(h)
}
