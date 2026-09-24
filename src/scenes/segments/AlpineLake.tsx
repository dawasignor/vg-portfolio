import type { SegmentProps } from '../../engine/segments'
import { Boulders, Spires, type SpireSpec } from './props'

// A lake on a flat bench, towers rising behind it as you approach. The water
// itself is part of the landscape (see greybox/terrain.ts, LAKE).
// ref GOPR2990: the pool by the hut, towers above it.

const TOWERS: ReadonlyArray<SpireSpec> = [
  // Beyond the lake (u > 1), on the line of sight from the brow.
  { u: 1.3, dx: -100, height: 150, radius: 20 },
  { u: 1.45, dx: -135, height: 180, radius: 24, lean: 0.03 },
  // Across from it, on the right.
  { u: 0.9, dx: 150, height: 135, radius: 19 },
]

export function AlpineLake({ segment }: SegmentProps) {
  return (
    <>
      <Spires segment={segment} specs={TOWERS} seed={31} />
      <Boulders from={segment.from} to={segment.to} count={150} seed={33} maxOffset={90} />
    </>
  )
}
